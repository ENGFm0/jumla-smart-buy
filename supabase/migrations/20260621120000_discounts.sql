-- نظام الخصومات والكوبونات
--  - global  : خصم عام على كل الطلبات
--  - product : خصم على منتج محدّد
--  - coupon  : كود يدخله العميل في السلة
-- الأدمن يفعّل/يوقف أي خصم. التطبيق: نأخذ أعلى نسبة منطبقة (بدون تراكم).

CREATE TABLE IF NOT EXISTS public.discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('coupon', 'global', 'product')),
  code text,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  percent numeric NOT NULL CHECK (percent > 0 AND percent <= 90),
  label text,
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  max_uses int,
  used_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- كود الكوبون فريد (غير حسّاس لحالة الأحرف)
CREATE UNIQUE INDEX IF NOT EXISTS discounts_code_uniq
  ON public.discounts (lower(code)) WHERE code IS NOT NULL;

ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discounts TO authenticated;
GRANT SELECT ON public.discounts TO anon;

-- قراءة عامة للخصومات العامة وخصومات المنتجات النشطة فقط (الكوبونات لا تُكشف)
DROP POLICY IF EXISTS "discounts_public_select" ON public.discounts;
CREATE POLICY "discounts_public_select" ON public.discounts FOR SELECT TO anon, authenticated
  USING (
    type IN ('global', 'product')
    AND active
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  );

-- الأدمن يدير الكل (بما فيها الكوبونات)
DROP POLICY IF EXISTS "discounts_admin_all" ON public.discounts;
CREATE POLICY "discounts_admin_all" ON public.discounts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- التحقّق من كوبون دون كشف باقي الأكواد
CREATE OR REPLACE FUNCTION public.validate_coupon(p_code text)
RETURNS TABLE(percent numeric, label text)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT d.percent, d.label
  FROM public.discounts d
  WHERE d.type = 'coupon'
    AND d.active
    AND lower(d.code) = lower(trim(p_code))
    AND (d.starts_at IS NULL OR d.starts_at <= now())
    AND (d.ends_at IS NULL OR d.ends_at >= now())
    AND (d.max_uses IS NULL OR d.used_count < d.max_uses)
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
