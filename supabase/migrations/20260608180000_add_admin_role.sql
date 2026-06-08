-- إضافة دور "admin" إلى أدوار التطبيق.
-- ملاحظة: تُنفّذ منفصلة عن استخدام القيمة (الملف التالي) لأن PostgreSQL
-- لا يسمح باستخدام قيمة enum جديدة في نفس المعاملة التي أُضيفت فيها.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
