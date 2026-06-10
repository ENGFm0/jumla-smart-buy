-- =====================================================================
-- مرفقات المحادثة: تسجيل صوتي + رفع ملفات/صور.
-- نضيف أعمدة المرفق على الرسائل + مخزن خاص (private) بصلاحيات المشاركين فقط.
-- =====================================================================

-- أعمدة المرفق على الرسائل (body يصبح اختيارياً للرسائل التي هي مرفق فقط)
ALTER TABLE public.quote_messages
  ADD COLUMN IF NOT EXISTS attachment_path TEXT,
  ADD COLUMN IF NOT EXISTS attachment_type TEXT,   -- 'audio' | 'image' | 'file'
  ADD COLUMN IF NOT EXISTS attachment_name TEXT;
ALTER TABLE public.quote_messages ALTER COLUMN body SET DEFAULT '';

-- مخزن المرفقات (خاص — يُقرأ عبر روابط موقّعة فقط)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- القراءة/الرفع للمشاركين في الطلب فقط — المسار يبدأ بمعرّف الطلب: {quote_id}/{file}
DROP POLICY IF EXISTS "chat_attach_read" ON storage.objects;
CREATE POLICY "chat_attach_read" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND public.is_quote_participant(((storage.foldername(name))[1])::uuid, auth.uid())
  );
DROP POLICY IF EXISTS "chat_attach_write" ON storage.objects;
CREATE POLICY "chat_attach_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND public.is_quote_participant(((storage.foldername(name))[1])::uuid, auth.uid())
  );

-- تحديث إشعار الرسالة ليصف المرفقات بدل النص الفارغ
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  q RECORD;
  supplier_user UUID;
  recipient UUID;
  preview TEXT;
BEGIN
  SELECT buyer_id, supplier_id INTO q FROM public.quote_requests WHERE id = NEW.quote_id;
  SELECT user_id INTO supplier_user FROM public.suppliers WHERE id = q.supplier_id;
  recipient := CASE WHEN NEW.sender_id = q.buyer_id THEN supplier_user ELSE q.buyer_id END;
  preview := CASE
    WHEN COALESCE(NEW.body, '') <> '' THEN left(NEW.body, 80)
    WHEN NEW.attachment_type = 'audio' THEN '🎤 رسالة صوتية'
    WHEN NEW.attachment_type = 'image' THEN '🖼️ صورة'
    WHEN NEW.attachment_type IS NOT NULL THEN '📎 ملف مرفق'
    ELSE 'رسالة جديدة'
  END;
  IF recipient IS NOT NULL AND recipient <> NEW.sender_id THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (recipient, 'message', 'رسالة جديدة', preview,
            '/chat/' || NEW.quote_id);
  END IF;
  RETURN NEW;
END;
$$;
