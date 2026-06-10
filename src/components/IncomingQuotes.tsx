import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, ChevronDown, Store } from "lucide-react";
import { OrderCard } from "@/components/OrderCard";
import { OrderTabs } from "@/components/OrderTabs";
import { getSupplierQuoteRequests } from "@/lib/quotes";
import { getBuyerContactsByIds } from "@/lib/orders";
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

type Group = {
  buyerId: string;
  name: string;
  city: string | null;
  orders: QuoteRequestDetailed[];
  latest: number;
  actionCount: number;
};

export function IncomingQuotes({ supplierId }: { supplierId: string }) {
  const qc = useQueryClient();
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["incoming-quotes", supplierId],
    queryFn: () => getSupplierQuoteRequests(supplierId),
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["incoming-quotes", supplierId] });

  // أسماء المشترين (لتجميع الطلبات حسب المطعم/المحل)
  const buyerIds = useMemo(() => Array.from(new Set(requests.map((r) => r.buyer_id))), [requests]);
  const { data: buyers = {} } = useQuery({
    queryKey: ["buyer-contacts", buyerIds],
    queryFn: () => getBuyerContactsByIds(buyerIds),
    enabled: buyerIds.length > 0,
  });

  const [tab, setTab] = useState("active");

  const cat = useMemo(() => {
    const m = new Map<string, OrderCategory>();
    for (const r of requests) m.set(r.id, classifyOrder(r));
    return m;
  }, [requests]);
  const counts = useMemo(() => countByTab(requests, cat), [requests, cat]);

  const groups = useMemo<Group[]>(() => {
    const t = ORDER_TABS.find((x) => x.key === tab)!;
    const filtered = requests.filter((r) => t.match(cat.get(r.id)!));
    const map = new Map<string, Group>();
    for (const r of filtered) {
      let g = map.get(r.buyer_id);
      if (!g) {
        g = {
          buyerId: r.buyer_id,
          name: buyers[r.buyer_id]?.business_name ?? "مشترٍ",
          city: buyers[r.buyer_id]?.city ?? null,
          orders: [],
          latest: 0,
          actionCount: 0,
        };
        map.set(r.buyer_id, g);
      }
      g.orders.push(r);
    }
    const arr = Array.from(map.values());
    for (const g of arr) {
      g.orders.sort((a, b) => lastActivity(b) - lastActivity(a));
      g.latest = Math.max(...g.orders.map(lastActivity));
      g.actionCount = g.orders.filter((o) => needsAction(o, "supplier")).length;
    }
    arr.sort((a, b) => b.latest - a.latest);
    return arr;
  }, [requests, cat, tab, buyers]);

  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="rounded-3xl bg-card border border-border p-6">
      <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
        <Inbox className="h-5 w-5" /> الطلبات الواردة ({requests.length})
      </h3>

      {requests.length > 0 && <OrderTabs tab={tab} setTab={setTab} counts={counts} />}

      {isLoading ? (
        <div className="text-center text-sm text-muted-foreground py-6">جاري التحميل…</div>
      ) : requests.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-6">
          لا توجد طلبات عروض أسعار بعد.
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-6">
          لا توجد طلبات في هذا التصنيف.
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => {
            const isOpen = open.has(g.buyerId);
            return (
              <div key={g.buyerId} className="rounded-2xl border border-border overflow-hidden">
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-secondary/40 transition"
                  onClick={() => toggle(g.buyerId)}
                >
                  <div className="h-10 w-10 rounded-2xl bg-brand-soft text-primary flex items-center justify-center font-extrabold shrink-0">
                    {g.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold">{g.name}</span>
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
                  <div className="border-t border-border p-3 space-y-4 bg-secondary/20">
                    {g.orders.map((r) => (
                      <OrderCard key={r.id} order={r} role="supplier" onChange={refresh} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
