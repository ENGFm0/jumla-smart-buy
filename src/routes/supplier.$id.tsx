import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, MapPin, Calendar, Package } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Rating } from "@/components/Rating";
import { ContactButtons } from "@/components/ContactButtons";
import { SupplierReviews } from "@/components/SupplierReviews";
import { Reveal } from "@/components/Reveal";
import { getSupplierById } from "@/lib/suppliers";
import { getProductsBySupplier } from "@/lib/products";
import { formatSAR } from "@/types";

export const Route = createFileRoute("/supplier/$id")({
  component: SupplierPage,
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">المورّد غير موجود</div>
  ),
});

function SupplierPage() {
  const { id } = Route.useParams();
  const { data: supplier, isLoading } = useQuery({
    queryKey: ["supplier", id],
    queryFn: () => getSupplierById(id),
  });
  const { data: products = [] } = useQuery({
    queryKey: ["supplier-products", id],
    queryFn: () => getProductsBySupplier(id),
    enabled: !!supplier,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">جاري التحميل…</div>
      </div>
    );
  }
  if (!supplier) throw notFound();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <Link to="/search" className="text-sm text-muted-foreground hover:text-primary">
          ← العودة للبحث
        </Link>

        {/* ترويسة المورّد */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-teal-700 text-white p-6 mt-3 shadow-lg">
          <div className="pointer-events-none absolute -top-16 -left-10 h-52 w-52 rounded-full bg-white/10 blur-3xl animate-blob" />
          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <span className="h-16 w-16 rounded-2xl bg-white/15 grid place-items-center text-2xl font-extrabold">
                {supplier.name.charAt(0)}
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-extrabold">{supplier.name}</h1>
                  {supplier.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
                      <BadgeCheck className="h-3 w-3" /> موثّق
                    </span>
                  )}
                </div>
                <div className="text-sm text-white/90 mt-2 flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{supplier.city}</span>
                  <Rating value={Number(supplier.rating)} count={supplier.reviews_count} />
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> عضو منذ {supplier.joined_year}</span>
                </div>
                {supplier.description && (
                  <p className="text-sm text-white/90 mt-2 max-w-xl">{supplier.description}</p>
                )}
                {supplier.address && (
                  <p className="text-sm text-white/80 mt-1">العنوان: {supplier.address}</p>
                )}
                {supplier.maps_url && (
                  <a
                    href={supplier.maps_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-bold underline mt-1"
                  >
                    <MapPin className="h-3 w-3" /> الموقع على الخريطة
                  </a>
                )}
              </div>
            </div>
            <div className="w-full sm:w-64">
              <ContactButtons
                phone={supplier.phone}
                whatsapp={supplier.whatsapp}
                message={`السلام عليكم، تواصلت معكم عبر منصة مدد.`}
              />
            </div>
          </div>
        </div>

        {/* منتجات المورّد */}
        <h2 className="text-xl font-extrabold mt-8 mb-3">منتجات المورّد ({products.length})</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {products.map((row, i) => (
            <Reveal key={row.id} delay={Math.min(i, 8) * 40}>
              <Link
                to="/product/$id"
                params={{ id: row.product.id }}
                className="h-full rounded-3xl bg-card border border-border p-4 hover:border-primary hover:shadow-md hover:-translate-y-1 transition duration-200 flex items-center gap-3"
              >
                <div className="rounded-2xl bg-gradient-to-br from-brand-soft to-secondary text-primary p-3 shrink-0">
                  <Package className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold truncate">{row.product.name}</div>
                  <div className="text-xs text-muted-foreground">{row.product.unit}</div>
                </div>
                <div className="font-extrabold text-primary tabular-nums">{formatSAR(Number(row.price))}</div>
              </Link>
            </Reveal>
          ))}
          {products.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-6 sm:col-span-2 lg:col-span-3">
              لا توجد منتجات لهذا المورّد بعد.
            </div>
          )}
        </div>

        {/* التقييمات */}
        <SupplierReviews supplierId={supplier.id} />
      </main>
      <Footer />
    </div>
  );
}
