import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Inbox, Store } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { IncomingQuotes } from "@/components/IncomingQuotes";
import { useAuth } from "@/lib/auth";
import { getSupplierByUserId } from "@/lib/suppliers";

export const Route = createFileRoute("/_authenticated/incoming")({
  head: () => ({ meta: [{ title: "الطلبات الواردة — مدد" }] }),
  component: IncomingPage,
});

function IncomingPage() {
  const { user } = useAuth();
  const { data: supplier, isLoading } = useQuery({
    queryKey: ["supplier", user?.id],
    queryFn: () => getSupplierByUserId(user!.id),
    enabled: !!user?.id,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-6 flex items-center gap-2">
          <Inbox className="h-7 w-7 text-primary" /> الطلبات الواردة
        </h1>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">جاري التحميل…</div>
        ) : !supplier ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center">
            <Store className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="font-bold mt-3">أكمل بيانات متجرك أولاً</h3>
            <p className="text-sm text-muted-foreground mt-1">
              جهّز متجرك من لوحة المورّد لتبدأ باستقبال طلبات الزبائن.
            </p>
            <Link
              to="/dashboard"
              className="inline-block mt-5 rounded-2xl bg-primary text-primary-foreground px-5 py-2.5 font-bold"
            >
              لوحة المورّد
            </Link>
          </div>
        ) : (
          <IncomingQuotes supplierId={supplier.id} />
        )}
      </main>
      <Footer />
    </div>
  );
}
