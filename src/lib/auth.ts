import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "supplier" | "shop_owner" | "admin";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export async function getUserRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) return [];
  return (data ?? []).map((r) => r.role as AppRole);
}

export async function signUp(input: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: AppRole;
}) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${window.location.origin}/dashboard`,
      data: {
        full_name: input.fullName,
        phone: input.phone,
        role: input.role,
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// تسجيل الدخول عبر مزوّد خارجي (Google ...). يتطلب تفعيل المزوّد في Supabase.
export async function signInWithProvider(provider: "google") {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/onboarding` },
  });
  if (error) throw error;
}

// تعيين الدور الأساسي للمستخدم (مورّد/صاحب محل) — يستبدل الدور السابق.
export async function setPrimaryRole(role: Exclude<AppRole, "admin">) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول");
  await supabase.from("user_roles").delete().eq("user_id", user.id).in("role", ["supplier", "shop_owner"]);
  const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export type { User };