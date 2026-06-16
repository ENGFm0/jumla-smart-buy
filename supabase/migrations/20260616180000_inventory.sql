-- =====================================================================
-- المخزون: كمية لكل عرض، تنقص عند التوصيل، وتنبيه للمورّد عند نقصها تحت 10.
-- + السماح للمورّد بإضافة فئة من عنده.
-- =====================================================================
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS stock INT;

-- ---------------------------------------------------------------------
-- السماح للمورّد بإضافة فئة جديدة
-- ---------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
GRANT INSERT ON public.categories TO authenticated;
DROP POLICY IF EXISTS "categories_insert_supplier" ON public.categories;
CREATE POLICY "categories_insert_supplier" ON public.categories FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'supplier'));

-- ---------------------------------------------------------------------
-- إنقاص المخزون عند تأكيد التوصيل + تنبيه عند نقصه تحت 10
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.decrement_stock_on_delivery()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_stock INT;
  supplier_user UUID;
  pname TEXT;
BEGIN
  IF NEW.delivered_at IS NOT NULL AND OLD.delivered_at IS NULL AND NEW.product_id IS NOT NULL THEN
    -- ينقص فقط إذا كان المخزون مُفعّلاً (stock غير NULL)
    UPDATE public.offers
      SET stock = GREATEST(0, COALESCE(stock, 0) - NEW.quantity)
      WHERE product_id = NEW.product_id AND supplier_id = NEW.supplier_id AND stock IS NOT NULL
      RETURNING stock INTO new_stock;

    IF new_stock IS NOT NULL AND new_stock < 10 THEN
      SELECT user_id INTO supplier_user FROM public.suppliers WHERE id = NEW.supplier_id;
      SELECT name INTO pname FROM public.products WHERE id = NEW.product_id;
      IF supplier_user IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, type, title, body, link)
        VALUES (
          supplier_user, 'stock', 'تنبيه مخزون منخفض',
          'الكمية المتبقية من "' || COALESCE(pname, 'منتج') || '" أصبحت ' || new_stock ||
            '. جدّد المخزون أو احذف المنتج.',
          '/dashboard'
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quote_requests_decrement_stock ON public.quote_requests;
CREATE TRIGGER quote_requests_decrement_stock AFTER UPDATE ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_delivery();
