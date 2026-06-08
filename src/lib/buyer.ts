import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type BuyerProfile = Tables<"buyer_profiles">;

export async function getMyBuyerProfile(): Promise<BuyerProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("buyer_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertBuyerProfile(input: {
  businessName: string;
  businessType: string;
  city: string;
  address: string;
  mapsUrl: string;
  phone: string;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول");
  const { error } = await supabase.from("buyer_profiles").upsert(
    {
      user_id: user.id,
      business_name: input.businessName,
      business_type: input.businessType || null,
      city: input.city || null,
      address: input.address || null,
      maps_url: input.mapsUrl || null,
      phone: input.phone || null,
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}
