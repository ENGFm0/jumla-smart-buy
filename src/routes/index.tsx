import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Truck, Package, BarChart3, MessagesSquare } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CategoryChip } from "@/components/CategoryChip";
import { ProductCard } from "@/components/ProductCard";
import { getCategories, getCategoryCounts, getProductsWithStats } from "@/lib/products";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "مدد — قارن أسعار الجملة، واطلب من الأوفر لك" },
      { name: "description", content: "منصة سعودية للبيع بالجملة تربط الموردين بأصحاب المحلات والمطاعم. قارن أسعار العروض من جميع الموردين فوراً." },
    ],
  }),
  component: Index,
});

function Index() {
  const [q, setQ] = useState("");
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const { data: counts = {} } = useQuery({ queryKey: ["cat-counts"], queryFn: getCategoryCounts });
  const { data: featured = [] } = useQuery({
    queryKey: ["products-featured"],
    queryFn: () => getProductsWithStats(),
  });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section
        className="relative overflow-hidden text-white"
        style={{ background: "var(--gradient-brand)" }}
      >
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="container mx-auto px-4 pt-16 pb-20 relative">
          <div className="max-w-3xl">
            <span className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold backdrop-blur">
              منصة سعودية للبيع بالجملة B2B
            </span>
            <h1 className="mt-4 text-4xl md:text-6xl font-extrabold leading-tight">
              قارن أسعار الجملة،<br />واطلب من الأوفر لك
            </h1>
            <p className="mt-4 text-lg text-white/90 max-w-xl">
              نربط أصحاب المحلات والمطاعم بأفضل موردي الجملة. شوف كل العروض من كل الموردين، رتبهم بالسعر، واطلب مباشرة.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/search"
                className="inline-flex items-center gap-2 rounded-2xl bg-white text-primary px-5 py-3 font-bold shadow-lg hover:bg-white/95"
              >
                <Search className="h-5 w-5" />
                تصفّح وقارن الأسعار
              </Link>
            </div>
            <p className="mt-3 text-xs text-white/70">
              تصفّح بحرية — سجّل الدخول لعرض بيانات الموردين والتواصل وطلب عروض الأسعار.
            </p>
          </div>
        </div>

      </section>

      {/* Search box */}
      <section className="container mx-auto px-4 -mt-8 relative z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const url = `/search${q ? `?q=${encodeURIComponent(q)}` : ""}`;
            window.location.href = url;
          }}
          className="max-w-3xl mx-auto bg-card rounded-3xl shadow-xl p-2 flex items-center gap-2 border border-border"
        >
          <Search className="h-5 w-5 text-muted-foreground shrink-0 mr-2 ml-1" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث عن منتج… مثل: زيت، كرتون، أرز"
            className="flex-1 min-w-0 bg-transparent outline-none py-3 text-sm placeholder:text-muted-foreground"
          />
          <button className="shrink-0 rounded-2xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold hover:opacity-90 transition">
            ابحث وقارن
          </button>
        </form>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold">تصفّح حسب الفئة</h2>
            <p className="text-muted-foreground text-sm mt-1">اختر الفئة التي تهمك وابدأ بالمقارنة.</p>
          </div>
          <Link to="/search" className="text-sm text-primary font-bold hover:underline">
            عرض الكل ←
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/search"
              search={{ cat: c.id } as any}
              className="block rounded-3xl border border-border bg-card hover:border-primary hover:shadow-md transition p-5 text-center"
            >
              <div className="mx-auto mb-3 w-fit">
                <CategoryChip icon={c.icon} name={c.name} asButton={false} />
              </div>
              <div className="text-sm text-muted-foreground">{counts[c.id] ?? 0} منتج</div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-secondary/50 py-14">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center">كيف تعمل المنصة؟</h2>
          <p className="text-center text-muted-foreground mt-2">٣ خطوات بسيطة لتوفّر وقتك وفلوسك</p>
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            {[
              { Icon: Search, title: "١. ابحث عن المنتج", desc: "اكتب اسم المنتج اللي تحتاجه وشف العروض المتاحة." },
              { Icon: BarChart3, title: "٢. قارن الأسعار", desc: "تظهر لك كل العروض مرتبة بالسعر مع أرخص ومتوسط وأعلى سعر." },
              { Icon: MessagesSquare, title: "٣. تواصل واطلب", desc: "كلّم المورّد مباشرة عبر واتساب أو الهاتف وأنهي طلبك." },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="rounded-3xl bg-card border border-border p-6">
                <div className="rounded-2xl bg-brand-soft text-primary p-3 w-fit">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-bold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured product */}
      <section className="container mx-auto px-4 py-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold">منتجات شائعة</h2>
            <p className="text-muted-foreground text-sm mt-1">شوف كيف تختلف الأسعار من مورّد لآخر.</p>
          </div>
          <Link to="/search" className="text-sm text-primary font-bold hover:underline">
            كل المنتجات ←
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featured.slice(0, 6).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {featured.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
            جاري تحميل المنتجات…
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
