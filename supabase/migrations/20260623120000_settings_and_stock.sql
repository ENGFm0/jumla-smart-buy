-- =====================================================================
-- (1) إعدادات المنصّة (key/value) — لتفعيل/إيقاف خدمات مثل البيع بالآجل
-- (2) حجز المخزون عند الدفع: أول من يدفع يأخذ الكمية، وإن نفدت يُرفض الدفع
-- =====================================================================

-- إعدادات عامة
CREATE TABLE IF NOT EXISTS public.settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT 'null'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.settings TO authenticated;

DROP POLICY IF EXISTS "settings_public_read" ON public.settings;
CREATE POLICY "settings_public_read" ON public.settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "settings_admin_write" ON public.settings;
CREATE POLICY "settings_admin_write" ON public.settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.settings (key, value)
VALUES ('financing_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- إنقاص/حجز المخزون عند الدفع (بدل التوصيل)
CREATE OR REPLACE FUNCTION public.reserve_stock_on_payment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cur INT;
  supplier_user UUID;
  pname TEXT;
BEGIN
  IF NEW.paid_at IS NOT NULL AND OLD.paid_at IS NULL AND NEW.product_id IS NOT NULL THEN
    -- اقفل صف العرض لمنع تسابق دفعتين على نفس المخزون
    SELECT stock INTO cur FROM public.offers
      WHERE product_id = NEW.product_id AND supplier_id = NEW.supplier_id
      FOR UPDATE;

    IF cur IS NOT NULL THEN  -- المخزون مُفعّل
      IF cur < NEW.quantity THEN
        RAISE EXCEPTION 'نفدت الكمية المتوفّرة (% فقط). تواصل مع المورّد لطلب كمية أكبر.', cur
          USING ERRCODE = 'check_violation';
      END IF;
      UPDATE public.offers SET stock = cur - NEW.quantity
        WHERE product_id = NEW.product_id AND supplier_id = NEW.supplier_id;

      IF (cur - NEW.quantity) < 10 THEN
        SELECT user_id INTO supplier_user FROM public.suppliers WHERE id = NEW.supplier_id;
        SELECT name INTO pname FROM public.products WHERE id = NEW.product_id;
        IF supplier_user IS NOT NULL THEN
          INSERT INTO public.notifications (user_id, type, title, body, link)
          VALUES (supplier_user, 'stock', 'تنبيه مخزون منخفض',
            'الكمية المتبقية من "' || COALESCE(pname, 'منتج') || '" أصبحت ' || (cur - NEW.quantity) ||
            '. جدّد المخزون.', '/dashboard');
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- استبدال مُنقِص التوصيل بمُنقِص الدفع (لتفادي الإنقاص مرّتين)
DROP TRIGGER IF EXISTS quote_requests_decrement_stock ON public.quote_requests;
DROP TRIGGER IF EXISTS quote_requests_reserve_stock ON public.quote_requests;
CREATE TRIGGER quote_requests_reserve_stock BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.reserve_stock_on_payment();

NOTIFY pgrst, 'reload schema';
