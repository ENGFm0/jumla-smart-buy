import { supabase } from "@/integrations/supabase/client";
import type { QuoteMessage } from "@/types";

// ---------------------------------------------------------------------
// تحديثات مراحل دورة الحياة (الصلاحيات تُفرض عبر RLS + حارس الأعمدة)
// ---------------------------------------------------------------------

// المشتري يقبل عرض المورّد
export async function acceptOffer(id: string) {
  const { error } = await supabase
    .from("quote_requests")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// المشتري يؤكّد الدفع (يولّد رقم الفاتورة تلقائياً في القاعدة)
export async function markPaid(id: string) {
  const { error } = await supabase
    .from("quote_requests")
    .update({ paid_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// المورّد يؤكّد الشحن مع تفاصيل الشحن ورقم المندوب
export async function markShipped(
  id: string,
  input: { shippingInfo?: string | null; courierPhone?: string | null },
) {
  const { error } = await supabase
    .from("quote_requests")
    .update({
      shipped_at: new Date().toISOString(),
      shipping_info: input.shippingInfo?.trim() || null,
      courier_phone: input.courierPhone?.trim() || null,
    })
    .eq("id", id);
  if (error) throw error;
}

// المشتري يؤكّد استلام الطلب
export async function markDelivered(id: string) {
  const { error } = await supabase
    .from("quote_requests")
    .update({ delivered_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// المشتري يلغي الطلب (قبل الشحن)
export async function cancelOrder(id: string) {
  const { error } = await supabase
    .from("quote_requests")
    .update({ cancelled_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// تقييم الطرف الآخر بعد التوصيل (كل طرف يقيّم في حقله الخاص)
export async function rateOrder(
  id: string,
  role: "buyer" | "supplier",
  rating: number,
  comment?: string,
) {
  const fields =
    role === "buyer"
      ? { buyer_rating: rating, buyer_comment: comment?.trim() || null }
      : { supplier_rating: rating, supplier_comment: comment?.trim() || null };
  const { error } = await supabase.from("quote_requests").update(fields).eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------
// المحادثة بين الطرفين
// ---------------------------------------------------------------------
export async function getOrderMessages(quoteId: string): Promise<QuoteMessage[]> {
  const { data, error } = await supabase
    .from("quote_messages")
    .select("*")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as QuoteMessage[];
}

export async function sendOrderMessage(quoteId: string, body: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول");
  const { error } = await supabase
    .from("quote_messages")
    .insert({ quote_id: quoteId, sender_id: user.id, body: body.trim() });
  if (error) throw error;
}

// ---------------------------------------------------------------------
// بيانات المشتري (لعرضها للمورّد في الفاتورة) — RLS يسمح للمورّد عبر طلب مشترك
// ---------------------------------------------------------------------
export type BuyerContact = {
  business_name: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
};

export async function getBuyerContact(buyerUserId: string): Promise<BuyerContact | null> {
  const { data: bp } = await supabase
    .from("buyer_profiles")
    .select("business_name, phone, city, address")
    .eq("user_id", buyerUserId)
    .maybeSingle();
  if (bp) return bp as BuyerContact;
  // احتياطي: من جدول profiles
  const { data: pr } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", buyerUserId)
    .maybeSingle();
  if (pr) return { business_name: pr.full_name, phone: pr.phone, city: null, address: null };
  return null;
}
