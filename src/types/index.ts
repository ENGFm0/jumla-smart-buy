import type { Tables } from "@/integrations/supabase/types";

export type Category = Tables<"categories">;
export type Supplier = Tables<"suppliers">;
export type Product = Tables<"products">;
export type Offer = Tables<"offers">;
export type Favorite = Tables<"favorites">;
export type QuoteRequest = Tables<"quote_requests">;
export type QuoteStatus = QuoteRequest["status"];
export type Notification = Tables<"notifications">;
export type Review = Tables<"reviews">;

export type PriceStats = {
  min_price: number;
  avg_price: number;
  max_price: number;
  offers_count: number;
};

export type ProductWithStats = Product & {
  stats: PriceStats | null;
  cheapest_supplier?: Supplier | null;
};

export type OfferWithSupplier = Offer & { supplier: Supplier };

export type ProductDetail = Product & {
  stats: PriceStats | null;
  offers: OfferWithSupplier[];
};

// طلب عرض سعر مع بيانات المنتج والمورّد المرتبطة (لعرضه في القوائم)
export type QuoteRequestDetailed = QuoteRequest & {
  product: Pick<Product, "id" | "name" | "icon" | "unit"> | null;
  supplier: Pick<Supplier, "id" | "name" | "city" | "phone" | "whatsapp"> | null;
};

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  pending: "قيد الانتظار",
  quoted: "تم التسعير",
  rejected: "مرفوض",
  closed: "مغلق",
};

export const formatSAR = (n: number) =>
  new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 }).format(n) + " ر.س";