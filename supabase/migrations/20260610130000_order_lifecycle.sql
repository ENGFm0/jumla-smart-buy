-- =====================================================================
-- دورة حياة الطلب (Order lifecycle) فوق طلبات عروض الأسعار:
--   إرسال → تسعير → قبول العرض → الدفع (+فاتورة) → الشحن → التوصيل → تقييم متبادل
-- + محادثة بين الطرفين + إشعارات لكل مرحلة.
-- نستخدم أعمدة زمنية (timestamps) لكل مرحلة ليتضح للطرفين "متى وصل" كل خطوة.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) أعمدة المراحل على quote_requests
-- ---------------------------------------------------------------------
ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS accepted_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shipped_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shipping_info    TEXT,
  ADD COLUMN IF NOT EXISTS courier_phone    TEXT,
  ADD COLUMN IF NOT EXISTS invoice_number   TEXT,
  ADD COLUMN IF NOT EXISTS buyer_rating     INT CHECK (buyer_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS buyer_comment    TEXT,
  ADD COLUMN IF NOT EXISTS supplier_rating  INT CHECK (supplier_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS supplier_comment TEXT;

-- ---------------------------------------------------------------------
-- 2) سياسة تحديث للمشتري + حارس أعمدة يمنع كل طرف من تعديل حقول الآخر
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "quotes_buyer_update" ON public.quote_requests;
CREATE POLICY "quotes_buyer_update" ON public.quote_requests FOR UPDATE TO authenticated
  USING (auth.uid() = buyer_id) WITH CHECK (auth.uid() = buyer_id);

CREATE OR REPLACE FUNCTION public.guard_quote_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  is_buyer boolean;
  is_supplier boolean;
BEGIN
  -- سياق النظام (service_role/تعريف) — اسمح
  IF uid IS NULL THEN RETURN NEW; END IF;
  IF public.has_role(uid, 'admin') THEN
    -- توليد رقم الفاتورة عند أول دفع
    IF NEW.paid_at IS NOT NULL AND OLD.paid_at IS NULL AND NEW.invoice_number IS NULL THEN
      NEW.invoice_number := 'INV-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(NEW.id::text, 1, 6));
    END IF;
    RETURN NEW;
  END IF;

  is_buyer := uid = NEW.buyer_id;
  is_supplier := EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = NEW.supplier_id AND s.user_id = uid);

  IF is_supplier AND NOT is_buyer THEN
    -- المورّد لا يعدّل حقول المشتري
    IF NEW.accepted_at  IS DISTINCT FROM OLD.accepted_at
    OR NEW.paid_at      IS DISTINCT FROM OLD.paid_at
    OR NEW.delivered_at IS DISTINCT FROM OLD.delivered_at
    OR NEW.cancelled_at IS DISTINCT FROM OLD.cancelled_at
    OR NEW.buyer_rating IS DISTINCT FROM OLD.buyer_rating
    OR NEW.buyer_comment IS DISTINCT FROM OLD.buyer_comment
    OR NEW.quantity     IS DISTINCT FROM OLD.quantity
    OR NEW.note         IS DISTINCT FROM OLD.note THEN
      RAISE EXCEPTION 'المورّد غير مخوّل بتعديل حقول المشتري';
    END IF;
  ELSIF is_buyer THEN
    -- المشتري لا يعدّل حقول المورّد
    IF NEW.quoted_price     IS DISTINCT FROM OLD.quoted_price
    OR NEW.supplier_reply   IS DISTINCT FROM OLD.supplier_reply
    OR NEW.status           IS DISTINCT FROM OLD.status
    OR NEW.shipped_at       IS DISTINCT FROM OLD.shipped_at
    OR NEW.shipping_info    IS DISTINCT FROM OLD.shipping_info
    OR NEW.courier_phone    IS DISTINCT FROM OLD.courier_phone
    OR NEW.supplier_rating  IS DISTINCT FROM OLD.supplier_rating
    OR NEW.supplier_comment IS DISTINCT FROM OLD.supplier_comment THEN
      RAISE EXCEPTION 'المشتري غير مخوّل بتعديل حقول المورّد';
    END IF;
  ELSE
    RAISE EXCEPTION 'غير مشارك في هذا الطلب';
  END IF;

  -- توليد رقم الفاتورة عند أول دفع
  IF NEW.paid_at IS NOT NULL AND OLD.paid_at IS NULL AND NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'INV-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(NEW.id::text, 1, 6));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quote_requests_guard ON public.quote_requests;
CREATE TRIGGER quote_requests_guard BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.guard_quote_update();

-- المورّد يحتاج قراءة بيانات المشتري (للفاتورة والتواصل) عبر طلب مشترك
DROP POLICY IF EXISTS "buyer_profiles_supplier_via_quote" ON public.buyer_profiles;
CREATE POLICY "buyer_profiles_supplier_via_quote" ON public.buyer_profiles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.quote_requests q
    JOIN public.suppliers s ON s.id = q.supplier_id
    WHERE q.buyer_id = buyer_profiles.user_id AND s.user_id = auth.uid()
  ));
DROP POLICY IF EXISTS "profiles_supplier_via_quote" ON public.profiles;
CREATE POLICY "profiles_supplier_via_quote" ON public.profiles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.quote_requests q
    JOIN public.suppliers s ON s.id = q.supplier_id
    WHERE q.buyer_id = profiles.id AND s.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------
-- 3) المحادثة بين الطرفين
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quote_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quote_messages_quote_idx ON public.quote_messages (quote_id, created_at);

GRANT SELECT, INSERT ON public.quote_messages TO authenticated;
GRANT ALL ON public.quote_messages TO service_role;
ALTER TABLE public.quote_messages ENABLE ROW LEVEL SECURITY;

-- مشارك في الطلب = المشتري أو مالك المورّد
CREATE OR REPLACE FUNCTION public.is_quote_participant(q_id UUID, uid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.quote_requests q
    LEFT JOIN public.suppliers s ON s.id = q.supplier_id
    WHERE q.id = q_id AND (q.buyer_id = uid OR s.user_id = uid)
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_quote_participant(UUID, UUID) TO authenticated;

DROP POLICY IF EXISTS "quote_messages_select_participant" ON public.quote_messages;
CREATE POLICY "quote_messages_select_participant" ON public.quote_messages FOR SELECT TO authenticated
  USING (public.is_quote_participant(quote_id, auth.uid()));
DROP POLICY IF EXISTS "quote_messages_insert_participant" ON public.quote_messages;
CREATE POLICY "quote_messages_insert_participant" ON public.quote_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_quote_participant(quote_id, auth.uid()));

-- إشعار الطرف الآخر عند وصول رسالة جديدة
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  q RECORD;
  supplier_user UUID;
  recipient UUID;
BEGIN
  SELECT buyer_id, supplier_id INTO q FROM public.quote_requests WHERE id = NEW.quote_id;
  SELECT user_id INTO supplier_user FROM public.suppliers WHERE id = q.supplier_id;
  recipient := CASE WHEN NEW.sender_id = q.buyer_id THEN supplier_user ELSE q.buyer_id END;
  IF recipient IS NOT NULL AND recipient <> NEW.sender_id THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (recipient, 'message', 'رسالة جديدة',
            left(NEW.body, 80),
            CASE WHEN recipient = q.buyer_id THEN '/my-requests' ELSE '/dashboard' END);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS quote_messages_notify ON public.quote_messages;
CREATE TRIGGER quote_messages_notify AFTER INSERT ON public.quote_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- ---------------------------------------------------------------------
-- 4) إشعارات مراحل دورة الحياة
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_quote_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pname TEXT;
  supplier_user UUID;
BEGIN
  SELECT name INTO pname FROM public.products WHERE id = NEW.product_id;
  SELECT user_id INTO supplier_user FROM public.suppliers WHERE id = NEW.supplier_id;
  pname := COALESCE(pname, 'منتج');

  IF TG_OP = 'INSERT' THEN
    IF supplier_user IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (supplier_user, 'quote_request', 'طلب عرض سعر جديد',
              'وصلك طلب على "' || pname || '" بكمية ' || NEW.quantity || '.', '/dashboard');
    END IF;
    RETURN NEW;
  END IF;

  -- تحديثات: تسعير/رفض (إشعار المشتري)
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('quoted', 'rejected') THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.buyer_id, 'quote_reply',
            CASE WHEN NEW.status = 'quoted' THEN 'تم تسعير طلبك' ELSE 'تم رفض طلبك' END,
            'بخصوص "' || pname || '": ' ||
              CASE WHEN NEW.status = 'quoted'
                   THEN 'تم التسعير' || COALESCE(' بسعر ' || NEW.quoted_price || ' ر.س', '')
                   ELSE 'تم الرفض' END || '.', '/my-requests');
  END IF;

  -- قبول العرض (إشعار المورّد)
  IF NEW.accepted_at IS NOT NULL AND OLD.accepted_at IS NULL AND supplier_user IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (supplier_user, 'order', 'تم قبول عرضك',
            'قبل المشتري عرضك على "' || pname || '". بانتظار الدفع.', '/dashboard');
  END IF;

  -- الدفع (إشعار المورّد)
  IF NEW.paid_at IS NOT NULL AND OLD.paid_at IS NULL AND supplier_user IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (supplier_user, 'order', 'تم الدفع',
            'أكّد المشتري دفع طلب "' || pname || '". جهّز الشحن.', '/dashboard');
  END IF;

  -- الشحن (إشعار المشتري)
  IF NEW.shipped_at IS NOT NULL AND OLD.shipped_at IS NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.buyer_id, 'order', 'تم شحن طلبك',
            'تم شحن "' || pname || '"' ||
              COALESCE('. ' || NEW.shipping_info, '') ||
              COALESCE(' — مندوب: ' || NEW.courier_phone, '') || '.', '/my-requests');
  END IF;

  -- التوصيل (إشعار المورّد)
  IF NEW.delivered_at IS NOT NULL AND OLD.delivered_at IS NULL AND supplier_user IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (supplier_user, 'order', 'تم التوصيل',
            'أكّد المشتري استلام "' || pname || '". لا تنسَ التقييم.', '/dashboard');
  END IF;

  -- تقييم المشتري للمورّد (إشعار المورّد)
  IF NEW.buyer_rating IS NOT NULL AND OLD.buyer_rating IS NULL AND supplier_user IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (supplier_user, 'review', 'تقييم جديد',
            'قيّمك المشتري بـ ' || NEW.buyer_rating || '/5 على "' || pname || '".', '/dashboard');
  END IF;

  -- تقييم المورّد للمشتري (إشعار المشتري)
  IF NEW.supplier_rating IS NOT NULL AND OLD.supplier_rating IS NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.buyer_id, 'review', 'تقييم جديد',
            'قيّمك المورّد بـ ' || NEW.supplier_rating || '/5 على "' || pname || '".', '/my-requests');
  END IF;

  RETURN NEW;
END;
$$;
