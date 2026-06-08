-- =====================================================================
-- السماح للمستخدم باختيار/تبديل دوره (مورّد أو صاحب محل) بنفسه — بأمان.
-- 'admin' غير مسموح به للتعيين الذاتي.
-- =====================================================================
GRANT INSERT, DELETE ON public.user_roles TO authenticated;

DROP POLICY IF EXISTS "user_roles_insert_self" ON public.user_roles;
CREATE POLICY "user_roles_insert_self" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND role IN ('supplier', 'shop_owner'));

DROP POLICY IF EXISTS "user_roles_delete_self" ON public.user_roles;
CREATE POLICY "user_roles_delete_self" ON public.user_roles FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND role IN ('supplier', 'shop_owner'));
