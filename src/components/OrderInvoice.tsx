import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { getBuyerContact } from "@/lib/orders";
import { formatSAR, type QuoteRequestDetailed } from "@/types";

function fmtDate(d: string | null): string {
  if (!d) return "";
  try {
    return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(d));
  } catch {
    return "";
  }
}

// فاتورة الطلب — تظهر للطرفين بعد تأكيد الدفع.
export function OrderInvoice({ order }: { order: QuoteRequestDetailed }) {
  const { data: buyer } = useQuery({
    queryKey: ["buyer-contact", order.buyer_id],
    queryFn: () => getBuyerContact(order.buyer_id),
  });

  const unit = order.quoted_price != null ? Number(order.quoted_price) : 0;
  const total = unit * order.quantity;

  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2 font-extrabold">
          <FileText className="h-5 w-5 text-primary" /> فاتورة
        </div>
        <div className="text-left">
          <div className="text-xs text-muted-foreground">رقم الفاتورة</div>
          <div className="font-bold text-sm">{order.invoice_number ?? "—"}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{fmtDate(order.paid_at)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 py-3 text-sm">
        <div>
          <div className="text-xs text-muted-foreground mb-1">المورّد</div>
          <div className="font-bold">{order.supplier?.name ?? "—"}</div>
          {order.supplier?.city && (
            <div className="text-muted-foreground">{order.supplier.city}</div>
          )}
          {order.supplier?.phone && (
            <div className="text-muted-foreground">{order.supplier.phone}</div>
          )}
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">المشتري</div>
          <div className="font-bold">{buyer?.business_name ?? "—"}</div>
          {buyer?.city && <div className="text-muted-foreground">{buyer.city}</div>}
          {buyer?.phone && <div className="text-muted-foreground">{buyer.phone}</div>}
        </div>
      </div>

      <table className="w-full text-sm border-t border-border">
        <thead>
          <tr className="text-muted-foreground text-xs">
            <th className="text-right py-2 font-medium">المنتج</th>
            <th className="text-center py-2 font-medium">الكمية</th>
            <th className="text-center py-2 font-medium">سعر الوحدة</th>
            <th className="text-left py-2 font-medium">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-border">
            <td className="py-2 font-bold">{order.product?.name ?? "منتج"}</td>
            <td className="py-2 text-center">
              {order.quantity}
              {order.product?.unit ? ` ${order.product.unit}` : ""}
            </td>
            <td className="py-2 text-center">{formatSAR(unit)}</td>
            <td className="py-2 text-left font-bold">{formatSAR(total)}</td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-between items-center border-t border-border pt-3 mt-1">
        <span className="font-bold">الإجمالي</span>
        <span className="text-lg font-extrabold text-primary">{formatSAR(total)}</span>
      </div>
    </div>
  );
}
