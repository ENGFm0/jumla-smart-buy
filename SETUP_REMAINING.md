# الخطوات المتبقية (إعدادات لوحات التحكم)

هذه البنود جاهزة في الكود، لكن تفعيلها الفعلي يتم من لوحات تحكم خارجية
(Supabase / Google / Meta / Vercel) ولا يمكن إنجازها داخل المستودع.

---

## 1) إجبار إكمال البيانات بعد التسجيل ✅ (منجز في الكود)

تمت إضافة بوابة عامة `OnboardingGate` تمنع أي مستخدم مسجَّل لم يُكمل
بياناته (اختيار الدور + بيانات المنشأة) من تصفّح الموقع، وتحوّله تلقائياً
إلى `/onboarding`. الزائر غير المسجَّل يتصفّح كالمعتاد مع حجب بيانات المورّد.

- المنطق: `src/lib/onboarding.ts` (`isOnboardingComplete`)
- البوابة: `src/components/OnboardingGate.tsx` (مركّبة في `src/routes/__root.tsx`)

لا يلزم أي إعداد خارجي.

---

## 2) تعييني أدمن ✅ (migration جاهز)

الملف: `supabase/migrations/20260609120000_assign_admin.sql` يمنح
`fmfj2021@gmail.com` دور admin.

**شرط:** لازم تكون مسجّل دخول في الموقع مرّة واحدة (حتى يوجد حسابك في
`auth.users`). بعدها طبّق الـ migration بإحدى الطريقتين:

- لوحة Supabase → SQL Editor، والصق محتوى الملف وشغّله، أو
- عبر CLI: `supabase db push`

للتحقق: `select email, role from auth.users u join public.user_roles r on r.user_id = u.id where email = 'fmfj2021@gmail.com';`

---

## 3) تفعيل دخول Google

الكود جاهز (`signInWithProvider("google")` في `src/lib/auth.ts`، وزر في
`src/routes/auth.tsx`). يبقى التفعيل من اللوحات:

1. **Google Cloud Console** → APIs & Services → Credentials → OAuth client ID
   (نوع Web application).
   - Authorized redirect URI:
     `https://xnaosvlgcxgbzdlwnxoo.supabase.co/auth/v1/callback`
   - انسخ Client ID و Client Secret.
2. **Supabase** → Authentication → Providers → Google → فعّله والصق
   Client ID/Secret.
3. **Supabase** → Authentication → URL Configuration:
   - Site URL: رابط الإنتاج (دومينك أو رابط Vercel).
   - Redirect URLs: أضف `https://<your-domain>/onboarding` ورابط Vercel كذلك.

بعد التفعيل يعمل الزر مباشرة، والمستخدم الجديد يُحوّل إلى `/onboarding`
فتجبره البوابة على إكمال البيانات.

---

## 4) تنبيهات واتساب

الدالة جاهزة: `supabase/functions/quote-notify/index.ts`، والمُشغّل في
`supabase/migrations/20260608160000_quote_notify_webhook.sql`.

1. **Meta / WhatsApp Cloud API:** أنشئ تطبيقاً، واحصل على
   `WHATSAPP_PHONE_NUMBER_ID` وتوكن دائم `WHATSAPP_TOKEN`، وأنشئ قالبين
   معتمدين (`madad_new_quote`, `madad_quote_reply`).
2. **انشر الدالة:** `supabase functions deploy quote-notify --no-verify-jwt`
3. **اضبط الأسرار:**
   ```
   supabase secrets set WHATSAPP_TOKEN=... WHATSAPP_PHONE_NUMBER_ID=... \
     WHATSAPP_TEMPLATE_SUPPLIER=madad_new_quote \
     WHATSAPP_TEMPLATE_BUYER=madad_quote_reply WHATSAPP_LANG=ar \
     WEBHOOK_SECRET=<سر-قوي>
   ```
4. **اربط المُشغّل:** إما من لوحة Supabase → Database → Webhooks (أسهل:
   Webhook على جدول `quote_requests` لأحداث INSERT/UPDATE يوجّه إلى الدالة
   مع ترويسة `x-webhook-secret`)، أو طبّق ملف الـ migration بعد استبدال
   `YOUR_PROJECT_REF` و`YOUR_WEBHOOK_SECRET`.

---

## 5) ربط الدومين وحذف نسخ Vercel المكررة

من لوحة Vercel فقط (لا علاقة لها بالكود):

- **الدومين:** Project → Settings → Domains → Add، واتبع إعدادات DNS.
  بعد الربط، حدّث Site URL وRedirect URLs في Supabase (انظر القسم 3).
- **النسخ المكررة:** Dashboard → احذف المشاريع الزائدة، وأبقِ المشروع
  المربوط بفرع `main` فقط لتفادي عمليات النشر المتكررة.
