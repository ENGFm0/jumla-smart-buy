import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PriceStat } from "@/components/PriceStat";
import { OfferRow } from "@/components/OfferRow";
import { FavoriteButton } from "@/components/FavoriteButton";
import { getProductWithOffers, getCategories } from "@/lib/products";

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-muted-foreground">حدث خطأ: {error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">المنتج غير موجود</div>
  ),
});

function ProductPage() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductWithOffers(id),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">جاري التحميل…</div>
      </div>
    );
  }
  if (!data) throw notFound();

  const Icon = ((Icons as any)[data.icon] || Icons.Package) as typeof Icons.Package;
  const stats = data.stats;
  const categoryName =
    categories.find((c) => c.id === data.category_id)?.name ?? data.category_id;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <Link to="/search" className="text-sm text-muted-foreground hover:text-primary">
          ← العودة للبحث
        </Link>

        <div className="rounded-3xl bg-card border border-border p-6 mt-3">
          <div className="flex items-start gap-4">
            {data.image_url ? (
              <img
                src={data.image_url}
                alt={data.name}
                className="h-20 w-20 rounded-2xl object-cover shrink-0"
              />
            ) : (
              <div className="rounded-2xl bg-brand-soft text-primary p-4 shrink-0">
                <Icon className="h-10 w-10" />
              </div>
            )}
            <div className="flex-1">
              <div className="text-xs font-medium text-primary">
                {categoryName}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold mt-1">{data.name}</h1>
              {data.spec && <p className="text-muted-foreground mt-2">{data.spec}</p>}
              <div className="text-sm text-muted-foreground mt-2">
                وحدة البيع: <span className="font-bold text-foreground">{data.unit}</span>
              </div>
            </div>
            <FavoriteButton productId={data.id} />
          </div>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              <PriceStat variant="low" value={stats.min_price} />
              <PriceStat variant="avg" value={stats.avg_price} />
              <PriceStat variant="high" value={stats.max_price} />
              <div className="rounded-2xl border bg-secondary/60 border-border px-3 py-2">
                <div className="text-[11px] font-medium text-muted-foreground">عدد العروض</div>
                <div className="text-sm font-extrabold tabular-nums mt-0.5">{stats.offers_count}</div>
              </div>
            </div>
          )}
        </div>

        <h2 className="text-xl font-extrabold mt-8 mb-3">العروض المتاحة</h2>
        <div className="space-y-3">
          {data.offers.map((o, i) => (
            <OfferRow
              key={o.id}
              offer={o}
              isBest={i === 0}
              minPrice={Number(data.offers[0]?.price ?? 0)}
              productId={data.id}
              productName={data.name}
            />
          ))}
          {data.offers.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
              لا توجد عروض لهذا المنتج بعد.
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}