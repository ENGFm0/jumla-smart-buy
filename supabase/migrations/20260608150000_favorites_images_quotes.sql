-- =====================================================================
-- مميزات جديدة: المفضّلة + صور المنتجات + طلبات عروض الأسعار (RFQ)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) المفضّلة
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "favorites_select_own" ON public.favorites;
CREATE POLICY "favorites_select_own" ON public.favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "favorites_insert_own" ON public.favorites;
CREATE POLICY "favorites_insert_own" ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "favorites_delete_own" ON public.favorites;
CREATE POLICY "favorites_delete_own" ON public.favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 2) صور المنتجات
-- ---------------------------------------------------------------------
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- مخزن الصور (Storage bucket) عام للقراءة
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
CREATE POLICY "product_images_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');
DROP POLICY IF EXISTS "product_images_supplier_write" ON storage.objects;
CREATE POLICY "product_images_supplier_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'supplier'));
DROP POLICY IF EXISTS "product_images_supplier_update" ON storage.objects;
CREATE POLICY "product_images_supplier_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'supplier'));

-- ---------------------------------------------------------------------
-- 3) طلبات عروض الأسعار (RFQ)
-- ---------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.quote_status AS ENUM ('pending', 'quoted', 'rejected', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  note TEXT,
  status public.quote_status NOT NULL DEFAULT 'pending',
  quoted_price NUMERIC(10,2),
  supplier_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.quote_requests TO authenticated;
GRANT ALL ON public.quote_requests TO service_role;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quotes_buyer_select" ON public.quote_requests;
CREATE POLICY "quotes_buyer_select" ON public.quote_requests FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id);
DROP POLICY IF EXISTS "quotes_buyer_insert" ON public.quote_requests;
CREATE POLICY "quotes_buyer_insert" ON public.quote_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = buyer_id);
DROP POLICY IF EXISTS "quotes_supplier_select" ON public.quote_requests;
CREATE POLICY "quotes_supplier_select" ON public.quote_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = supplier_id AND s.user_id = auth.uid()));
DROP POLICY IF EXISTS "quotes_supplier_update" ON public.quote_requests;
CREATE POLICY "quotes_supplier_update" ON public.quote_requests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = supplier_id AND s.user_id = auth.uid()));

-- تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS quote_requests_touch ON public.quote_requests;
CREATE TRIGGER quote_requests_touch BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
