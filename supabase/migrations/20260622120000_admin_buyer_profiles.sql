-- الأدمن يقرأ كل ملفات المشترين (للبحث عن الفواتير برقم الجوال)
DROP POLICY IF EXISTS "buyer_profiles_admin_select" ON public.buyer_profiles;
CREATE POLICY "buyer_profiles_admin_select" ON public.buyer_profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

NOTIFY pgrst, 'reload schema';
