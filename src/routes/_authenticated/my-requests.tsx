import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getMyQuoteRequests } from "@/lib/quotes";
import { formatSAR, QUOTE_STATUS_LABEL, type QuoteStatus } from "@/types";

const STATUS_STYLE: Record<QuoteStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  quoted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  closed: "bg-slate-200 text-slate-600",
};

export const Route = createFileRoute("/_authenticated/my-requests")({
  head: () => ({ meta: [{ title: "طلباتي — مدد" }] }),
  component: MyRequestsPage,
});

function MyRequestsPage() {
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["my-quote-requests"],
    queryFn: getMyQuoteRequests,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-6">طلباتي</h1>
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">جاري التحميل…</div>
        ) : requests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-16 text-center">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="font-bold mt-3">لا توجد طلبات بعد</h3>
            <p className="text-sm text-muted-foreground mt-1">
              أرسل «طلب عرض سعر» من صفحة أي منتج وستظهر هنا.
            </p>
            <Link
              to="/search"
              className="inline-block mt-5 rounded-2xl bg-primary text-primary-foreground px-5 py-2.5 font-bold"
            >
              تصفّح المنتجات
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="rounded-3xl bg-card border border-border p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="font-bold">{r.product?.name ?? "منتج"}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      المورّد: {r.supplier?.name ?? "—"}
                      {r.supplier?.city ? ` — ${r.supplier.city}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      الكمية: <span className="font-bold text-foreground">{r.quantity}</span>
                    </p>
                    {r.note && (
                      <p className="text-sm text-muted-foreground mt-1">ملاحظتك: {r.note}</p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[r.status]}`}
                  >
                    {QUOTE_STATUS_LABEL[r.status]}
                  </span>
                </div>

                {(r.status === "quoted" || r.quoted_price != null || r.supplier_reply) && (
                  <div className="mt-4 rounded-2xl bg-brand-soft/50 border border-border p-4">
                    {r.quoted_price != null && (
                      <div className="font-extrabold text-primary text-lg">
                        السعر المقترح: {formatSAR(Number(r.quoted_price))}
                      </div>
                    )}
                    {r.supplier_reply && (
                      <p className="text-sm text-muted-foreground mt-1">
                        رد المورّد: {r.supplier_reply}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
