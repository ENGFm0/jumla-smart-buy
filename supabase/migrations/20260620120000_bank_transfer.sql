-- الدفع عبر التحويل البنكي المباشر (آيبان المورّد + رفع إيصال التحويل)
-- لا يتطلّب بوابة دفع ولا سجل تجاري للمنصّة: كل مورّد يستخدم آيبانه الخاص.

-- 1) بيانات الحساب البنكي للمورّد
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS iban text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS account_holder text;

-- 2) حقول الدفع على الطلب
ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_receipt_path text,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz;

-- 3) مخزن خاص لإيصالات التحويل
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- صلاحيات المخزن: يُسمح لطرفي الطلب فقط (المشتري أو المورّد) بالقراءة والرفع.
-- المسار يبدأ بمعرّف الطلب: {quote_id}/...
DROP POLICY IF EXISTS "receipts participants read" ON storage.objects;
CREATE POLICY "receipts participants read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-receipts'
    AND EXISTS (
      SELECT 1 FROM public.quote_requests q
      LEFT JOIN public.suppliers s ON s.id = q.supplier_id
      WHERE q.id::text = (storage.foldername(name))[1]
        AND (q.buyer_id = auth.uid() OR s.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "receipts participants insert" ON storage.objects;
CREATE POLICY "receipts participants insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'payment-receipts'
    AND EXISTS (
      SELECT 1 FROM public.quote_requests q
      LEFT JOIN public.suppliers s ON s.id = q.supplier_id
      WHERE q.id::text = (storage.foldername(name))[1]
        AND (q.buyer_id = auth.uid() OR s.user_id = auth.uid())
    )
  );

-- 4) تحديث حارس الأعمدة: المشتري يملك حقول التحويل، المورّد يملك تأكيد الاستلام
CREATE OR REPLACE FUNCTION public.guard_quote_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  is_buyer boolean;
  is_supplier boolean;
BEGIN
  IF uid IS NULL THEN RETURN NEW; END IF;
  IF public.has_role(uid, 'admin') THEN
    IF NEW.paid_at IS NOT NULL AND OLD.paid_at IS NULL AND NEW.invoice_number IS NULL THEN
      NEW.invoice_number := 'INV-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(NEW.id::text, 1, 6));
    END IF;
    RETURN NEW;
  END IF;

  is_buyer := uid = NEW.buyer_id;
  is_supplier := EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = NEW.supplier_id AND s.user_id = uid);

  IF is_supplier AND NOT is_buyer THEN
    IF NEW.accepted_at  IS DISTINCT FROM OLD.accepted_at
    OR NEW.paid_at      IS DISTINCT FROM OLD.paid_at
    OR NEW.payment_method       IS DISTINCT FROM OLD.payment_method
    OR NEW.payment_receipt_path IS DISTINCT FROM OLD.payment_receipt_path
    OR NEW.delivered_at IS DISTINCT FROM OLD.delivered_at
    OR NEW.cancelled_at IS DISTINCT FROM OLD.cancelled_at
    OR NEW.buyer_rating IS DISTINCT FROM OLD.buyer_rating
    OR NEW.buyer_comment IS DISTINCT FROM OLD.buyer_comment
    OR NEW.quantity     IS DISTINCT FROM OLD.quantity
    OR NEW.note         IS DISTINCT FROM OLD.note THEN
      RAISE EXCEPTION 'المورّد غير مخوّل بتعديل حقول المشتري';
    END IF;
  ELSIF is_buyer THEN
    IF NEW.quoted_price     IS DISTINCT FROM OLD.quoted_price
    OR NEW.supplier_reply   IS DISTINCT FROM OLD.supplier_reply
    OR NEW.status           IS DISTINCT FROM OLD.status
    OR NEW.shipped_at       IS DISTINCT FROM OLD.shipped_at
    OR NEW.shipping_info    IS DISTINCT FROM OLD.shipping_info
    OR NEW.courier_phone    IS DISTINCT FROM OLD.courier_phone
    OR NEW.payment_confirmed_at IS DISTINCT FROM OLD.payment_confirmed_at
    OR NEW.supplier_rating  IS DISTINCT FROM OLD.supplier_rating
    OR NEW.supplier_comment IS DISTINCT FROM OLD.supplier_comment THEN
      RAISE EXCEPTION 'المشتري غير مخوّل بتعديل حقول المورّد';
    END IF;
  ELSE
    RAISE EXCEPTION 'غير مشارك في هذا الطلب';
  END IF;

  IF NEW.paid_at IS NOT NULL AND OLD.paid_at IS NULL AND NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'INV-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(NEW.id::text, 1, 6));
  END IF;

  RETURN NEW;
END;
$$;

NOTIFY pgrst, 'reload schema';
