-- =====================================================================
-- تفاصيل المتجر للمورّد + ملف المشتري (مطعم/محل) للتسجيل عند أول دخول
-- =====================================================================

-- حقول إضافية للمورّد (متجره)
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS maps_url TEXT;

-- ملف المشتري (صاحب المطعم/المحل)
CREATE TABLE IF NOT EXISTS public.buyer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_type TEXT,            -- restaurant | cafe | shop | other
  city TEXT,
  address TEXT,
  maps_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.buyer_profiles TO authenticated;
GRANT ALL ON public.buyer_profiles TO service_role;
ALTER TABLE public.buyer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "buyer_profiles_select_own" ON public.buyer_profiles;
CREATE POLICY "buyer_profiles_select_own" ON public.buyer_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "buyer_profiles_insert_own" ON public.buyer_profiles;
CREATE POLICY "buyer_profiles_insert_own" ON public.buyer_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "buyer_profiles_update_own" ON public.buyer_profiles;
CREATE POLICY "buyer_profiles_update_own" ON public.buyer_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
