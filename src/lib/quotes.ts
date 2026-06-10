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

// طلبات صاحب المحل الحالي
export async function getMyQuoteRequests(): Promise<QuoteRequestDetailed[]> {
  const { data, error } = await supabase
    .from("quote_requests")
    .select(
      "*, product:products(id, name, icon, unit), supplier:suppliers(id, name, city, phone, whatsapp)",
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
      "*, product:products(id, name, icon, unit), supplier:suppliers(id, name, city, phone, whatsapp)",
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
