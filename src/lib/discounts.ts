import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Discount = Tables<"discounts">;
export type DiscountType = "coupon" | "global" | "product";

// الخصومات النشطة العامة وخصومات المنتجات (للسلة) — لا تشمل الكوبونات
export type ActiveDiscounts = { global: number; products: Record<string, number> };

export async function getActiveDiscounts(): Promise<ActiveDiscounts> {
  try {
    const { data, error } = await supabase
      .from("discounts")
      .select("type, product_id, percent")
      .in("type", ["global", "product"]);
    if (error) throw error;
    let global = 0;
    const products: Record<string, number> = {};
    for (const d of data ?? []) {
      const p = Number(d.percent);
      if (d.type === "global") global = Math.max(global, p);
      else if (d.type === "product" && d.product_id)
        products[d.product_id] = Math.max(products[d.product_id] ?? 0, p);
    }
    return { global, products };
  } catch {
    // الجدول غير مطبّق بعد — لا خصومات
    return { global: 0, products: {} };
  }
}

// أعلى نسبة خصم تنطبق على عنصر (منتج/عام/كوبون) — لا تراكم
export function effectivePercent(
  productId: string,
  active: ActiveDiscounts,
  couponPercent: number,
): number {
  return Math.max(active.products[productId] ?? 0, active.global, couponPercent);
}

// التحقّق من كوبون عبر دالة آمنة (لا تكشف باقي الأكواد)
export async function validateCoupon(
  code: string,
): Promise<{ percent: number; label: string | null } | null> {
  if (!code.trim()) return null;
  const { data, error } = await (supabase as any).rpc("validate_coupon", { p_code: code.trim() });
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return { percent: Number(row.percent), label: row.label ?? null };
}

// ---------------- إدارة (أدمن) ----------------
export async function getAllDiscounts(): Promise<Discount[]> {
  const { data, error } = await supabase
    .from("discounts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createDiscount(input: {
  type: DiscountType;
  percent: number;
  code?: string | null;
  productId?: string | null;
  label?: string | null;
  endsAt?: string | null;
  maxUses?: number | null;
}) {
  const row: TablesInsert<"discounts"> = {
    type: input.type,
    percent: input.percent,
    code: input.type === "coupon" ? (input.code?.trim() || null) : null,
    product_id: input.type === "product" ? (input.productId ?? null) : null,
    label: input.label?.trim() || null,
    ends_at: input.endsAt || null,
    max_uses: input.type === "coupon" ? (input.maxUses ?? null) : null,
  };
  const { error } = await supabase.from("discounts").insert(row);
  if (error) throw error;
}

export async function setDiscountActive(id: string, active: boolean) {
  const { error } = await supabase.from("discounts").update({ active }).eq("id", id);
  if (error) throw error;
}

export async function deleteDiscount(id: string) {
  const { error } = await supabase.from("discounts").delete().eq("id", id);
  if (error) throw error;
}
