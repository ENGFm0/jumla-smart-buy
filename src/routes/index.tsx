import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  BarChart3,
  MessagesSquare,
  PackageSearch,
  Package,
  TrendingDown,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CategoryChip } from "@/components/CategoryChip";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { getCategories, getCategoryCounts, getProductsWithStats } from "@/lib/products";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "مدد — قارن أسعار الجملة، واطلب من الأوفر لك" },
      {
        name: "description",
        content:
          "منصة سعودية للبيع بالجملة تربط الموردين بأصحاب المحلات والمطاعم. قارن أسعار العروض من جميع الموردين فوراً.",
      },
    ],
  }),
  component: Index,
});

function Index() {
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
      <section className="relative overflow-hidden text-white" style={{ background: "var(--gradient-brand)" }}>
        {/* فقاعات زخرفية متحرّكة */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/15 blur-3xl animate-blob" />
        <div className="pointer-events-none absolute top-32 -left-20 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl animate-blob [animation-delay:3s]" />
        <div className="absolute inset-0 opacity-[0.15] [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:26px_26px]" />

        <div className="container mx-auto px-4 pt-16 pb-20 relative">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* النص */}
            <div className="reveal is-visible">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> منصة سعودية للبيع بالجملة B2B
              </span>
              <h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-[1.1]">
                قارن أسعار الجملة،
                <br />
                واطلب من <span className="text-teal-200">الأوفر</span> لك
              </h1>
              <p className="mt-5 text-lg text-white/90 max-w-xl">
                نربط أصحاب المحلات والمطاعم بأفضل موردي الجملة. شوف كل العروض من كل الموردين، رتّبهم
                بالسعر، واطلب مباشرة.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                {[
                  { v: `${categories.length}+`, l: "فئة" },
                  { v: `${featured.length}+`, l: "منتج" },
                  { v: "فوري", l: "مقارنة الأسعار" },
                ].map((s) => (
                  <div
                    key={s.l}
                    className="rounded-2xl bg-white/10 backdrop-blur px-5 py-3 border border-white/15"
                  >
                    <div className="text-2xl font-extrabold leading-none">{s.v}</div>
                    <div className="text-[11px] text-white/75 mt-1">{s.l}</div>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-xs text-white/70">
                تصفّح بحرية — سجّل الدخول لعرض بيانات الموردين والتواصل وطلب عروض الأسعار.
              </p>
            </div>

            {/* بطاقة مقارنة عائمة (توضيحية) */}
            <div className="hidden lg:block">
              <div className="relative mx-auto max-w-sm animate-float">
                <div className="rounded-[28px] bg-white text-foreground p-5 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-brand-soft text-primary grid place-items-center text-2xl">
                      🛢️
                    </div>
                    <div>
                      <div className="font-extrabold">زيت قلي ٤×٤ لتر</div>
                      <div className="text-xs text-muted-foreground">٣ عروض من موردين</div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {[
                      { n: "مورّد الرياض", p: "١٢٢ ر.س", best: true },
                      { n: "جملة الخليج", p: "١٣٠ ر.س", best: false },
                      { n: "أسواق المدينة", p: "١٣٨ ر.س", best: false },
                    ].map((o) => (
                      <div
                        key={o.n}
                        className={`flex items-center justify-between rounded-2xl border px-3 py-2.5 ${
                          o.best ? "border-primary bg-brand-soft/60" : "border-border"
                        }`}
                      >
                        <span className="text-sm font-bold">{o.n}</span>
                        <span className="flex items-center gap-2">
                          {o.best && (
                            <span className="rounded-full bg-primary text-white text-[10px] font-bold px-2 py-0.5">
                              الأوفر
                            </span>
                          )}
                          <span className="font-extrabold tabular-nums text-primary">{o.p}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-emerald-600 text-sm font-bold">
                    <TrendingDown className="h-4 w-4" /> وفّرت ١٦ ر.س على الكرتون
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* منحنى سفلي ناعم */}
        <div className="h-10 bg-background rounded-t-[40px]" />
      </section>

      {/* Value props */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { Icon: BarChart3, t: "شفافية بالأسعار", d: "قارن أرخص ومتوسط وأعلى سعر لكل منتج فوراً." },
            { Icon: ShieldCheck, t: "موردون موثّقون", d: "نوثّق بيانات الموردين وحساباتهم البنكية قبل التعامل." },
            { Icon: MessagesSquare, t: "تواصل مباشر", d: "كلّم المورّد، تابع طلبك، واستلم فاتورتك من مكان واحد." },
          ].map((v, i) => (
            <Reveal key={v.t} delay={i * 80}>
              <div className="h-full rounded-3xl bg-card border border-border p-6 hover:shadow-lg hover:-translate-y-1 transition duration-200">
                <div className="rounded-2xl bg-gradient-to-br from-primary to-teal-600 text-white p-3 w-fit shadow-sm">
                  <v.Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-extrabold text-lg">{v.t}</h3>
                <p className="text-sm text-muted-foreground mt-1">{v.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-8">
        <Reveal>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold">تصفّح حسب الفئة</h2>
              <p className="text-muted-foreground text-sm mt-1">اختر الفئة التي تهمك وابدأ بالمقارنة.</p>
            </div>
            <Link to="/search" className="text-sm text-primary font-bold hover:underline shrink-0">
              عرض الكل ←
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {categories.map((c, i) => (
            <Reveal key={c.id} delay={i * 40}>
              <Link
                to="/search"
                search={{ cat: c.id } as any}
                className="block rounded-3xl border border-border bg-card hover:border-primary hover:shadow-md hover:-translate-y-1 transition duration-200 p-5 text-center"
              >
                <div className="mx-auto mb-3 w-fit">
                  <CategoryChip icon={c.icon} name={c.name} asButton={false} />
                </div>
                <div className="text-sm text-muted-foreground">{counts[c.id] ?? 0} منتج</div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-secondary/50 py-16 mt-8">
        <div className="container mx-auto px-4">
          <Reveal>
            <h2 className="text-2xl md:text-3xl font-extrabold text-center">كيف تعمل المنصة؟</h2>
            <p className="text-center text-muted-foreground mt-2">٣ خطوات بسيطة لتوفّر وقتك وفلوسك</p>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-4 mt-10">
            {[
              { Icon: Search, n: "١", title: "ابحث عن المنتج", desc: "اكتب اسم المنتج اللي تحتاجه وشف العروض المتاحة." },
              { Icon: BarChart3, n: "٢", title: "قارن الأسعار", desc: "تظهر لك كل العروض مرتبة بالسعر مع أرخص ومتوسط وأعلى سعر." },
              { Icon: MessagesSquare, n: "٣", title: "تواصل واطلب", desc: "كلّم المورّد وأنهِ طلبك وتابعه حتى التوصيل." },
            ].map(({ Icon, n, title, desc }, i) => (
              <Reveal key={title} delay={i * 100}>
                <div className="relative h-full rounded-3xl bg-card border border-border p-6 hover:shadow-lg transition duration-200">
                  <div className="absolute -top-4 right-6 h-9 w-9 rounded-full bg-primary text-white grid place-items-center font-extrabold shadow-md">
                    {n}
                  </div>
                  <div className="rounded-2xl bg-brand-soft text-primary p-3 w-fit">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-extrabold text-lg">{title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="container mx-auto px-4 py-16">
        <Reveal>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold">منتجات شائعة</h2>
              <p className="text-muted-foreground text-sm mt-1">شوف كيف تختلف الأسعار من مورّد لآخر.</p>
            </div>
            <Link to="/search" className="text-sm text-primary font-bold hover:underline shrink-0">
              كل المنتجات ←
            </Link>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featured.slice(0, 6).map((p, i) => (
            <Reveal key={p.id} delay={i * 60}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
        {featured.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
            جاري تحميل المنتجات…
          </div>
        )}

        {/* CTA */}
        <Reveal>
          <div className="mt-12 rounded-[32px] bg-gradient-to-br from-primary to-teal-700 text-white p-8 md:p-10 text-center relative overflow-hidden">
            <div className="pointer-events-none absolute -top-16 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl animate-blob" />
            <h3 className="text-2xl md:text-3xl font-extrabold relative">ما لقيت المنتج اللي تبيه؟</h3>
            <p className="text-white/85 mt-2 relative">اطلبه وسنوصل طلبك لكل الموردين المناسبين دفعة واحدة.</p>
            <Link
              to="/request-product"
              className="relative inline-flex items-center gap-2 mt-6 rounded-full bg-white text-primary px-6 py-3 font-extrabold hover:scale-105 transition"
            >
              <PackageSearch className="h-5 w-5" /> اطلب منتجاً غير متوفّر
            </Link>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
