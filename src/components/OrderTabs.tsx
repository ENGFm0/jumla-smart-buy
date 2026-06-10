import { ORDER_TABS } from "@/lib/orderFilters";

// شريط تبويبات فلترة الطلبات (مشترك بين المشتري والمورّد)
export function OrderTabs({
  tab,
  setTab,
  counts,
}: {
  tab: string;
  setTab: (k: string) => void;
  counts: Record<string, number>;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
      {ORDER_TABS.map((t) => {
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
  );
}
