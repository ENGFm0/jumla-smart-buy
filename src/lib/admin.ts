import { supabase } from "@/integrations/supabase/client";
import type { Product, Supplier } from "@/types";

export type AdminStats = {
  suppliers: number;
  products: number;
  offers: number;
  quotes: number;
  users: number;
};

async function count(table: "suppliers" | "products" | "offers" | "quote_requests" | "profiles") {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function getAdminStats(): Promise<AdminStats> {
  const [suppliers, products, offers, quotes, users] = await Promise.all([
    count("suppliers"),
    count("products"),
    count("offers"),
    count("quote_requests"),
    count("profiles"),
  ]);
  return { suppliers, products, offers, quotes, users };
}

export async function getAllSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function setSupplierVerified(id: string, verified: boolean) {
  const { error } = await supabase.from("suppliers").update({ verified }).eq("id", id);
  if (error) throw error;
}

export async function deleteSupplier(id: string) {
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) throw error;
}

export type AdminProduct = Product & { category: { name: string } | null };

export async function getAllProducts(): Promise<AdminProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AdminProduct[];
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}
