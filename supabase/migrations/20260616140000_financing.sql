-- =====================================================================
-- الشراء بالآجل عبر المنصة (v1): طلب تمويل يقدّمه المشتري ببياناته ومستنداته،
-- يراجعه الأدمن ويحدّد حداً ائتمانياً، ويتتبّع حالة السند والشراء والسداد.
-- (النِّسب/الرسوم تُضاف لاحقاً.)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.financing_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  term_months INT,
  id_number TEXT,
  cr_number TEXT,
  business_name TEXT,
  details TEXT,
  id_doc_path TEXT,
  cr_doc_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
    -- pending | approved | rejected | signed | purchased | settled
  credit_limit NUMERIC(12, 2),
  admin_note TEXT,
  promissory_no TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS financing_buyer_idx ON public.financing_requests (buyer_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.financing_requests TO authenticated;
GRANT ALL ON public.financing_requests TO service_role;
ALTER TABLE public.financing_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "financing_select_own" ON public.financing_requests;
CREATE POLICY "financing_select_own" ON public.financing_requests FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id);
DROP POLICY IF EXISTS "financing_select_admin" ON public.financing_requests;
CREATE POLICY "financing_select_admin" ON public.financing_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "financing_insert_own" ON public.financing_requests;
CREATE POLICY "financing_insert_own" ON public.financing_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = buyer_id);
DROP POLICY IF EXISTS "financing_update_admin" ON public.financing_requests;
CREATE POLICY "financing_update_admin" ON public.financing_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS financing_touch ON public.financing_requests;
CREATE TRIGGER financing_touch BEFORE UPDATE ON public.financing_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- مخزن مستندات التمويل (خاص) — يُقرأ عبر روابط موقّعة فقط
INSERT INTO storage.buckets (id, name, public)
VALUES ('financing-docs', 'financing-docs', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "financing_docs_read" ON storage.objects;
CREATE POLICY "financing_docs_read" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'financing-docs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );
DROP POLICY IF EXISTS "financing_docs_write" ON storage.objects;
CREATE POLICY "financing_docs_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'financing-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- إشعارات: للأدمن عند طلب جديد، وللمشتري عند تغيّر الحالة
CREATE OR REPLACE FUNCTION public.notify_financing()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  adm RECORD;
  msg TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    FOR adm IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (adm.user_id, 'financing', 'طلب تمويل جديد',
              'وصل طلب شراء بالآجل بقيمة ' || NEW.amount || ' ر.س.', '/admin');
    END LOOP;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    msg := CASE NEW.status
      WHEN 'approved' THEN 'تم اعتماد طلب التمويل' || COALESCE(' بحد ' || NEW.credit_limit || ' ر.س', '') || '.'
      WHEN 'rejected' THEN 'تم رفض طلب التمويل.' || COALESCE(' ' || NEW.admin_note, '')
      WHEN 'signed' THEN 'تم توقيع السند لأمر.'
      WHEN 'purchased' THEN 'تم شراء البضاعة وتجهيز طلبك.'
      WHEN 'settled' THEN 'تم إغلاق/سداد التمويل.'
      ELSE 'تحدّثت حالة طلب التمويل.'
    END;
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.buyer_id, 'financing', 'تحديث طلب التمويل', msg, '/financing');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS financing_notify_ins ON public.financing_requests;
CREATE TRIGGER financing_notify_ins AFTER INSERT ON public.financing_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_financing();
DROP TRIGGER IF EXISTS financing_notify_upd ON public.financing_requests;
CREATE TRIGGER financing_notify_upd AFTER UPDATE ON public.financing_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_financing();
