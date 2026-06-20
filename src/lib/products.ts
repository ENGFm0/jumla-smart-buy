import { supabase } from "@/integrations/supabase/client";
import type {
  Category,
  PriceStats,
  PriceTier,
  Product,
  ProductDetail,
  ProductWithStats,
  Supplier,
} from "@/types";

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

// المورّد يضيف فئة من عنده
export async function addCategory(name: string): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .insert({ id: crypto.randomUUID(), name: name.trim(), icon: "Package" })
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from("products").select("category_id");
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) counts[row.category_id] = (counts[row.category_id] ?? 0) + 1;
  return counts;
}

function statsFromPrices(prices: number[]): PriceStats {
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  return {
    min_price: min,
    avg_price: Math.round(avg * 100) / 100,
    max_price: max,
    offers_count: prices.length,
  };
}

export async function getProductsWithStats(filter?: {
  search?: string;
  categoryId?: string;
  city?: string;
  ids?: string[];
}): Promise<ProductWithStats[]> {
  // 1) المنتجات المطابقة للفلاتر الأساسية
  let q = supabase.from("products").select("*").order("name");
  if (filter?.categoryId && filter.categoryId !== "all") q = q.eq("category_id", filter.categoryId);
  if (filter?.search) q = q.ilike("name", `%${filter.search}%`);
  if (filter?.ids) {
    if (filter.ids.length === 0) return [];
    q = q.in("id", filter.ids);
  }
  const { data, error } = await q;
  if (error) throw error;
  const products = (data ?? []) as Product[];
  if (products.length === 0) return [];

  // 2) عند فلترة المدينة: نحصر العروض على موردي تلك المدينة فقط
  let supplierIdsInCity: string[] | null = null;
  if (filter?.city && filter.city !== "all") {
    const { data: sup, error: supErr } = await supabase
      .from("suppliers")
      .select("id")
      .eq("city", filter.city);
    if (supErr) throw supErr;
    supplierIdsInCity = (sup ?? []).map((s) => s.id);
    if (supplierIdsInCity.length === 0) return [];
  }

  // 3) العروض المرتبطة بهذه المنتجات (مرتبة من الأرخص) مع بيانات المورّد
  let oq = supabase
    .from("offers")
    .select("product_id, price, supplier:suppliers(*)")
    .in(
      "product_id",
      products.map((p) => p.id),
    )
    .order("price", { ascending: true });
  if (supplierIdsInCity) oq = oq.in("supplier_id", supplierIdsInCity);
  const { data: offers, error: offersErr } = await oq;
  if (offersErr) throw offersErr;

  // 4) تجميع العروض لكل منتج: قائمة الأسعار + المورّد الأوفر (أول عرض لأنها مرتبة)
  const grouped = new Map<string, { prices: number[]; cheapest: Supplier | null }>();
  for (const o of (offers ?? []) as any[]) {
    const g = grouped.get(o.product_id) ?? { prices: [], cheapest: null };
    g.prices.push(Number(o.price));
    if (!g.cheapest) g.cheapest = o.supplier as Supplier;
    grouped.set(o.product_id, g);
  }

  return (
    products
      .map((p) => {
        const g = grouped.get(p.id);
        return {
          ...p,
          stats: g && g.prices.length > 0 ? statsFromPrices(g.prices) : null,
          cheapest_supplier: g?.cheapest ?? null,
        } as ProductWithStats;
      })
      // عند فلترة المدينة نُخفي المنتجات بلا عروض في تلك المدينة
      .filter((p) => (supplierIdsInCity ? p.stats !== null : true))
  );
}

export async function getProductWithOffers(id: string): Promise<ProductDetail | null> {
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!product) return null;
  const { data: offers, error: offersErr } = await supabase
    .from("offers")
    .select("*, supplier:suppliers(*)")
    .eq("product_id", id)
    .order("price", { ascending: true });
  if (offersErr) throw offersErr;
  const prices = (offers ?? []).map((o) => Number(o.price));
  return {
    ...(product as Product),
    offers: (offers ?? []) as any,
    stats: prices.length > 0 ? statsFromPrices(prices) : null,
  };
}

export async function getProductsBySupplier(supplierId: string) {
  const { data, error } = await supabase
    .from("offers")
    .select("*, product:products(*)")
    .eq("supplier_id", supplierId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Array<{
    id: string;
    price: number;
    moq: number;
    stock: number | null;
    price_tiers: unknown;
    product: Product;
  }>;
}

// رفع صورة منتج إلى مخزن Supabase وإرجاع الرابط العام
export async function uploadProductImage(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function addProductOffer(input: {
  supplierId: string;
  name: string;
  categoryId: string;
  spec: string;
  unit: string;
  price: number;
  moq: number;
  stock?: number | null;
  priceTiers?: PriceTier[] | null;
  imageUrl?: string | null;
}) {
  const { data: product, error: prodErr } = await supabase
    .from("products")
    .insert({
      name: input.name,
      category_id: input.categoryId,
      spec: input.spec,
      unit: input.unit,
      icon: "Package",
      image_url: input.imageUrl ?? null,
    })
    .select()
    .single();
  if (prodErr) throw prodErr;
  const { error: offerErr } = await supabase.from("offers").insert({
    product_id: product.id,
    supplier_id: input.supplierId,
    price: input.price,
    moq: input.moq,
    stock: input.stock ?? null,
    price_tiers: (input.priceTiers ?? null) as unknown as never,
  });
  if (offerErr) throw offerErr;
  return product;
}

export async function editOffer(
  offerId: string,
  price: number,
  moq: number,
  stock?: number | null,
  priceTiers?: PriceTier[] | null,
) {
  const { error } = await supabase
    .from("offers")
    .update({
      price,
      moq,
      ...(stock !== undefined ? { stock } : {}),
      ...(priceTiers !== undefined ? { price_tiers: priceTiers as unknown as never } : {}),
    })
    .eq("id", offerId);
  if (error) throw error;
}

export async function deleteOffer(offerId: string) {
  const { error } = await supabase.from("offers").delete().eq("id", offerId);
  if (error) throw error;
}

// استيراد جماعي للمنتجات + عروضها (دفعات) — لرفع آلاف الأصناف عبر ملف.
export type BulkRow = {
  name: string;
  categoryId: string;
  spec: string;
  unit: string;
  price: number;
  moq: number;
};

export async function bulkAddProducts(
  supplierId: string,
  rows: BulkRow[],
  onProgress?: (done: number, total: number) => void,
): Promise<number> {
  const CHUNK = 200;
  let done = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const { data: products, error } = await supabase
      .from("products")
      .insert(
        slice.map((r) => ({
          name: r.name,
          category_id: r.categoryId,
          spec: r.spec || null,
          unit: r.unit,
          icon: "Package",
        })),
      )
      .select("id");
    if (error) throw error;
    const offers = (products ?? []).map((p, idx) => ({
      product_id: p.id,
      supplier_id: supplierId,
      price: slice[idx].price,
      moq: slice[idx].moq,
    }));
    const { error: offErr } = await supabase.from("offers").insert(offers);
    if (offErr) throw offErr;
    done += slice.length;
    onProgress?.(done, rows.length);
  }
  return done;
}
