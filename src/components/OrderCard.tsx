import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Star,
  Truck,
  CreditCard,
  CheckCircle2,
  MessageCircle,
  Phone,
  RotateCcw,
  Copy,
  Check,
  Landmark,
  Upload,
  FileText,
} from "lucide-react";
import { respondToQuote, createQuoteRequest, createProductRequest } from "@/lib/quotes";
import { createTapCharge } from "@/lib/api/tap.functions";
import { getSupplierById } from "@/lib/suppliers";
import {
  acceptOffer,
  markShipped,
  markDelivered,
  cancelOrder,
  rateOrder,
  uploadPaymentReceipt,
  submitPaymentTransfer,
  confirmPaymentReceived,
  getPaymentReceiptUrl,
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

      {/* حالة الدفع عبر التحويل البنكي (تظهر للطرفين بعد التحويل) */}
      {order.paid_at && order.payment_method === "bank_transfer" && (
        <div className="mt-4">
          <PaymentStatus order={order} role={role} onChange={onChange} />
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
    return <PaymentTransfer order={order} onChange={onChange} />;
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
      <p className="sm:col-span-2 text-xs text-muted-foreground -mb-1">
        أدخل السعر <span className="font-bold">شاملاً ضريبة القيمة المضافة (15%)</span> — لن تُضاف
        مرة أخرى.
      </p>
      <input
        type="number"
        step="0.01"
        min="0"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="السعر للوحدة شامل الضريبة (ر.س)"
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

// المشتري: تحويل بنكي مباشر لآيبان المورّد + رفع الإيصال
function PaymentTransfer({
  order,
  onChange,
}: {
  order: QuoteRequestDetailed;
  onChange: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bank, setBank] = useState<{
    iban: string | null;
    bank_name: string | null;
    account_holder: string | null;
  } | null>(null);

  const total = Number(order.quoted_price ?? 0) * order.quantity;
  const iban = bank?.iban ?? null;

  // بيانات الحساب البنكي للمورّد تُجلب عند الحاجة (لخيار التحويل البنكي البديل)
  useEffect(() => {
    let alive = true;
    getSupplierById(order.supplier_id)
      .then((s) => {
        if (!alive || !s) return;
        setBank({
          iban: s.iban ?? null,
          bank_name: s.bank_name ?? null,
          account_holder: s.account_holder ?? null,
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [order.supplier_id]);

  async function copyIban() {
    if (!iban) return;
    try {
      await navigator.clipboard.writeText(iban);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* تجاهل */
    }
  }

  async function submit() {
    if (!file) {
      setError("أرفق صورة إيصال التحويل أولاً");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const path = await uploadPaymentReceipt(order.id, file, file.name);
      await submitPaymentTransfer(order.id, path);
      onChange();
    } catch (e: any) {
      setError(e.message ?? "تعذّر إرسال الإيصال");
    } finally {
      setBusy(false);
    }
  }

  async function payOnline() {
    setBusy(true);
    setError(null);
    try {
      const { url } = await createTapCharge({
        data: { orderId: order.id, origin: window.location.origin },
      });
      window.location.href = url;
    } catch (e: any) {
      setError(e.message ?? "تعذّر بدء عملية الدفع");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* الدفع الإلكتروني عبر بوّابة Tap (مدى / Apple Pay / بطاقات) */}
      <div className="rounded-2xl border border-border p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold inline-flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" /> الدفع الإلكتروني
          </span>
          <span className="font-extrabold text-primary tabular-nums">{formatSAR(total)}</span>
        </div>
        <button
          onClick={payOnline}
          disabled={busy}
          className="w-full rounded-2xl bg-primary text-primary-foreground py-2.5 font-bold text-sm disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          <CreditCard className="h-4 w-4" />
          {busy ? "جارٍ التحويل لصفحة الدفع…" : "ادفع بمدى / Apple Pay / بطاقة"}
        </button>
        <p className="text-[11px] text-muted-foreground">دفع آمن عبر بوّابة Tap.</p>
      </div>

      {/* بديل: تحويل بنكي مباشر لآيبان المورّد + رفع الإيصال */}
      {iban && (
        <details className="rounded-2xl border border-border p-4">
          <summary className="text-sm font-bold cursor-pointer inline-flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary" /> أو حوّل بنكياً وارفع الإيصال
          </summary>
          <div className="mt-3 space-y-3">
            <div className="rounded-xl bg-secondary/40 p-3 text-sm space-y-1.5">
              {bank?.account_holder && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">اسم صاحب الحساب</span>
                  <span className="font-bold">{bank.account_holder}</span>
                </div>
              )}
              {bank?.bank_name && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">البنك</span>
                  <span className="font-bold">{bank.bank_name}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">الآيبان</span>
                <button
                  type="button"
                  onClick={copyIban}
                  className="inline-flex items-center gap-1 font-bold tabular-nums text-primary"
                  title="نسخ الآيبان"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span dir="ltr">{iban}</span>
                </button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              حوّل المبلغ ({formatSAR(total)}) للآيبان أعلاه ثم ارفع صورة الإيصال؛ يؤكّد المورّد
              الاستلام ويشحن.
            </p>
            <label className="flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2.5 text-sm cursor-pointer hover:bg-secondary/40">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{file ? file.name : "اختر صورة/ملف إيصال التحويل"}</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <button
              onClick={submit}
              disabled={busy || !file}
              className="w-full rounded-2xl border border-primary text-primary py-2.5 font-bold text-sm disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              <Landmark className="h-4 w-4" /> {busy ? "جارٍ الإرسال…" : "أكّدت التحويل وأرفقت الإيصال"}
            </button>
          </div>
        </details>
      )}

      {error && <p className="text-sm text-rose-700">{error}</p>}
    </div>
  );
}

// عرض حالة الدفع + الإيصال (للطرفين) + زر تأكيد الاستلام للمورّد
function PaymentStatus({
  order,
  role,
  onChange,
}: {
  order: QuoteRequestDetailed;
  role: Role;
  onChange: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const confirmed = !!order.payment_confirmed_at;

  useEffect(() => {
    let alive = true;
    if (order.payment_receipt_path) {
      getPaymentReceiptUrl(order.payment_receipt_path).then((u) => {
        if (alive) setUrl(u);
      });
    }
    return () => {
      alive = false;
    };
  }, [order.payment_receipt_path]);

  async function confirm() {
    setBusy(true);
    try {
      await confirmPaymentReceived(order.id);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`rounded-2xl border p-4 text-sm ${confirmed ? "border-emerald-200 bg-emerald-50" : "border-sky-200 bg-sky-50"}`}
    >
      <div
        className={`font-bold flex items-center gap-2 ${confirmed ? "text-emerald-800" : "text-sky-800"}`}
      >
        <Landmark className="h-4 w-4" />
        {confirmed ? "تم تأكيد استلام المبلغ" : "تم التحويل — بانتظار تأكيد المورّد"}
      </div>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 mt-2 font-bold text-primary hover:underline"
        >
          <FileText className="h-3.5 w-3.5" /> عرض إيصال التحويل
        </a>
      )}
      {role === "supplier" && !confirmed && (
        <button
          onClick={confirm}
          disabled={busy}
          className="mt-3 block w-full rounded-2xl bg-emerald-600 text-white py-2.5 font-bold disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4" /> {busy ? "..." : "تأكيد استلام المبلغ"}
        </button>
      )}
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
