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

// حقول دورة حياة الطلب (مضافة في migration order_lifecycle، وغير موجودة بعد
// في الأنواع المولّدة تلقائياً من قاعدة البيانات — نضيفها يدوياً هنا).
export type OrderLifecycle = {
  accepted_at: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  shipping_info: string | null;
  courier_phone: string | null;
  invoice_number: string | null;
  buyer_rating: number | null;
  buyer_comment: string | null;
  supplier_rating: number | null;
  supplier_comment: string | null;
};

// طلب عرض سعر مع بيانات المنتج والمورّد المرتبطة (لعرضه في القوائم)
export type QuoteRequestDetailed = QuoteRequest &
  OrderLifecycle & {
    product: Pick<Product, "id" | "name" | "icon" | "unit"> | null;
    supplier: Pick<Supplier, "id" | "name" | "city" | "phone" | "whatsapp"> | null;
  };

// رسالة في محادثة الطلب
export type QuoteMessage = {
  id: string;
  quote_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  pending: "قيد الانتظار",
  quoted: "تم التسعير",
  rejected: "مرفوض",
  closed: "مغلق",
};

// مراحل دورة حياة الطلب بالترتيب
export type OrderStage =
  | "sent"
  | "quoted"
  | "accepted"
  | "paid"
  | "shipped"
  | "delivered"
  | "rated";

export const ORDER_STAGES: { key: OrderStage; label: string }[] = [
  { key: "sent", label: "أُرسل الطلب" },
  { key: "quoted", label: "تم التسعير" },
  { key: "accepted", label: "قبول العرض" },
  { key: "paid", label: "تم الدفع" },
  { key: "shipped", label: "تم الشحن" },
  { key: "delivered", label: "تم التوصيل" },
  { key: "rated", label: "التقييم" },
];

// آخر مرحلة مكتملة للطلب (للمتتبّع المرئي)
export function orderStageDone(o: QuoteRequestDetailed): Record<OrderStage, boolean> {
  return {
    sent: true,
    quoted: o.status === "quoted" || o.quoted_price != null,
    accepted: !!o.accepted_at,
    paid: !!o.paid_at,
    shipped: !!o.shipped_at,
    delivered: !!o.delivered_at,
    rated: o.buyer_rating != null && o.supplier_rating != null,
  };
}

export const formatSAR = (n: number) =>
  new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 }).format(n) + " ر.س";
