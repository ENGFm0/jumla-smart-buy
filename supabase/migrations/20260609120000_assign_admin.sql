-- =====================================================================
-- تعيين حساب المالك أدمن.
-- يعمل فقط إذا كان البريد مُسجّلاً مسبقاً في auth.users (سجّل دخولك أولاً).
-- آمن للتكرار بفضل ON CONFLICT.
-- =====================================================================
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'fmfj2021@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
