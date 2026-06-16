import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, PackageX, PackageSearch } from "lucide-react";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { CategoryChip } from "@/components/CategoryChip";
import { getCategories, getProductsWithStats } from "@/lib/products";
import { getCities } from "@/lib/suppliers";

const searchSchema = z.object({
  q: z.string().optional(),
  cat: z.string().optional(),
  city: z.string().optional(),
});

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "ابحث وقارن — مدد" },
      {
        name: "description",
        content: "ابحث عن منتجك بالجملة وقارن بين أسعار جميع الموردين فوراً.",
      },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [q, setQ] = useState(search.q ?? "");
  const [cat, setCat] = useState(search.cat ?? "all");
  const [city, setCity] = useState(search.city ?? "all");
  const [sort, setSort] = useState<"cheapest" | "most" | "name">("cheapest");

  useEffect(() => {
    const t = setTimeout(() => {
      navigate({
        search: {
          ...(q ? { q } : {}),
          ...(cat !== "all" ? { cat } : {}),
          ...(city !== "all" ? { city } : {}),
        },
        replace: true,
      });
    }, 200);
    return () => clearTimeout(t);
  }, [q, cat, city, navigate]);

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const { data: cities = [] } = useQuery({ queryKey: ["cities"], queryFn: getCities });
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", q, cat, city],
    queryFn: () => getProductsWithStats({ search: q, categoryId: cat, city }),
  });

  const sorted = useMemo(() => {
    const arr = [...products];
    if (sort === "cheapest")
      arr.sort((a, b) => (a.stats?.min_price ?? Infinity) - (b.stats?.min_price ?? Infinity));
    if (sort === "most")
      arr.sort((a, b) => (b.stats?.offers_count ?? 0) - (a.stats?.offers_count ?? 0));
    if (sort === "name") arr.sort((a, b) => a.name.localeCompare(b.name, "ar"));
    return arr;
  }, [products, sort]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="rounded-3xl bg-card border border-border p-4 md:p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <SearchIcon className="h-5 w-5 text-muted-foreground mr-2 ml-1" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="اكتب اسم المنتج…"
              className="flex-1 bg-transparent outline-none py-2 text-base"
              autoFocus
            />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-2xl border border-border bg-background px-3 py-2 text-sm font-medium"
              title="فلترة بالمدينة"
            >
              <option value="all">كل المدن</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="rounded-2xl border border-border bg-background px-3 py-2 text-sm font-medium"
            >
              <option value="cheapest">الأرخص أولاً</option>
              <option value="most">الأكثر عروضاً</option>
              <option value="name">الاسم</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <CategoryChip
              name="الكل"
              icon="LayoutGrid"
              active={cat === "all"}
              onClick={() => setCat("all")}
            />
            {categories.map((c) => (
              <CategoryChip
                key={c.id}
                icon={c.icon}
                name={c.name}
                active={cat === c.id}
                onClick={() => setCat(c.id)}
              />
            ))}
          </div>
        </div>

        {/* طلب منتج غير متوفّر — متاح دائماً */}
        <div className="mt-4 rounded-2xl border border-primary/30 bg-brand-soft/40 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-sm font-bold">
            ما لقيت المنتج اللي تبيه؟ اطلبه من الموردين وخلّهم يسعّرونه لك.
          </span>
          <Link
            to="/request-product"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground px-4 py-2 text-sm font-bold shrink-0"
          >
            <PackageSearch className="h-4 w-4" /> اطلب منتجاً غير متوفّر
          </Link>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="text-center py-16 text-muted-foreground">جاري البحث…</div>
          ) : sorted.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-16 text-center">
              <PackageX className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="font-bold mt-3">لا توجد نتائج</h3>
              <p className="text-sm text-muted-foreground mt-1">
                جرّب كلمة أخرى أو غيّر الفئة — أو اطلبه من الموردين عبر الزر بالأعلى.
              </p>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-3">{sorted.length} منتج</div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sorted.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
