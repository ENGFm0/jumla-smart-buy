import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { OrderCard } from "@/components/OrderCard";
import { getMyQuoteRequests } from "@/lib/quotes";

export const Route = createFileRoute("/_authenticated/my-requests")({
  head: () => ({ meta: [{ title: "طلباتي — مدد" }] }),
  component: MyRequestsPage,
});

function MyRequestsPage() {
  const qc = useQueryClient();
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["my-quote-requests"],
    queryFn: getMyQuoteRequests,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["my-quote-requests"] });

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
          <div className="space-y-4">
            {requests.map((r) => (
              <OrderCard key={r.id} order={r} role="buyer" onChange={refresh} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
