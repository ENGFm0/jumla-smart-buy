import { supabase } from "@/integrations/supabase/client";

// إعدادات المنصّة (مفتاح/قيمة). الأدمن يكتب، الجميع يقرأ.
// نتعامل بمرونة: لو الجدول غير مطبّق بعد، نفترض القيم الافتراضية.

export async function getFinancingEnabled(): Promise<boolean> {
  try {
    const { data, error } = await (supabase as any)
      .from("settings")
      .select("value")
      .eq("key", "financing_enabled")
      .maybeSingle();
    if (error || !data) return true;
    return data.value !== false;
  } catch {
    return true;
  }
}

export async function setFinancingEnabled(enabled: boolean) {
  const { error } = await (supabase as any)
    .from("settings")
    .upsert({ key: "financing_enabled", value: enabled, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw error;
}
