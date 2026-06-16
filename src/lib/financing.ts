import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type FinancingRequest = Tables<"financing_requests">;

// صنف مرفق بطلب التمويل (من السلة / يدوي / تسعيرة مورّد)
export type FinancingItem = {
  name: string;
  supplier?: string | null;
  quantity: number;
  unit?: string | null;
  price?: number | null;
};

export function parseFinancingItems(r: FinancingRequest): FinancingItem[] {
  const v = r.items;
  return Array.isArray(v) ? (v as unknown as FinancingItem[]) : [];
}

export function financingItemsTotal(items: FinancingItem[]): number {
  return items.reduce((sum, it) => sum + (Number(it.price) || 0) * (it.quantity || 0), 0);
}

export type FinancingStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "signed"
  | "purchased"
  | "settled";

export const FINANCING_STATUS_LABEL: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "معتمد",
  rejected: "مرفوض",
  signed: "تم توقيع السند",
  purchased: "تم الشراء",
  settled: "مسدّد/مغلق",
};

// المشتري: إنشاء طلب تمويل
export async function createFinancingRequest(input: {
  amount: number;
  termMonths?: number | null;
  idNumber?: string;
  crNumber?: string;
  businessName?: string;
  details?: string;
  idDocPath?: string | null;
  crDocPath?: string | null;
  items?: FinancingItem[];
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول");
  const { error } = await supabase.from("financing_requests").insert({
    buyer_id: user.id,
    amount: input.amount,
    term_months: input.termMonths ?? null,
    id_number: input.idNumber?.trim() || null,
    cr_number: input.crNumber?.trim() || null,
    business_name: input.businessName?.trim() || null,
    details: input.details?.trim() || null,
    id_doc_path: input.idDocPath ?? null,
    cr_doc_path: input.crDocPath ?? null,
    items: (input.items ?? []) as unknown as FinancingRequest["items"],
  });
  if (error) throw error;
}

export async function getMyFinancing(): Promise<FinancingRequest[]> {
  const { data, error } = await supabase
    .from("financing_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// رفع مستند (هوية/سجل) إلى مخزن خاص — المسار يبدأ بمعرّف المستخدم
export async function uploadFinancingDoc(file: File, kind: "id" | "cr"): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول");
  const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
  const path = `${user.id}/${kind}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("financing-docs")
    .upload(path, file, { contentType: file.type || "application/octet-stream" });
  if (error) throw error;
  return path;
}

export async function getFinancingDocUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from("financing-docs").createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

// الأدمن: قراءة كل الطلبات + تحديث الحالة
export async function getAllFinancing(): Promise<FinancingRequest[]> {
  const { data, error } = await supabase
    .from("financing_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateFinancing(
  id: string,
  input: {
    status?: FinancingStatus;
    creditLimit?: number | null;
    adminNote?: string | null;
    promissoryNo?: string | null;
  },
) {
  const fields: Partial<FinancingRequest> = {};
  if (input.status !== undefined) fields.status = input.status;
  if (input.creditLimit !== undefined) fields.credit_limit = input.creditLimit;
  if (input.adminNote !== undefined) fields.admin_note = input.adminNote?.trim() || null;
  if (input.promissoryNo !== undefined) fields.promissory_no = input.promissoryNo?.trim() || null;
  const { error } = await supabase.from("financing_requests").update(fields).eq("id", id);
  if (error) throw error;
}
