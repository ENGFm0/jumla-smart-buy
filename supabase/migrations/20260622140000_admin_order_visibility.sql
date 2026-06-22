-- رؤية الأدمن لتفاصيل الطلب: المحادثة + الإيصال + مرفقات المحادثة
DROP POLICY IF EXISTS "quote_messages_admin_select" ON public.quote_messages;
CREATE POLICY "quote_messages_admin_select" ON public.quote_messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "receipts admin read" ON storage.objects;
CREATE POLICY "receipts admin read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-receipts' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "chat admin read" ON storage.objects;
CREATE POLICY "chat admin read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'chat-attachments' AND public.has_role(auth.uid(), 'admin'));

NOTIFY pgrst, 'reload schema';
