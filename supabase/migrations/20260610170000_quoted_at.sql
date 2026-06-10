-- =====================================================================
-- وقت التسعير (quoted_at) — لعرض تاريخ دقيق لعملية التسعير في سجل الطلب.
-- =====================================================================
ALTER TABLE public.quote_requests ADD COLUMN IF NOT EXISTS quoted_at TIMESTAMPTZ;

-- تعبئة رجعية للطلبات المسعّرة سابقاً (تقدير من آخر تحديث)
UPDATE public.quote_requests
  SET quoted_at = updated_at
  WHERE status = 'quoted' AND quoted_at IS NULL;
