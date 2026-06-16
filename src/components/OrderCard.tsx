import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Star,
  Truck,
  CreditCard,
  CheckCircle2,
  MessageCircle,
  Phone,
  RotateCcw,
} from "lucide-react";
import { respondToQuote, createQuoteRequest, createProductRequest } from "@/lib/quotes";
import {
  acceptOffer,
  markPaid,
  markShipped,
  markDelivered,
  cancelOrder,
  rateOrder,
} from "@/lib/orders";
import { OrderTracker } from "@/components/OrderTracker";
import { OrderTimeline } from "@/components/OrderTimeline";
import { OrderInvoice } from "@/components/OrderInvoice";
import {
  formatSAR,
  QUOTE_STATUS_LABEL,
  type QuoteRequestDetailed,
  type QuoteStatus,
} from "@/types";

const STATUS_STYLE: Record<QuoteStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  quoted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  closed: "bg-slate-200 text-slate-600",
};

type Role = "buyer" | "supplier";

export function OrderCard({
  order,
  role,
  onChange,
}: {
  order: QuoteRequestDetailed;
  role: Role;
  onChange: () => void;
}) {
  const offerExists = order.status === "quoted" || order.quoted_price != null;
  const active = order.status !== "rejected" && !order.cancelled_at;

  return (
    <div className="rounded-3xl bg-card border border-border p-5">
      {/* الترويسة */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-bold">
            {order.product?.name ?? order.custom_product ?? "منتج"}
            {!order.product && order.custom_product && (
              <span className="mr-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground align-middle">
                طلب خاص
              </span>
            )}
          </h3>
          {role === "buyer" ? (
            <>
              <p className="text-sm text-muted-foreground mt-1">
                المورّد:{" "}
                {order.supplier?.id ? (
                  <Link
                    to="/supplier/$id"
                    params={{ id: order.supplier.id }}
                    className="font-bold text-primary hover:underline"
                  >
                    {order.supplier?.name ?? "—"}
                  </Link>
                ) : (
                  (order.supplier?.name ?? "—")
                )}
                {order.supplier?.city ? ` — ${order.supplier.city}` : ""}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                الكمية: <span className="font-bold text-foreground">{order.quantity}</span>
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">الكمية المطلوبة: {order.quantity}</p>
          )}
          {order.note && <p className="text-sm text-muted-foreground mt-1">ملاحظة: {order.note}</p>}
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[order.status]}`}>
          {QUOTE_STATUS_LABEL[order.status]}
        </span>
      </div>

      {/* المتتبّع المرئي */}
      <div className="mt-5">
        <OrderTracker order={order} />
      </div>

      {/* سجل العمليات بالتواريخ */}
      <details className="mt-4 rounded-2xl border border-border bg-secondary/30 px-4 py-3">
        <summary className="cursor-pointer text-sm font-bold text-muted-foreground">
          سجل العمليات والتواريخ
        </summary>
        <div className="mt-3">
          <OrderTimeline order={order} />
        </div>
      </details>

      {/* العرض/السعر */}
      {offerExists && order.quoted_price != null && (
        <div className="mt-4 rounded-2xl bg-brand-soft/50 border border-border p-4">
          <div className="font-extrabold text-primary text-lg">
            السعر المقترح: {formatSAR(Number(order.quoted_price))} / الوحدة
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">
            الإجمالي للكمية ({order.quantity}):{" "}
            <span className="font-bold text-foreground">
              {formatSAR(Number(order.quoted_price) * order.quantity)}
            </span>
          </div>
          {order.supplier_reply && (
            <p className="text-sm text-muted-foreground mt-1">رد المورّد: {order.supplier_reply}</p>
          )}
        </div>
      )}

      {/* تفاصيل الشحن (تظهر للطرفين بعد الشحن) */}
      {order.shipped_at && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <div className="font-bold text-emerald-800 flex items-center gap-2">
            <Truck className="h-4 w-4" /> تم شحن الطلب
          </div>
          {order.shipping_info && <p className="text-emerald-900/80 mt-1">{order.shipping_info}</p>}
          {order.courier_phone && (
            <a
              href={`tel:${order.courier_phone}`}
              className="inline-flex items-center gap-1 mt-1 font-bold text-emerald-700"
            >
              <Phone className="h-3.5 w-3.5" /> المندوب: {order.courier_phone}
            </a>
          )}
        </div>
      )}

      {/* الإجراءات حسب الدور والمرحلة */}
      {active && (
        <div className="mt-4">
          <OrderActions order={order} role={role} onChange={onChange} />
        </div>
      )}

      {/* الفاتورة بعد الدفع */}
      {order.paid_at && (
        <div className="mt-4">
          <OrderInvoice order={order} />
        </div>
      )}

      {/* المحادثة في صفحة مستقلة + إعادة الطلب */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {offerExists && (
          <Link
            to="/chat/$id"
            params={{ id: order.id }}
            className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2.5 text-sm font-bold text-primary hover:bg-secondary transition"
          >
            <MessageCircle className="h-4 w-4" /> فتح المحادثة
          </Link>
        )}
        {role === "buyer" &&
          (order.delivered_at || order.status === "rejected" || order.cancelled_at) && (
            <ReorderButton order={order} onChange={onChange} />
          )}
      </div>
    </div>
  );
}

function ReorderButton({ order, onChange }: { order: QuoteRequestDetailed; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function reorder() {
    setBusy(true);
    try {
      if (order.product_id) {
        await createQuoteRequest({
          productId: order.product_id,
          supplierId: order.supplier_id,
          quantity: order.quantity,
        });
      } else {
        await createProductRequest({
          customProduct: order.custom_product ?? "منتج",
          quantity: order.quantity,
          supplierIds: [order.supplier_id],
        });
      }
      setDone(true);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  if (done)
    return <span className="text-sm font-bold text-emerald-600">تم إرسال الطلب من جديد ✓</span>;

  return (
    <button
      onClick={reorder}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-2xl border border-primary text-primary px-4 py-2.5 text-sm font-bold hover:bg-brand-soft transition disabled:opacity-60"
    >
      <RotateCcw className="h-4 w-4" /> {busy ? "..." : "اطلب مرة ثانية"}
    </button>
  );
}

// ---------------------------------------------------------------------
// أزرار/نماذج الإجراءات حسب الدور والمرحلة الحالية
// ---------------------------------------------------------------------
function OrderActions({
  order,
  role,
  onChange,
}: {
  order: QuoteRequestDetailed;
  role: Role;
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
      onChange();
    } finally {
      setBusy(false);
    }
  }

  // ---- المورّد ----
  if (role === "supplier") {
    if (order.status === "pending") return <SupplierPriceForm order={order} onChange={onChange} />;
    if (order.paid_at && !order.shipped_at)
      return <ShippingForm order={order} onChange={onChange} />;
    if (order.delivered_at && order.supplier_rating == null)
      return (
        <RatingForm
          label="قيّم تعاملك مع المشتري"
          onSubmit={(r, c) => rateOrder(order.id, "supplier", r, c)}
          onChange={onChange}
        />
      );
    if (order.supplier_rating != null)
      return <RatedNote rating={order.supplier_rating} who="تقييمك للمشتري" />;
    return null;
  }

  // ---- المشتري ----
  if (order.status === "quoted" && !order.accepted_at) {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          disabled={busy}
          onClick={() => run(() => acceptOffer(order.id))}
          className="rounded-2xl bg-primary text-primary-foreground px-5 py-2.5 font-bold text-sm disabled:opacity-60 inline-flex items-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4" /> قبول العرض
        </button>
        <button
          disabled={busy}
          onClick={() => run(() => cancelOrder(order.id))}
          className="rounded-2xl border border-rose-200 text-rose-700 px-5 py-2.5 font-bold text-sm hover:bg-rose-50 disabled:opacity-60"
        >
          إلغاء الطلب
        </button>
      </div>
    );
  }
  if (order.accepted_at && !order.paid_at) {
    return (
      <button
        disabled={busy}
        onClick={() => run(() => markPaid(order.id))}
        className="rounded-2xl bg-primary text-primary-foreground px-5 py-2.5 font-bold text-sm disabled:opacity-60 inline-flex items-center gap-2"
      >
        <CreditCard className="h-4 w-4" /> تأكيد الدفع
      </button>
    );
  }
  if (order.shipped_at && !order.delivered_at) {
    return (
      <button
        disabled={busy}
        onClick={() => run(() => markDelivered(order.id))}
        className="rounded-2xl bg-emerald-600 text-white px-5 py-2.5 font-bold text-sm disabled:opacity-60 inline-flex items-center gap-2"
      >
        <CheckCircle2 className="h-4 w-4" /> تم التوصيل
      </button>
    );
  }
  if (order.delivered_at && order.buyer_rating == null) {
    return (
      <RatingForm
        label="قيّم تعاملك مع المورّد"
        onSubmit={(r, c) => rateOrder(order.id, "buyer", r, c)}
        onChange={onChange}
      />
    );
  }
  if (order.buyer_rating != null)
    return <RatedNote rating={order.buyer_rating} who="تقييمك للمورّد" />;
  return null;
}

function SupplierPriceForm({
  order,
  onChange,
}: {
  order: QuoteRequestDetailed;
  onChange: () => void;
}) {
  const [price, setPrice] = useState(order.quoted_price != null ? String(order.quoted_price) : "");
  const [reply, setReply] = useState(order.supplier_reply ?? "");
  const [saving, setSaving] = useState(false);

  async function respond(status: QuoteStatus) {
    setSaving(true);
    try {
      await respondToQuote(order.id, {
        quotedPrice: status === "quoted" ? Number(price) || null : null,
        reply: reply.trim() || null,
        status,
      });
      onChange();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid sm:grid-cols-2 gap-2">
      <input
        type="number"
        step="0.01"
        min="0"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="السعر المقترح للوحدة (ر.س)"
        className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
      />
      <input
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="رد مختصر (اختياري)"
        className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
      />
      <button
        onClick={() => respond("quoted")}
        disabled={saving || !price}
        className="rounded-2xl bg-primary text-primary-foreground py-2.5 font-bold text-sm disabled:opacity-60"
      >
        إرسال التسعير
      </button>
      <button
        onClick={() => respond("rejected")}
        disabled={saving}
        className="rounded-2xl border border-rose-200 text-rose-700 py-2.5 font-bold text-sm hover:bg-rose-50 disabled:opacity-60"
      >
        رفض الطلب
      </button>
    </div>
  );
}

function ShippingForm({ order, onChange }: { order: QuoteRequestDetailed; onChange: () => void }) {
  const [info, setInfo] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await markShipped(order.id, { shippingInfo: info, courierPhone: phone });
      onChange();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border p-4 space-y-2">
      <div className="text-sm font-bold flex items-center gap-2">
        <Truck className="h-4 w-4 text-primary" /> تأكيد الشحن
      </div>
      <input
        value={info}
        onChange={(e) => setInfo(e.target.value)}
        placeholder="تفاصيل الشحن (شركة الشحن / رقم التتبّع / الموعد المتوقّع)"
        className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="رقم المندوب"
        className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
      />
      <button
        onClick={submit}
        disabled={saving}
        className="w-full rounded-2xl bg-primary text-primary-foreground py-2.5 font-bold text-sm disabled:opacity-60"
      >
        {saving ? "..." : "تأكيد الشحن"}
      </button>
    </div>
  );
}

function RatingForm({
  label,
  onSubmit,
  onChange,
}: {
  label: string;
  onSubmit: (rating: number, comment?: string) => Promise<void>;
  onChange: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!rating) return;
    setSaving(true);
    try {
      await onSubmit(rating, comment);
      onChange();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border p-4 space-y-2">
      <div className="text-sm font-bold">{label}</div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} نجوم`}>
            <Star
              className={`h-7 w-7 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
            />
          </button>
        ))}
      </div>
      <input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="تعليق (اختياري)"
        className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
      />
      <button
        onClick={submit}
        disabled={saving || !rating}
        className="rounded-2xl bg-primary text-primary-foreground px-5 py-2.5 font-bold text-sm disabled:opacity-60"
      >
        إرسال التقييم
      </button>
    </div>
  );
}

function RatedNote({ rating, who }: { rating: number; who: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-2 text-sm font-bold text-amber-800">
      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
      {who}: {rating}/5
    </div>
  );
}
