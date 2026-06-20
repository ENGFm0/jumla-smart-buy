import { supabase } from "@/integrations/supabase/client";
import type { QuoteRequestDetailed, QuoteStatus } from "@/types";

// صاحب المحل يُنشئ طلب عرض سعر لمورّد على منتج
export async function createQuoteRequest(input: {
  productId: string;
  supplierId: string;
  quantity: number;
  note?: string;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول لإرسال الطلب");
  const { error } = await supabase.from("quote_requests").insert({
    buyer_id: user.id,
    product_id: input.productId,
    supplier_id: input.supplierId,
    quantity: input.quantity,
    note: input.note ?? null,
  });
  if (error) throw error;
}

// شراء مباشر بالسعر المعروض: يُنشئ طلبات مسعّرة ومقبولة جاهزة للدفع (بلا تفاوض)
export async function createDirectOrders(
  items: { productId: string; supplierId: string; quantity: number; price: number }[],
): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول");
  if (items.length === 0) return 0;
  const now = new Date().toISOString();
  const rows = items.map((it) => ({
    buyer_id: user.id,
    product_id: it.productId,
    supplier_id: it.supplierId,
    quantity: it.quantity,
    quoted_price: it.price,
    quoted_at: now,
    status: "quoted" as const,
    accepted_at: now,
  }));
  const { error } = await supabase.from("quote_requests").insert(rows);
  if (error) throw error;
  return rows.length;
}

// طلب منتج غير متوفّر: يُرسل لمورّد محدّد أو لكل الموردين (طلب لكل مورّد)
export async function createProductRequest(input: {
  customProduct: string;
  quantity: number;
  note?: string;
  supplierIds: string[];
}): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول لإرسال الطلب");
  if (input.supplierIds.length === 0) throw new Error("اختر مورّداً واحداً على الأقل");
  const rows = input.supplierIds.map((sid) => ({
    buyer_id: user.id,
    product_id: null,
    custom_product: input.customProduct.trim(),
    supplier_id: sid,
    quantity: input.quantity,
    note: input.note?.trim() || null,
  }));
  const { error } = await supabase.from("quote_requests").insert(rows);
  if (error) throw error;
  return rows.length;
}

// طلبات صاحب المحل الحالي
export async function getMyQuoteRequests(): Promise<QuoteRequestDetailed[]> {
  const { data, error } = await supabase
    .from("quote_requests")
    .select(
      "*, product:products(id, name, icon, unit), supplier:suppliers(id, name, city, phone, whatsapp, iban, bank_name, account_holder)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as QuoteRequestDetailed[];
}

// الطلبات الواردة لمورّد معيّن (RLS يقصرها على مالك المورّد)
export async function getSupplierQuoteRequests(
  supplierId: string,
): Promise<QuoteRequestDetailed[]> {
  const { data, error } = await supabase
    .from("quote_requests")
    .select(
      "*, product:products(id, name, icon, unit), supplier:suppliers(id, name, city, phone, whatsapp, iban, bank_name, account_holder)",
    )
    .eq("supplier_id", supplierId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as QuoteRequestDetailed[];
}

// المورّد يردّ على الطلب (سعر + رد + حالة)
export async function respondToQuote(
  id: string,
  input: { quotedPrice?: number | null; reply?: string | null; status: QuoteStatus },
) {
  const { error } = await supabase
    .from("quote_requests")
    .update({
      quoted_price: input.quotedPrice ?? null,
      supplier_reply: input.reply ?? null,
      status: input.status,
      quoted_at: input.status === "quoted" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw error;
}
