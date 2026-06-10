import { Check, X } from "lucide-react";
import { ORDER_STAGES, orderStageDone, type OrderStage, type QuoteRequestDetailed } from "@/types";

// خريطة المرحلة → الطابع الزمني المقابل (لعرض وقت الإنجاز تحت النقطة)
function stageTime(o: QuoteRequestDetailed, key: OrderStage): string | null {
  const map: Record<OrderStage, string | null> = {
    sent: o.created_at,
    quoted: o.status === "quoted" ? o.updated_at : null,
    accepted: o.accepted_at,
    paid: o.paid_at,
    shipped: o.shipped_at,
    delivered: o.delivered_at,
    rated: null,
  };
  return map[key];
}

function fmt(d: string | null): string {
  if (!d) return "";
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(d));
  } catch {
    return "";
  }
}

// متتبّع مراحل الطلب: نقاط تضيء أخضر كل ما اكتملت مرحلة، والمرحلة الحالية منوّرة.
export function OrderTracker({ order }: { order: QuoteRequestDetailed }) {
  const rejected = order.status === "rejected";
  const cancelled = !!order.cancelled_at;
  const done = orderStageDone(order);
  // المرحلة الحالية = أول مرحلة غير مكتملة
  const currentIdx = ORDER_STAGES.findIndex((s) => !done[s.key]);

  if (rejected || cancelled) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 inline-flex items-center gap-2">
        <X className="h-4 w-4" />
        {rejected ? "تم رفض هذا الطلب من المورّد" : "تم إلغاء هذا الطلب"}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-2">
      {ORDER_STAGES.map((stage, i) => {
        const isDone = done[stage.key];
        const isCurrent = i === currentIdx;
        const t = fmt(stageTime(order, stage.key));
        return (
          <div key={stage.key} className="flex items-start min-w-[64px] flex-1">
            <div className="flex flex-col items-center text-center flex-1">
              <div
                className={[
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 shrink-0",
                  isDone
                    ? "bg-emerald-500 text-white shadow-[0_0_0_4px_rgba(16,185,129,0.18)]"
                    : isCurrent
                      ? "bg-white text-primary border-2 border-primary animate-pulse"
                      : "bg-secondary text-muted-foreground border border-border",
                ].join(" ")}
              >
                {isDone ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`mt-1.5 text-[11px] leading-tight font-bold ${
                  isDone ? "text-emerald-600" : isCurrent ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {stage.label}
              </span>
              {t && <span className="text-[10px] text-muted-foreground mt-0.5">{t}</span>}
            </div>
            {i < ORDER_STAGES.length - 1 && (
              <div
                className={`h-1 rounded-full flex-1 mt-3.5 -mx-1 transition-colors duration-300 ${
                  done[ORDER_STAGES[i + 1].key] ? "bg-emerald-500" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
