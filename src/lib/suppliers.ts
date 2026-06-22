import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import type { Supplier } from "@/types";

// قائمة المدن المتاحة (فريدة) من الموردين — تُستخدم في فلتر البحث
export async function getCities(): Promise<string[]> {
  const { data, error } = await supabase.from("suppliers").select("city");
  if (error) throw error;
  const set = new Set<string>();
  for (const row of data ?? []) if (row.city) set.add(row.city);
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
}

// قائمة مختصرة بكل الموردين (لاختيارهم عند طلب منتج غير متوفّر)
export async function getAllSuppliers(): Promise<Pick<Supplier, "id" | "name" | "city">[]> {
  const { data, error } = await supabase.from("suppliers").select("id, name, city").order("name");
  if (error) throw error;
  return (data ?? []) as Pick<Supplier, "id" | "name" | "city">[];
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  const { data, error } = await supabase.from("suppliers").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getSupplierByUserId(userId: string): Promise<Supplier | null> {
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertSupplier(input: {
  userId: string;
  name: string;
  city: string;
  phone: string;
  whatsapp: string;
  description?: string;
  address?: string;
  mapsUrl?: string;
  iban?: string;
  bankName?: string;
  accountHolder?: string;
}): Promise<Supplier> {
  // الحقول الأساسية تُرسل دائماً. حقول الحساب البنكي تُرسل فقط إذا كُتبت،
  // حتى لا يفشل الحفظ على القواعد التي لم تُطبّق فيها أعمدة الآيبان بعد.
  const fields: TablesInsert<"suppliers"> = {
    name: input.name,
    city: input.city,
    phone: input.phone,
    whatsapp: input.whatsapp,
    description: input.description ?? null,
    address: input.address ?? null,
    maps_url: input.mapsUrl ?? null,
  };
  if (input.iban?.trim()) fields.iban = input.iban.replace(/\s+/g, "").toUpperCase();
  if (input.bankName?.trim()) fields.bank_name = input.bankName.trim();
  if (input.accountHolder?.trim()) fields.account_holder = input.accountHolder.trim();
  const existing = await getSupplierByUserId(input.userId);
  if (existing) {
    const { data, error } = await supabase
      .from("suppliers")
      .update(fields)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase
    .from("suppliers")
    .insert({ user_id: input.userId, ...fields })
    .select()
    .single();
  if (error) throw error;
  return data;
}
