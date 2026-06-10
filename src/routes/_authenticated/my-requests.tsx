import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, ChevronDown, Store, ExternalLink } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { OrderCard } from "@/components/OrderCard";
import { getMyQuoteRequests } from "@/lib/quotes";
import type { QuoteRequestDetailed } from "@/types";

export const Route = createFileRoute("/_authenticated/my-requests")({
  head: () => ({ meta: [{ title: "طلباتي — مدد" }] }),
  component: MyRequestsPage,
});

// تصنيف الطلب
type Category = "waiting" | "ongoing" | "done" | "rejected";
function classify(o: QuoteRequestDetailed): Category {
  if (o.status === "rejected" || o.cancelled_at) return "rejected";
  if (o.delivered_at) return "done";
  if (o.status === "pending") return "waiting"; // بانتظار تسعير المورّد
  return "ongoing"; // مسعّر / مقبول / مدفوع / مشحون
}

const TABS: { key: string; label: string; match: (c: Category) => boolean }[] = [
  { key: "active", label: "النشطة", match: (c) => c === "waiting" || c === "ongoing" },
  { key: "waiting", label: "المنتظر", match: (c) => c === "waiting" },
  { key: "ongoing", label: "الجاري", match: (c) => c === "ongoing" },
  { key: "done", label: "المنتهي", match: (c) => c === "done" },
  { key: "rejected", label: "المرفوض", match: (c) => c === "rejected" },
];

// آخر نشاط على الطلب (لترتيب الشركات والطلبات بالأحدث)
function lastActivity(o: QuoteRequestDetailed): number {
  const dates = [
    o.created_at,
    o.quoted_at,
    o.accepted_at,
    o.paid_at,
    o.shipped_at,
    o.delivered_at,
    o.cancelled_at,
  ].filter(Boolean) as string[];
  return Math.max(...dates.map((d) => new Date(d).getTime()));
}

// هل الطلب يحتاج إجراءً من المشتري الآن؟
function needsBuyerAction(o: QuoteRequestDetailed): boolean {
  if (o.status === "rejected" || o.cancelled_at) return false;
  if (o.status === "quoted" && !o.accepted_at) return true;
  if (o.accepted_at && !o.paid_at) return true;
  if (o.shipped_at && !o.delivered_at) return true;
  if (o.delivered_at && o.buyer_rating == null) return true;
  return false;
}

function fmtDate(ms: number): string {
  try {
    return new Intl.DateTimeFormat("ar-SA", { day: "numeric", month: "short" }).format(
      new Date(ms),
    );
  } catch {
    return "";
  }
}

type Group = {
  supplierId: string | null;
  name: string;
  city: string | null;
  orders: QuoteRequestDetailed[];
  latest: number;
  actionCount: number;
};

function MyRequestsPage() {
  const qc = useQueryClient();
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["my-quote-requests"],
    queryFn: getMyQuoteRequests,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["my-quote-requests"] });

  const [tab, setTab] = useState("active");

  // تصنيف كل طلب + أعداد التبويبات
  const cat = useMemo(() => {
    const m = new Map<string, Category>();
    for (const r of requests) m.set(r.id, classify(r));
    return m;
  }, [requests]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { active: 0, waiting: 0, ongoing: 0, done: 0, rejected: 0 };
    for (const r of requests) {
      const k = cat.get(r.id)!;
      c[k]++;
      if (k === "waiting" || k === "ongoing") c.active++;
    }
    return c;
  }, [requests, cat]);

  // الطلبات بعد الفلترة بالتبويب، مجمّعة حسب الشركة
  const groups = useMemo<Group[]>(() => {
    const t = TABS.find((x) => x.key === tab)!;
    const filtered = requests.filter((r) => t.match(cat.get(r.id)!));
    const map = new Map<string, Group>();
    for (const r of filtered) {
      const key = r.supplier?.id ?? "—";
      let g = map.get(key);
      if (!g) {
        g = {
          supplierId: r.supplier?.id ?? null,
          name: r.supplier?.name ?? "مورّد",
          city: r.supplier?.city ?? null,
          orders: [],
          latest: 0,
          actionCount: 0,
        };
        map.set(key, g);
      }
      g.orders.push(r);
    }
    const arr = Array.from(map.values());
    for (const g of arr) {
      g.orders.sort((a, b) => lastActivity(b) - lastActivity(a));
      g.latest = Math.max(...g.orders.map(lastActivity));
      g.actionCount = g.orders.filter(needsBuyerAction).length;
    }
    arr.sort((a, b) => b.latest - a.latest);
    return arr;
  }, [requests, cat, tab]);

  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-4">طلباتي</h1>

        {/* تبويبات الفلترة */}
        {requests.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-bold transition border ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:bg-secondary"
                  }`}
                >
                  {t.label}
                  <span
                    className={`mr-1.5 rounded-full px-1.5 py-0.5 text-[11px] ${
                      active ? "bg-white/20" : "bg-secondary"
                    }`}
                  >
                    {counts[t.key]}
                  </span>
                </button>
              );
            })}
          </div>
        )}

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
        ) : groups.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
            لا توجد طلبات في هذا التصنيف.
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => {
              const key = g.supplierId ?? "—";
              const isOpen = open.has(key);
              return (
                <div key={key} className="rounded-3xl bg-card border border-border overflow-hidden">
                  {/* ترويسة الشركة — اضغط للطي/الفتح */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-secondary/40 transition"
                    onClick={() => toggle(key)}
                  >
                    <div className="h-11 w-11 rounded-2xl bg-brand-soft text-primary flex items-center justify-center font-extrabold shrink-0">
                      {g.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {g.supplierId ? (
                          <Link
                            to="/supplier/$id"
                            params={{ id: g.supplierId }}
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold hover:text-primary inline-flex items-center gap-1"
                          >
                            {g.name}
                            <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                          </Link>
                        ) : (
                          <span className="font-bold">{g.name}</span>
                        )}
                        {g.actionCount > 0 && (
                          <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[11px] font-bold">
                            {g.actionCount} يحتاج إجراء
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                        {g.city && (
                          <span className="inline-flex items-center gap-1">
                            <Store className="h-3 w-3" /> {g.city}
                          </span>
                        )}
                        <span>· {g.orders.length} طلب</span>
                        <span>· آخر نشاط {fmtDate(g.latest)}</span>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </div>

                  {/* طلبات الشركة */}
                  {isOpen && (
                    <div className="border-t border-border p-3 sm:p-4 space-y-4 bg-secondary/20">
                      {g.orders.map((r) => (
                        <OrderCard key={r.id} order={r} role="buyer" onChange={refresh} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
