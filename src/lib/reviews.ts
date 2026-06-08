import { supabase } from "@/integrations/supabase/client";
import type { Review } from "@/types";

export async function getSupplierReviews(supplierId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("supplier_id", supplierId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getMyReview(supplierId: string): Promise<Review | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("supplier_id", supplierId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertReview(supplierId: string, rating: number, comment: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول");
  const { error } = await supabase
    .from("reviews")
    .upsert(
      { supplier_id: supplierId, user_id: user.id, rating, comment: comment || null },
      { onConflict: "supplier_id,user_id" },
    );
  if (error) throw error;
}
