-- =====================================================================
-- مُشغّل يستدعي Edge Function (quote-notify) عند إنشاء/تحديث طلب عرض سعر
-- يتطلب امتداد pg_net.
--
-- ⚠️ قبل التشغيل: استبدل القيمتين التاليتين بقيمك:
--    YOUR_PROJECT_REF  → معرّف مشروع Supabase (من رابط المشروع)
--    YOUR_WEBHOOK_SECRET → نفس قيمة السر WEBHOOK_SECRET في أسرار الدالة
--
-- بديل أسهل: من لوحة Supabase → Database → Webhooks، أنشئ Webhook على
-- جدول quote_requests لأحداث INSERT و UPDATE يوجّه إلى الدالة quote-notify،
-- وأضف ترويسة x-webhook-secret. (عندها لا تحتاج هذا الملف.)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.notify_quote_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  payload JSONB;
BEGIN
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', to_jsonb(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END
  );
  PERFORM net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/quote-notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', 'YOUR_WEBHOOK_SECRET'
    ),
    body := payload
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quote_requests_notify_ins ON public.quote_requests;
CREATE TRIGGER quote_requests_notify_ins
  AFTER INSERT ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_quote_change();

DROP TRIGGER IF EXISTS quote_requests_notify_upd ON public.quote_requests;
CREATE TRIGGER quote_requests_notify_upd
  AFTER UPDATE ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_quote_change();
