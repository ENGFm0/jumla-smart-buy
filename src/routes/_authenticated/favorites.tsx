import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HeartOff } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { getFavoriteIds } from "@/lib/favorites";
import { getProductsWithStats } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/favorites")({
  head: () => ({ meta: [{ title: "المفضّلة — مدد" }] }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { data: ids = [], isLoading: idsLoading } = useQuery({
    queryKey: ["favorite-ids"],
    queryFn: getFavoriteIds,
  });
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["favorite-products", ids],
    queryFn: () => getProductsWithStats({ ids }),
    enabled: ids.length > 0,
  });

  const loading = idsLoading || (ids.length > 0 && isLoading);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-6">المفضّلة</h1>
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">جاري التحميل…</div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-16 text-center">
            <HeartOff className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="font-bold mt-3">لا توجد منتجات محفوظة</h3>
            <p className="text-sm text-muted-foreground mt-1">
              اضغط على القلب في أي منتج لإضافته هنا.
            </p>
            <Link
              to="/search"
              className="inline-block mt-5 rounded-2xl bg-primary text-primary-foreground px-5 py-2.5 font-bold"
            >
              تصفّح المنتجات
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
