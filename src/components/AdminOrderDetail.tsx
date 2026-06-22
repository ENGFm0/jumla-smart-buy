import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, MessageCircle, Phone, Printer, FileText, Paperclip } from "lucide-react";
import { OrderTimeline } from "./OrderTimeline";
import {
  getOrderMessages,
  getChatAttachmentUrl,
  getPaymentReceiptUrl,
  type BuyerContact,
} from "@/lib/orders";
import { printInvoice } from "@/lib/printInvoice";
import { classifyOrder } from "@/lib/orderFilters";
import type { AdminOrder } from "@/lib/admin";
import { formatSAR, orderRef, type QuoteMessage, type QuoteRequestDetailed } from "@/types";

const CAT_BADGE: Record<string, string> = {
  waiting: "bg-slate-100 text-slate-600",
  ongoing: "bg-sky-100 text-sky-700",
  done: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};
const CAT_LABEL: Record<string, string> = {
  waiting: "بانتظار التسعير",
  ongoing: "جارٍ",
  done: "منتهٍ",
  rejected: "مرفوض/ملغي",
};

// عرض تفصيلي للطلب في لوحة الإدارة (للاطلاع: تواريخ + محادثة + إيصال + فاتورة)
export function AdminOrderDetail({ order, buyer }: { order: AdminOrder; buyer?: BuyerContact }) {
  const [open, setOpen] = useState(false);
  const cat = classifyOrder(order as never);
  const total = order.quoted_price != null ? Number(order.quoted_price) * order.quantity : null;
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-3 text-right hover:bg-secondary/40 transition"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] rounded bg-secondary px-1.5 py-0.5" dir="ltr">
              {orderRef(order.id)}
            </span>
            <span className="font-bold truncate">
              {order.product?.name ?? order.custom_product ?? "منتج"}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${CAT_BADGE[cat]}`}>
              {CAT_LABEL[cat]}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 truncate">
            {order.supplier?.name ?? "—"}
            {buyer?.business_name ? ` ← ${buyer.business_name}` : ""} • الكمية {order.quantity}
            {total != null ? ` • ${formatSAR(total)}` : ""}
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <AdminOrderBody order={order} buyer={buyer} />}
    </div>
  );
}

function AdminOrderBody({ order, buyer }: { order: AdminOrder; buyer?: BuyerContact }) {
  const { data: messages = [] } = useQuery({
    queryKey: ["admin-order-messages", order.id],
    queryFn: () => getOrderMessages(order.id),
  });

  return (
    <div className="border-t border-border p-4 bg-secondary/20 space-y-4">
      {/* الأطراف */}
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-xs text-muted-foreground mb-1">المورّد</div>
          <div className="font-bold">{order.supplier?.name ?? "—"}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-xs text-muted-foreground mb-1">العميل</div>
          <div className="font-bold">{buyer?.business_name ?? "—"}</div>
          {buyer?.phone && (
            <a
              href={`tel:${buyer.phone}`}
              className="text-primary inline-flex items-center gap-1 text-xs mt-0.5"
            >
              <Phone className="h-3 w-3" /> {buyer.phone}
            </a>
          )}
          {buyer?.city && <div className="text-xs text-muted-foreground">{buyer.city}</div>}
        </div>
      </div>

      {/* السجل الزمني */}
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="text-xs font-bold text-muted-foreground mb-2">السجل الزمني</div>
        <OrderTimeline order={order as unknown as QuoteRequestDetailed} />
      </div>

      {/* إيصال التحويل */}
      {order.payment_receipt_path && <ReceiptLink path={order.payment_receipt_path} />}

      {/* المحادثة */}
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" /> المحادثة ({messages.length})
        </div>
        {messages.length === 0 ? (
          <div className="text-xs text-muted-foreground">لا توجد رسائل.</div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {messages.map((m) => (
              <AdminMessage key={m.id} m={m} buyerId={order.buyer_id} />
            ))}
          </div>
        )}
      </div>

      {/* طباعة الفاتورة */}
      {order.paid_at && (
        <button
          onClick={() =>
            printInvoice({
              invoiceNumber: order.invoice_number,
              date: order.paid_at,
              supplier: { name: order.supplier?.name },
              buyer: { name: buyer?.business_name, city: buyer?.city, phone: buyer?.phone },
              productName: order.product?.name ?? order.custom_product ?? "منتج",
              quantity: order.quantity,
              unitPrice: Number(order.quoted_price ?? 0),
            })
          }
          className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-secondary transition"
        >
          <Printer className="h-3.5 w-3.5" /> طباعة الفاتورة {order.invoice_number ?? ""}
        </button>
      )}
    </div>
  );
}

function ReceiptLink({ path }: { path: string }) {
  const { data: url } = useQuery({
    queryKey: ["admin-receipt", path],
    queryFn: () => getPaymentReceiptUrl(path),
  });
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-primary hover:bg-secondary transition"
    >
      <FileText className="h-3.5 w-3.5" /> عرض إيصال التحويل
    </a>
  );
}

function AdminMessage({ m, buyerId }: { m: QuoteMessage; buyerId: string }) {
  const fromBuyer = m.sender_id === buyerId;
  return (
    <div className="rounded-xl border border-border bg-background p-2.5 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-muted-foreground">
          {fromBuyer ? "المشتري" : "المورّد"}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {new Date(m.created_at).toLocaleString("ar-SA", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      {m.body && <div className="mt-0.5 break-words">{m.body}</div>}
      {m.attachment_path && (
        <MessageAttachment path={m.attachment_path} name={m.attachment_name} type={m.attachment_type} />
      )}
    </div>
  );
}

function MessageAttachment({
  path,
  name,
  type,
}: {
  path: string;
  name: string | null;
  type: string | null;
}) {
  const { data: url } = useQuery({
    queryKey: ["admin-chat-att", path],
    queryFn: () => getChatAttachmentUrl(path),
  });
  if (!url) return null;
  if (type === "image")
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block mt-1">
        <img src={url} alt={name ?? "صورة"} className="max-h-40 rounded-lg" />
      </a>
    );
  if (type === "audio") return <audio src={url} controls className="mt-1 w-full h-9" />;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-primary"
    >
      <Paperclip className="h-3 w-3" /> {name ?? "مرفق"}
    </a>
  );
}
