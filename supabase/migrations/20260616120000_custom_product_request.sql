-- =====================================================================
-- طلب منتج غير متوفّر (RFQ مفتوح): المشتري يصف منتجاً ليس في الكتالوج،
-- ويُرسل الطلب لمورّد محدّد أو لكل الموردين (طلب لكل مورّد).
-- نسمح بـ product_id فارغ ونضيف اسم منتج نصّي.
-- =====================================================================
ALTER TABLE public.quote_requests ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE public.quote_requests ADD COLUMN IF NOT EXISTS custom_product TEXT;

-- تحديث إشعار الطلب ليستخدم اسم المنتج المخصّص عند غياب product_id
CREATE OR REPLACE FUNCTION public.create_quote_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pname TEXT;
  supplier_user UUID;
BEGIN
  SELECT name INTO pname FROM public.products WHERE id = NEW.product_id;
  SELECT user_id INTO supplier_user FROM public.suppliers WHERE id = NEW.supplier_id;
  pname := COALESCE(pname, NEW.custom_product, 'منتج');

  IF TG_OP = 'INSERT' THEN
    IF supplier_user IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (supplier_user, 'quote_request', 'طلب عرض سعر جديد',
              'وصلك طلب على "' || pname || '" بكمية ' || NEW.quantity || '.', '/dashboard');
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('quoted', 'rejected') THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.buyer_id, 'quote_reply',
            CASE WHEN NEW.status = 'quoted' THEN 'تم تسعير طلبك' ELSE 'تم رفض طلبك' END,
            'بخصوص "' || pname || '": ' ||
              CASE WHEN NEW.status = 'quoted'
                   THEN 'تم التسعير' || COALESCE(' بسعر ' || NEW.quoted_price || ' ر.س', '')
                   ELSE 'تم الرفض' END || '.', '/my-requests');
  END IF;

  IF NEW.accepted_at IS NOT NULL AND OLD.accepted_at IS NULL AND supplier_user IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (supplier_user, 'order', 'تم قبول عرضك',
            'قبل المشتري عرضك على "' || pname || '". بانتظار الدفع.', '/dashboard');
  END IF;

  IF NEW.paid_at IS NOT NULL AND OLD.paid_at IS NULL AND supplier_user IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (supplier_user, 'order', 'تم الدفع',
            'أكّد المشتري دفع طلب "' || pname || '". جهّز الشحن.', '/dashboard');
  END IF;

  IF NEW.shipped_at IS NOT NULL AND OLD.shipped_at IS NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.buyer_id, 'order', 'تم شحن طلبك',
            'تم شحن "' || pname || '"' ||
              COALESCE('. ' || NEW.shipping_info, '') ||
              COALESCE(' — مندوب: ' || NEW.courier_phone, '') || '.', '/my-requests');
  END IF;

  IF NEW.delivered_at IS NOT NULL AND OLD.delivered_at IS NULL AND supplier_user IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (supplier_user, 'order', 'تم التوصيل',
            'أكّد المشتري استلام "' || pname || '". لا تنسَ التقييم.', '/dashboard');
  END IF;

  IF NEW.buyer_rating IS NOT NULL AND OLD.buyer_rating IS NULL AND supplier_user IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (supplier_user, 'review', 'تقييم جديد',
            'قيّمك المشتري بـ ' || NEW.buyer_rating || '/5 على "' || pname || '".', '/dashboard');
  END IF;

  IF NEW.supplier_rating IS NOT NULL AND OLD.supplier_rating IS NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.buyer_id, 'review', 'تقييم جديد',
            'قيّمك المورّد بـ ' || NEW.supplier_rating || '/5 على "' || pname || '".', '/my-requests');
  END IF;

  RETURN NEW;
END;
$$;
