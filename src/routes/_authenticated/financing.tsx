import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Landmark,
  Upload,
  FileText,
  ShieldCheck,
  Plus,
  Trash2,
  ShoppingCart,
  Tag,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  createFinancingRequest,
  getMyFinancing,
  uploadFinancingDoc,
  financingItemsTotal,
  FINANCING_STATUS_LABEL,
  type FinancingItem,
} from "@/lib/financing";
import { useCart } from "@/lib/cart";
import { getMyQuoteRequests } from "@/lib/quotes";
import { formatSAR } from "@/types";

export const Route = createFileRoute("/_authenticated/financing")({
  head: () => ({ meta: [{ title: "الشراء بالآجل — مدد" }] }),
  component: FinancingPage,
});

const inputCls = "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm";
const STEPS = ["بياناتك", "المنتجات", "المراجعة والإرسال"];

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  signed: "bg-sky-100 text-sky-700",
  purchased: "bg-indigo-100 text-indigo-700",
  settled: "bg-slate-200 text-slate-600",
};

function fmt(d: string) {
  try {
    return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(d));
  } catch {
    return "";
  }
}

function FinancingPage() {
  const qc = useQueryClient();
  const { data: requests = [] } = useQuery({ queryKey: ["my-financing"], queryFn: getMyFinancing });
  const cart = useCart();
  const { data: myQuotes = [] } = useQuery({
    queryKey: ["my-quote-requests"],
    queryFn: getMyQuoteRequests,
  });
  const pricedQuotes = myQuotes.filter((q) => q.quoted_price != null);

  const [step, setStep] = useState(1);

  // بيانات
  const [businessName, setBusinessName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [term, setTerm] = useState("");
  const [details, setDetails] = useState("");
  const [idDoc, setIdDoc] = useState<File | null>(null);
  const [crDoc, setCrDoc] = useState<File | null>(null);

  // المنتجات
  const [items, setItems] = useState<FinancingItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [newQty, setNewQty] = useState("1");
  const itemsTotal = financingItemsTotal(items);

  // المراجعة
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function addItem(it: FinancingItem) {
    setItems((prev) => [...prev, it]);
  }
  function addManual() {
    if (!newItem.trim()) return;
    addItem({ name: newItem.trim(), quantity: Math.max(1, Number(newQty) || 1) });
    setNewItem("");
    setNewQty("1");
  }
  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, n) => n !== i));
  }

  function next() {
    setError(null);
    if (step === 2 && !amount && itemsTotal > 0) setAmount(String(itemsTotal));
    setStep((s) => Math.min(3, s + 1));
  }
  function back() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function submit() {
    setError(null);
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError("أدخل مبلغ التمويل المطلوب");
    setSaving(true);
    try {
      const idDocPath = idDoc ? await uploadFinancingDoc(idDoc, "id") : null;
      const crDocPath = crDoc ? await uploadFinancingDoc(crDoc, "cr") : null;
      await createFinancingRequest({
        amount: amt,
        termMonths: term ? Number(term) : null,
        idNumber,
        crNumber,
        businessName,
        details,
        idDocPath,
        crDocPath,
        items,
      });
      // إعادة تعيين
      setBusinessName("");
      setIdNumber("");
      setCrNumber("");
      setTerm("");
      setDetails("");
      setIdDoc(null);
      setCrDoc(null);
      setItems([]);
      setAmount("");
      setStep(1);
      setDone(true);
      qc.invalidateQueries({ queryKey: ["my-financing"] });
    } catch (err: any) {
      setError(err.message ?? "تعذّر إرسال الطلب");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1 max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
          <Landmark className="h-6 w-6" /> الشراء بالآجل عبر مدد
        </h1>
        <p className="text-sm text-muted-foreground mt-1 mb-5">
          عبّئ بياناتك، اختر المنتجات، ثم أرسل الطلب ليراجعه فريقنا.
        </p>

        {done && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-2 mb-4">
            تم إرسال طلبك، وسيتواصل معك فريق المراجعة. تابع حالته بالأسفل.
          </div>
        )}

        {/* مؤشّر الخطوات */}
        <div className="flex items-center gap-2 mb-5">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const passed = step > n;
            return (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`h-7 w-7 rounded-full grid place-items-center text-xs font-bold shrink-0 ${
                      passed
                        ? "bg-emerald-500 text-white"
                        : active
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {passed ? <CheckCircle2 className="h-4 w-4" /> : n}
                  </span>
                  <span
                    className={`text-xs font-bold truncate ${active ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
              </div>
            );
          })}
        </div>

        <div className="rounded-3xl bg-card border border-border p-5">
          {/* ١) البيانات */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-sky-200 bg-sky-50 text-sky-800 text-xs px-4 py-3 flex gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                بياناتك ومستنداتك محفوظة في مخزن خاص، ولا يطّلع عليها إلا فريق المراجعة.
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">اسم المنشأة</label>
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold mb-1">رقم الهوية</label>
                  <input
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">رقم السجل التجاري</label>
                  <input
                    value={crNumber}
                    onChange={(e) => setCrNumber(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">المدة (أشهر) — اختياري</label>
                <input
                  type="number"
                  min={1}
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <DocField label="صورة الهوية" file={idDoc} onChange={setIdDoc} />
                <DocField label="السجل التجاري" file={crDoc} onChange={setCrDoc} />
              </div>
            </div>
          )}

          {/* ٢) المنتجات */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                اختر صنفاً واحداً أو أكثر — من سلتك، من تسعيرات الموردين، أو أضفه يدوياً.
              </p>

              {/* من السلة */}
              {cart.length > 0 && (
                <div>
                  <div className="text-sm font-bold mb-1 flex items-center gap-1">
                    <ShoppingCart className="h-4 w-4" /> من سلتك
                  </div>
                  <div className="space-y-1">
                    {cart.map((c) => (
                      <PickRow
                        key={c.productId + c.supplierId}
                        title={`${c.productName} — ${c.supplierName}`}
                        sub={`الكمية ${c.quantity}${c.unit ? ` ${c.unit}` : ""}`}
                        price={c.price}
                        onAdd={() =>
                          addItem({
                            name: c.productName,
                            supplier: c.supplierName,
                            quantity: c.quantity,
                            unit: c.unit,
                            price: c.price ?? null,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* من التسعيرات */}
              {pricedQuotes.length > 0 && (
                <div>
                  <div className="text-sm font-bold mb-1 flex items-center gap-1">
                    <Tag className="h-4 w-4" /> من تسعيرات الموردين
                  </div>
                  <div className="space-y-1 max-h-44 overflow-y-auto">
                    {pricedQuotes.map((q) => (
                      <PickRow
                        key={q.id}
                        title={`${q.product?.name ?? q.custom_product} — ${q.supplier?.name}`}
                        sub={`الكمية ${q.quantity}`}
                        price={q.quoted_price != null ? Number(q.quoted_price) : null}
                        onAdd={() =>
                          addItem({
                            name: q.product?.name ?? q.custom_product ?? "منتج",
                            supplier: q.supplier?.name,
                            quantity: q.quantity,
                            unit: q.product?.unit,
                            price: q.quoted_price != null ? Number(q.quoted_price) : null,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* إضافة يدوية */}
              <div>
                <div className="text-sm font-bold mb-1">إضافة يدوية</div>
                <div className="flex gap-2">
                  <input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="اسم الصنف"
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    min={1}
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    className="w-20 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={addManual}
                    className="rounded-xl border border-primary text-primary px-3 py-2 text-sm font-bold hover:bg-brand-soft"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* المختارة */}
              <div className="rounded-2xl bg-secondary/40 p-3">
                <div className="text-sm font-bold mb-2">المنتجات المختارة ({items.length})</div>
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground">لم تختر أي صنف بعد.</p>
                ) : (
                  <div className="space-y-1.5">
                    {items.map((it, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-xl bg-card border border-border px-2.5 py-2 text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold truncate">{it.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {it.supplier ? `${it.supplier} · ` : ""}الكمية {it.quantity}
                            {it.price != null ? ` · ${formatSAR(Number(it.price))}` : ""}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          className="text-muted-foreground hover:text-rose-600 p-1"
                          aria-label="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {itemsTotal > 0 && (
                      <div className="text-sm font-bold pt-1">
                        إجمالي التسعيرات: {formatSAR(itemsTotal)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ٣) المراجعة والإرسال */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">مبلغ التمويل المطلوب (ر.س)</label>
                <input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={inputCls}
                />
                {itemsTotal > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(String(itemsTotal))}
                    className="text-xs font-bold text-primary hover:underline mt-1"
                  >
                    استخدم إجمالي التسعيرات ({formatSAR(itemsTotal)})
                  </button>
                )}
              </div>

              <div className="rounded-2xl border border-border p-3 text-sm space-y-1">
                <div className="font-bold mb-1">ملخّص الطلب</div>
                <Row k="المنشأة" v={businessName || "—"} />
                <Row k="الهوية" v={idNumber || "—"} />
                <Row k="السجل التجاري" v={crNumber || "—"} />
                <Row k="المدة" v={term ? `${term} شهر` : "—"} />
                <Row k="المستندات" v={`${idDoc ? "هوية ✓ " : ""}${crDoc ? "سجل ✓" : ""}` || "—"} />
                <Row k="عدد الأصناف" v={String(items.length)} />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">ملاحظات إضافية (اختياري)</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
              {error}
            </div>
          )}

          {/* تنقّل */}
          <div className="flex items-center justify-between gap-2 mt-5">
            <button
              type="button"
              onClick={back}
              disabled={step === 1}
              className="inline-flex items-center gap-1 rounded-2xl border border-border px-4 py-2.5 text-sm font-bold disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" /> السابق
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-1 rounded-2xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold"
              >
                التالي <ChevronLeft className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" /> {saving ? "جارٍ الإرسال…" : "إرسال الطلب"}
              </button>
            )}
          </div>
        </div>

        {/* طلباتي السابقة */}
        {requests.length > 0 && (
          <details className="mt-6 rounded-3xl bg-card border border-border p-5">
            <summary className="cursor-pointer font-bold">
              طلباتي السابقة ({requests.length})
            </summary>
            <div className="mt-3 space-y-2">
              {requests.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="font-extrabold text-lg">{formatSAR(Number(r.amount))}</div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[r.status] ?? "bg-secondary"}`}
                    >
                      {FINANCING_STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{fmt(r.created_at)}</div>
                  {r.credit_limit != null && (
                    <div className="text-sm mt-1">
                      الحد المعتمد:{" "}
                      <span className="font-bold text-emerald-700">
                        {formatSAR(Number(r.credit_limit))}
                      </span>
                    </div>
                  )}
                  {r.admin_note && (
                    <div className="text-sm mt-1 text-muted-foreground">
                      ملاحظة الإدارة: {r.admin_note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-bold">{v}</span>
    </div>
  );
}

function PickRow({
  title,
  sub,
  price,
  onAdd,
}: {
  title: string;
  sub: string;
  price?: number | null;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border px-2.5 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <div className="font-bold truncate">{title}</div>
        <div className="text-xs text-muted-foreground">
          {sub}
          {price != null ? ` · ${formatSAR(Number(price))}` : ""}
        </div>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="rounded-lg border border-primary text-primary px-2.5 py-1 text-xs font-bold hover:bg-brand-soft shrink-0"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function DocField({
  label,
  file,
  onChange,
}: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-bold mb-1">{label} (اختياري)</label>
      <label className="flex items-center gap-2 rounded-2xl border border-dashed border-border px-3 py-2.5 text-sm cursor-pointer hover:bg-secondary/40">
        {file ? <FileText className="h-4 w-4 text-primary" /> : <Upload className="h-4 w-4" />}
        <span className="truncate text-muted-foreground">{file ? file.name : "اختر ملفاً"}</span>
        <input
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  );
}
