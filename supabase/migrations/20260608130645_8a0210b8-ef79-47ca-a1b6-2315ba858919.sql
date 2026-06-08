
-- 1. Recreate price stats view with security_invoker
DROP VIEW IF EXISTS public.product_price_stats;
CREATE VIEW public.product_price_stats WITH (security_invoker = true) AS
SELECT product_id, MIN(price) AS min_price, AVG(price)::NUMERIC(10,2) AS avg_price,
       MAX(price) AS max_price, COUNT(*) AS offers_count
FROM public.offers GROUP BY product_id;
GRANT SELECT ON public.product_price_stats TO anon, authenticated;

-- 2. Restrict product inserts to suppliers
DROP POLICY IF EXISTS "products_authenticated_insert" ON public.products;
CREATE POLICY "products_supplier_insert" ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'supplier'));

-- 3. Lock down security definer function execution
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
-- has_role is needed by RLS policies; authenticated needs EXECUTE for policy evaluation
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
