import { supabase } from "@/integrations/supabase/client";
import type { QuoteMessage, QuoteRequestDetailed } from "@/types";

const ORDER_SELECT =
  "*, product:products(id, name, icon, unit), supplier:suppliers(id, name, city, phone, whatsapp, iban, bank_name, account_holder)";

// طلب واحد بكامل تفاصيله (للمشتري أو المورّد — RLS يقصره على الطرفين)
export async function getOrderById(id: string): Promise<QuoteRequestDetailed | null> {
  const { data, error } = await supabase
    .from("quote_requests")
    .select(ORDER_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as QuoteRequestDetailed) ?? null;
}

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

// ---------------------------------------------------------------------
// الدفع عبر التحويل البنكي (آيبان المورّد + رفع إيصال التحويل)
// ---------------------------------------------------------------------

// رفع إيصال التحويل إلى المخزن الخاص (المسار يبدأ بمعرّف الطلب)
export async function uploadPaymentReceipt(
  quoteId: string,
  file: Blob,
  name: string,
): Promise<string> {
  const safe = name.replace(/[^\w.\-]+/g, "_").slice(-60);
  const path = `${quoteId}/${crypto.randomUUID()}-${safe}`;
  const { error } = await supabase.storage
    .from("payment-receipts")
    .upload(path, file, { contentType: (file as File).type || "application/octet-stream" });
  if (error) throw error;
  return path;
}

// رابط موقّت موقّع لعرض الإيصال
export async function getPaymentReceiptUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("payment-receipts")
    .createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

// المشتري يؤكّد التحويل البنكي مع إرفاق الإيصال (يولّد رقم الفاتورة في القاعدة)
export async function submitPaymentTransfer(id: string, receiptPath: string) {
  const { error } = await supabase
    .from("quote_requests")
    .update({
      paid_at: new Date().toISOString(),
      payment_method: "bank_transfer",
      payment_receipt_path: receiptPath,
    })
    .eq("id", id);
  if (error) throw error;
}

// المورّد يؤكّد استلام المبلغ في حسابه
export async function confirmPaymentReceived(id: string) {
  const { error } = await supabase
    .from("quote_requests")
    .update({ payment_confirmed_at: new Date().toISOString() })
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

export async function sendOrderMessage(
  quoteId: string,
  input: {
    body?: string;
    attachmentPath?: string | null;
    attachmentType?: "audio" | "image" | "file" | null;
    attachmentName?: string | null;
  },
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول");
  const { error } = await supabase.from("quote_messages").insert({
    quote_id: quoteId,
    sender_id: user.id,
    body: input.body?.trim() ?? "",
    attachment_path: input.attachmentPath ?? null,
    attachment_type: input.attachmentType ?? null,
    attachment_name: input.attachmentName ?? null,
  });
  if (error) throw error;
}

// رفع مرفق إلى مخزن المحادثة (المسار يبدأ بمعرّف الطلب لتطبيق صلاحيات المشاركين)
export async function uploadChatAttachment(
  quoteId: string,
  file: Blob,
  name: string,
): Promise<string> {
  const safe = name.replace(/[^\w.\-]+/g, "_").slice(-60);
  const path = `${quoteId}/${crypto.randomUUID()}-${safe}`;
  const { error } = await supabase.storage
    .from("chat-attachments")
    .upload(path, file, { contentType: (file as File).type || "application/octet-stream" });
  if (error) throw error;
  return path;
}

// رابط موقّت موقّع لقراءة مرفق
export async function getChatAttachmentUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("chat-attachments")
    .createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
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

// جلب بيانات عدة مشترين دفعة واحدة (لتجميع الطلبات الواردة حسب المشتري)
export async function getBuyerContactsByIds(ids: string[]): Promise<Record<string, BuyerContact>> {
  if (ids.length === 0) return {};
  const { data } = await supabase
    .from("buyer_profiles")
    .select("user_id, business_name, phone, city, address")
    .in("user_id", ids);
  const map: Record<string, BuyerContact> = {};
  for (const b of data ?? []) {
    map[b.user_id] = {
      business_name: b.business_name,
      phone: b.phone,
      city: b.city,
      address: b.address,
    };
  }
  return map;
}

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
