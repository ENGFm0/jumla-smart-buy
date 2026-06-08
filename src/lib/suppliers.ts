import { supabase } from "@/integrations/supabase/client";
import type { Supplier } from "@/types";

// قائمة المدن المتاحة (فريدة) من الموردين — تُستخدم في فلتر البحث
export async function getCities(): Promise<string[]> {
  const { data, error } = await supabase.from("suppliers").select("city");
  if (error) throw error;
  const set = new Set<string>();
  for (const row of data ?? []) if (row.city) set.add(row.city);
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
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
}): Promise<Supplier> {
  const fields = {
    name: input.name,
    city: input.city,
    phone: input.phone,
    whatsapp: input.whatsapp,
    description: input.description ?? null,
    address: input.address ?? null,
    maps_url: input.mapsUrl ?? null,
  };
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