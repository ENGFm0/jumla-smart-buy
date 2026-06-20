import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { verifyTapCharge } from "@/lib/api/tap.functions";
import { markPaid } from "@/lib/orders";

const searchSchema = z.object({
  tap_id: z.string().optional(),
});

export const Route = createFileRoute("/pay/return")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "نتيجة الدفع — مدد" }] }),
  component: PayReturnPage,
});

function PayReturnPage() {
  const { tap_id } = Route.useSearch();
  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "ok" | "fail">("loading");

  useEffect(() => {
    let alive = true;
    if (!tap_id) {
      setState("fail");
      return;
    }
    verifyTapCharge({ data: { tapId: tap_id } })
      .then(async (r) => {
        if (!alive) return;
        if (r.ok) {
          // الدفع مؤكّد من الخادم — يثبّت المشتري الطلب «مدفوع» (RLS يقصره على طلبه)
          if (r.orderId) {
            try {
              await markPaid(r.orderId);
            } catch {
              /* قد يكون مثبّتاً مسبقاً */
            }
          }
          if (!alive) return;
          setState("ok");
          setTimeout(() => navigate({ to: "/my-requests" }), 2200);
        } else {
          setState("fail");
        }
      })
      .catch(() => alive && setState("fail"));
    return () => {
      alive = false;
    };
  }, [tap_id, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16 flex-1">
        <div className="max-w-md mx-auto rounded-3xl bg-card border border-border p-8 text-center">
          {state === "loading" && (
            <>
              <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
              <h1 className="text-xl font-extrabold mt-4">جارٍ تأكيد الدفع…</h1>
              <p className="text-sm text-muted-foreground mt-1">لحظات من فضلك.</p>
            </>
          )}
          {state === "ok" && (
            <>
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-600" />
              <h1 className="text-xl font-extrabold mt-4">تم الدفع بنجاح</h1>
              <p className="text-sm text-muted-foreground mt-1">
                سيجهّز المورّد طلبك للشحن. يتم تحويلك لطلباتك…
              </p>
              <Link
                to="/my-requests"
                className="inline-block mt-5 rounded-2xl bg-primary text-primary-foreground px-6 py-2.5 font-bold text-sm"
              >
                عرض طلباتي
              </Link>
            </>
          )}
          {state === "fail" && (
            <>
              <XCircle className="h-12 w-12 mx-auto text-rose-600" />
              <h1 className="text-xl font-extrabold mt-4">لم يكتمل الدفع</h1>
              <p className="text-sm text-muted-foreground mt-1">
                لم تتم العملية أو أُلغيت. يمكنك المحاولة مرة أخرى من صفحة الطلب.
              </p>
              <Link
                to="/my-requests"
                className="inline-block mt-5 rounded-2xl border border-border px-6 py-2.5 font-bold text-sm"
              >
                العودة لطلباتي
              </Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
