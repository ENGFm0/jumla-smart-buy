-- =====================================================================
-- تنبيهات داخل التطبيق (جرس + سجل) — تُنشأ تلقائياً من مُشغّل قاعدة البيانات
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications (user_id, created_at DESC);

-- القراءة والتحديث (تعليم كمقروء) للمالك فقط. الإدخال يتم عبر المُشغّل (SECURITY DEFINER).
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- دالة المُشغّل: تُنشئ إشعاراً للطرف المعني عند إنشاء/تحديث طلب عرض سعر
CREATE OR REPLACE FUNCTION public.create_quote_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pname TEXT;
  supplier_user UUID;
BEGIN
  SELECT name INTO pname FROM public.products WHERE id = NEW.product_id;

  IF TG_OP = 'INSERT' THEN
    SELECT user_id INTO supplier_user FROM public.suppliers WHERE id = NEW.supplier_id;
    IF supplier_user IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (
        supplier_user, 'quote_request', 'طلب عرض سعر جديد',
        'وصلك طلب على "' || COALESCE(pname, 'منتج') || '" بكمية ' || NEW.quantity || '.',
        '/dashboard'
      );
    END IF;

  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status
         AND NEW.status IN ('quoted', 'rejected') THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.buyer_id, 'quote_reply',
      CASE WHEN NEW.status = 'quoted' THEN 'تم تسعير طلبك' ELSE 'تم رفض طلبك' END,
      'بخصوص "' || COALESCE(pname, 'منتج') || '": ' ||
        CASE WHEN NEW.status = 'quoted'
             THEN 'تم التسعير' || COALESCE(' بسعر ' || NEW.quoted_price || ' ر.س', '')
             ELSE 'تم الرفض' END || '.',
      '/my-requests'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quote_requests_notify_app_ins ON public.quote_requests;
CREATE TRIGGER quote_requests_notify_app_ins
  AFTER INSERT ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.create_quote_notification();

DROP TRIGGER IF EXISTS quote_requests_notify_app_upd ON public.quote_requests;
CREATE TRIGGER quote_requests_notify_app_upd
  AFTER UPDATE ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.create_quote_notification();
