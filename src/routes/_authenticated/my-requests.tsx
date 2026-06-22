import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, ChevronDown, Store, ExternalLink, PackageSearch, Search, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CollapsibleOrderCard } from "@/components/OrderCard";
import { OrderTabs } from "@/components/OrderTabs";
import { getMyQuoteRequests } from "@/lib/quotes";
import {
  type OrderCategory,
  classifyOrder,
  ORDER_TABS,
  countByTab,
  lastActivity,
  needsAction,
  fmtDayMonth,
} from "@/lib/orderFilters";
import type { QuoteRequestDetailed } from "@/types";

export const Route = createFileRoute("/_authenticated/my-requests")({
  head: () => ({ meta: [{ title: "طلباتي — مدد" }] }),
  component: MyRequestsPage,
});

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
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const hasFilter = !!(q || from || to);

  const cat = useMemo(() => {
    const m = new Map<string, OrderCategory>();
    for (const r of requests) m.set(r.id, classifyOrder(r));
    return m;
  }, [requests]);
  const counts = useMemo(() => countByTab(requests, cat), [requests, cat]);

  // فلترة بالتبويب ثم تجميع حسب الشركة (المورّد)
  const groups = useMemo<Group[]>(() => {
    const t = ORDER_TABS.find((x) => x.key === tab)!;
    const ql = q.trim().toLowerCase();
    const fromT = from ? new Date(from).getTime() : null;
    const toT = to ? new Date(to).getTime() + 86_400_000 : null; // يشمل يوم "إلى" كاملاً
    const filtered = requests.filter((r) => {
      if (!t.match(cat.get(r.id)!)) return false;
      if (ql) {
        const hay =
          `${r.product?.name ?? ""} ${r.custom_product ?? ""} ${r.supplier?.name ?? ""} ${r.note ?? ""}`.toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      const ct = new Date(r.created_at).getTime();
      if (fromT && ct < fromT) return false;
      if (toT && ct >= toT) return false;
      return true;
    });
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
      g.actionCount = g.orders.filter((o) => needsAction(o, "buyer")).length;
    }
    arr.sort((a, b) => b.latest - a.latest);
    return arr;
  }, [requests, cat, tab, q, from, to]);

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
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <h1 className="text-2xl md:text-3xl font-extrabold">طلباتي</h1>
          <Link
            to="/request-product"
            className="inline-flex items-center gap-2 rounded-2xl border border-primary text-primary px-4 py-2 text-sm font-bold hover:bg-brand-soft transition"
          >
            <PackageSearch className="h-4 w-4" /> اطلب منتجاً غير متوفّر
          </Link>
        </div>

        {requests.length > 0 && <OrderTabs tab={tab} setTab={setTab} counts={counts} />}

        {requests.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 mb-5">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث باسم المنتج أو المورّد…"
                className="w-full rounded-2xl border border-border bg-card pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-2xl border border-border bg-card px-3 py-2.5 text-sm text-muted-foreground"
                title="من تاريخ"
              />
              <span className="text-muted-foreground text-sm">—</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-2xl border border-border bg-card px-3 py-2.5 text-sm text-muted-foreground"
                title="إلى تاريخ"
              />
              {hasFilter && (
                <button
                  onClick={() => {
                    setQ("");
                    setFrom("");
                    setTo("");
                  }}
                  className="inline-flex items-center gap-1 rounded-2xl border border-border px-3 py-2.5 text-sm font-bold hover:bg-secondary transition"
                >
                  <X className="h-4 w-4" /> مسح
                </button>
              )}
            </div>
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
            {hasFilter ? "لا توجد طلبات مطابقة لبحثك." : "لا توجد طلبات في هذا التصنيف."}
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((g) => {
              const key = g.supplierId ?? "—";
              const isOpen = open.has(key);
              return (
                <div key={key} className="rounded-3xl bg-card border border-border overflow-hidden">
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-secondary/40 transition"
                    onClick={() => toggle(key)}
                  >
                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary to-teal-600 text-white flex items-center justify-center font-extrabold shrink-0 shadow-sm">
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
                        <span>· آخر نشاط {fmtDayMonth(g.latest)}</span>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </div>

                  {isOpen && (
                    <div className="border-t border-border p-3 sm:p-4 space-y-2.5 bg-secondary/20">
                      {g.orders.map((r) => (
                        <CollapsibleOrderCard key={r.id} order={r} role="buyer" onChange={refresh} />
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
