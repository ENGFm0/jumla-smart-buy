import { supabase } from "@/integrations/supabase/client";

// معرّفات المنتجات المفضّلة للمستخدم الحالي (RLS يضمن أنها خاصة به)
export async function getFavoriteIds(): Promise<string[]> {
  const { data, error } = await supabase.from("favorites").select("product_id");
  if (error) throw error;
  return (data ?? []).map((r) => r.product_id);
}

export async function addFavorite(productId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول");
  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: user.id, product_id: productId });
  // تجاهل خطأ التكرار (موجود مسبقاً)
  if (error && !`${error.message}`.includes("duplicate")) throw error;
}

export async function removeFavorite(productId: string) {
  const { error } = await supabase.from("favorites").delete().eq("product_id", productId);
  if (error) throw error;
}
