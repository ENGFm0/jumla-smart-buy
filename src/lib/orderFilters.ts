import type { QuoteRequestDetailed } from "@/types";

// تصنيف الطلب لأغراض الفلترة (مشترك بين المشتري والمورّد)
export type OrderCategory = "waiting" | "ongoing" | "done" | "rejected";

export function classifyOrder(o: QuoteRequestDetailed): OrderCategory {
  if (o.status === "rejected" || o.cancelled_at) return "rejected";
  if (o.delivered_at) return "done";
  if (o.status === "pending") return "waiting"; // بانتظار التسعير
  return "ongoing"; // مسعّر / مقبول / مدفوع / مشحون
}

export const ORDER_TABS: { key: string; label: string; match: (c: OrderCategory) => boolean }[] = [
  { key: "active", label: "النشطة", match: (c) => c === "waiting" || c === "ongoing" },
  { key: "waiting", label: "المنتظر", match: (c) => c === "waiting" },
  { key: "ongoing", label: "الجاري", match: (c) => c === "ongoing" },
  { key: "done", label: "المنتهي", match: (c) => c === "done" },
  { key: "rejected", label: "المرفوض", match: (c) => c === "rejected" },
];

// آخر نشاط على الطلب (لترتيب الأحدث أولاً)
export function lastActivity(o: QuoteRequestDetailed): number {
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

// هل الطلب يحتاج إجراءً من الطرف الحالي الآن؟
export function needsAction(o: QuoteRequestDetailed, role: "buyer" | "supplier"): boolean {
  if (o.status === "rejected" || o.cancelled_at) return false;
  if (role === "supplier") {
    if (o.status === "pending") return true; // يحتاج تسعير
    if (o.paid_at && !o.shipped_at) return true; // يحتاج شحن
    if (o.delivered_at && o.supplier_rating == null) return true; // يحتاج تقييم
    return false;
  }
  if (o.status === "quoted" && !o.accepted_at) return true;
  if (o.accepted_at && !o.paid_at) return true;
  if (o.shipped_at && !o.delivered_at) return true;
  if (o.delivered_at && o.buyer_rating == null) return true;
  return false;
}

export function countByTab(
  orders: QuoteRequestDetailed[],
  cat: Map<string, OrderCategory>,
): Record<string, number> {
  const c: Record<string, number> = { active: 0, waiting: 0, ongoing: 0, done: 0, rejected: 0 };
  for (const o of orders) {
    const k = cat.get(o.id)!;
    c[k]++;
    if (k === "waiting" || k === "ongoing") c.active++;
  }
  return c;
}

export function fmtDayMonth(ms: number): string {
  try {
    return new Intl.DateTimeFormat("ar-SA", { day: "numeric", month: "short" }).format(
      new Date(ms),
    );
  } catch {
    return "";
  }
}
