-- =====================================================================
-- تقييمات الموردين — تقييم واحد لكل مستخدم لكل مورّد، مع إعادة حساب المتوسط
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (supplier_id, user_id)
);
CREATE INDEX IF NOT EXISTS reviews_supplier_idx ON public.reviews (supplier_id);

GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
CREATE POLICY "reviews_insert_own" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "reviews_update_own" ON public.reviews;
CREATE POLICY "reviews_update_own" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "reviews_delete_own" ON public.reviews;
CREATE POLICY "reviews_delete_own" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- إعادة حساب متوسط التقييم وعدد المراجعات للمورّد
CREATE OR REPLACE FUNCTION public.recompute_supplier_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  sid UUID;
  avg_rating NUMERIC;
  cnt INT;
BEGIN
  sid := COALESCE(NEW.supplier_id, OLD.supplier_id);
  SELECT AVG(rating), COUNT(*) INTO avg_rating, cnt FROM public.reviews WHERE supplier_id = sid;
  UPDATE public.suppliers
    SET rating = COALESCE(ROUND(avg_rating, 1), 4.5),
        reviews_count = COALESCE(cnt, 0)
    WHERE id = sid;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS reviews_recompute_ins ON public.reviews;
CREATE TRIGGER reviews_recompute_ins AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.recompute_supplier_rating();
DROP TRIGGER IF EXISTS reviews_recompute_upd ON public.reviews;
CREATE TRIGGER reviews_recompute_upd AFTER UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.recompute_supplier_rating();
DROP TRIGGER IF EXISTS reviews_recompute_del ON public.reviews;
CREATE TRIGGER reviews_recompute_del AFTER DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.recompute_supplier_rating();
