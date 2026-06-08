-- =====================================================================
-- صلاحيات الأدمن: إدارة الموردين والمنتجات والعروض، وقراءة كل الطلبات والملفات
-- =====================================================================

-- منح صلاحيات DELETE/UPDATE اللازمة (الـ RLS يقصرها على الأدمن فقط)
GRANT DELETE, UPDATE ON public.products TO authenticated;
GRANT DELETE ON public.suppliers TO authenticated;

-- الموردون: الأدمن يدير الكل (توثيق/تعديل/حذف)
DROP POLICY IF EXISTS "suppliers_admin_all" ON public.suppliers;
CREATE POLICY "suppliers_admin_all" ON public.suppliers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- المنتجات: الأدمن يدير الكل
DROP POLICY IF EXISTS "products_admin_all" ON public.products;
CREATE POLICY "products_admin_all" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- العروض: الأدمن يدير الكل
DROP POLICY IF EXISTS "offers_admin_all" ON public.offers;
CREATE POLICY "offers_admin_all" ON public.offers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- طلبات عروض الأسعار: الأدمن يقرأ الكل
DROP POLICY IF EXISTS "quotes_admin_select" ON public.quote_requests;
CREATE POLICY "quotes_admin_select" ON public.quote_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ملفات المستخدمين: الأدمن يقرأ الكل (لإحصاء المستخدمين)
DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;
CREATE POLICY "profiles_admin_select" ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================================
-- لجعل حسابك أدمن، شغّل (بعد تسجيلك في الموقع) — استبدل البريد:
--   INSERT INTO public.user_roles (user_id, role)
--   SELECT id, 'admin' FROM auth.users WHERE email = 'YOUR_EMAIL'
--   ON CONFLICT (user_id, role) DO NOTHING;
-- =====================================================================
