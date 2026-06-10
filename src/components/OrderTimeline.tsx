import {
  Send,
  Tag,
  CheckCircle2,
  CreditCard,
  Truck,
  PackageCheck,
  Star,
  XCircle,
} from "lucide-react";
import { formatSAR, type QuoteRequestDetailed } from "@/types";

function fmt(d: string | null | undefined): string {
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

type Event = {
  icon: typeof Send;
  label: string;
  date: string | null;
  detail?: string;
};

// سجل زمني مؤرّخ لكل عملية على الطلب (إرسال → تسعير → قبول → دفع → شحن → توصيل → تقييم)
export function OrderTimeline({ order }: { order: QuoteRequestDetailed }) {
  const events: Event[] = [{ icon: Send, label: "أُرسل الطلب", date: order.created_at }];

  if (order.quoted_at || order.quoted_price != null) {
    events.push({
      icon: Tag,
      label: "تم التسعير",
      date: order.quoted_at ?? null,
      detail:
        order.quoted_price != null
          ? formatSAR(Number(order.quoted_price)) + " / الوحدة"
          : undefined,
    });
  }
  if (order.accepted_at)
    events.push({ icon: CheckCircle2, label: "قبول العرض", date: order.accepted_at });
  if (order.paid_at)
    events.push({
      icon: CreditCard,
      label: "تم الدفع",
      date: order.paid_at,
      detail: order.invoice_number ? `فاتورة ${order.invoice_number}` : undefined,
    });
  if (order.shipped_at)
    events.push({
      icon: Truck,
      label: "تم الشحن",
      date: order.shipped_at,
      detail: order.shipping_info ?? undefined,
    });
  if (order.delivered_at)
    events.push({ icon: PackageCheck, label: "تم التوصيل", date: order.delivered_at });
  if (order.buyer_rating != null)
    events.push({
      icon: Star,
      label: "قيّم المشتري المورّد",
      date: null,
      detail: `${order.buyer_rating}/5`,
    });
  if (order.supplier_rating != null)
    events.push({
      icon: Star,
      label: "قيّم المورّد المشتري",
      date: null,
      detail: `${order.supplier_rating}/5`,
    });
  if (order.cancelled_at)
    events.push({ icon: XCircle, label: "أُلغي الطلب", date: order.cancelled_at });

  return (
    <ol className="relative space-y-3">
      {events.map((e, i) => {
        const Icon = e.icon;
        return (
          <li key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="h-7 w-7 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4" />
              </span>
              {i < events.length - 1 && <span className="w-px flex-1 bg-border my-0.5" />}
            </div>
            <div className="pb-1 min-w-0">
              <div className="text-sm font-bold leading-tight">{e.label}</div>
              {e.detail && (
                <div className="text-xs text-muted-foreground mt-0.5 break-words">{e.detail}</div>
              )}
              {e.date && (
                <div className="text-[11px] text-muted-foreground mt-0.5">{fmt(e.date)}</div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
