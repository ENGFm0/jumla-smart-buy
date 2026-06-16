import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
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
import { getProductsWithStats } from "@/lib/products";
import { formatSAR } from "@/types";

export const Route = createFileRoute("/_authenticated/financing")({
  head: () => ({ meta: [{ title: "الشراء بالآجل — مدد" }] }),
  component: FinancingPage,
});

const inputCls = "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm";
const STEPS = ["بياناتك", "المنتجات", "المراجعة والإرسال"];
const DRAFT_KEY = "madad_financing_draft";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  signed: "bg-sky-100 text-sky-700",
  purchased: "bg-indigo-100 text-indigo-700",
  settled: "bg-slate-200 text-slate-600",
};

type Draft = {
  step: number;
  businessName: string;
  idNumber: string;
  crNumber: string;
  term: string;
  details: string;
  amount: string;
  items: FinancingItem[];
  idDocPath: string | null;
  crDocPath: string | null;
};

const emptyDraft: Draft = {
  step: 1,
  businessName: "",
  idNumber: "",
  crNumber: "",
  term: "",
  details: "",
  amount: "",
  items: [],
  idDocPath: null,
  crDocPath: null,
};

function loadDraft(): Draft {
  if (typeof localStorage === "undefined") return emptyDraft;
  try {
    return { ...emptyDraft, ...JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}") };
  } catch {
    return emptyDraft;
  }
}

function fmt(d: string) {
  try {
    return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(d));
  } catch {
    return "";
  }
}

const isId = (v: string) => /^\d{10}$/.test(v.trim());

function FinancingPage() {
  const qc = useQueryClient();
  const { data: requests = [] } = useQuery({ queryKey: ["my-financing"], queryFn: getMyFinancing });
  const cart = useCart();
  const { data: myQuotes = [] } = useQuery({
    queryKey: ["my-quote-requests"],
    queryFn: getMyQuoteRequests,
  });
  const pricedQuotes = myQuotes.filter((q) => q.quoted_price != null);

  const initial = loadDraft();
  const [step, setStep] = useState(initial.step);
  const [businessName, setBusinessName] = useState(initial.businessName);
  const [idNumber, setIdNumber] = useState(initial.idNumber);
  const [crNumber, setCrNumber] = useState(initial.crNumber);
  const [term, setTerm] = useState(initial.term);
  const [details, setDetails] = useState(initial.details);
  const [amount, setAmount] = useState(initial.amount);
  const [items, setItems] = useState<FinancingItem[]>(initial.items);
  const [idDocPath, setIdDocPath] = useState<string | null>(initial.idDocPath);
  const [crDocPath, setCrDocPath] = useState<string | null>(initial.crDocPath);

  const [source, setSource] = useState<"offers" | "cart" | "search" | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const { data: searchResults = [], isFetching: searching } = useQuery({
    queryKey: ["financing-product-search", searchQ],
    queryFn: () => getProductsWithStats({ search: searchQ.trim() }),
    enabled: source === "search" && searchQ.trim().length >= 2,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [done, setDone] = useState(false);

  const itemsTotal = financingItemsTotal(items);

  // حفظ المسودة محلياً (لتفادي فقدان البيانات عند الذهاب للبحث)
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    const draft: Draft = {
      step,
      businessName,
      idNumber,
      crNumber,
      term,
      details,
      amount,
      items,
      idDocPath,
      crDocPath,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [step, businessName, idNumber, crNumber, term, details, amount, items, idDocPath, crDocPath]);

  const step1Valid =
    businessName.trim().length > 1 &&
    isId(idNumber) &&
    isId(crNumber) &&
    !!idDocPath &&
    !!crDocPath;

  function addItem(it: FinancingItem) {
    setItems((prev) => [...prev, it]);
  }
  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, n) => n !== i));
  }

  function next() {
    setError(null);
    if (step === 1 && !step1Valid) {
      setShowErrors(true);
      return;
    }
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
      localStorage.removeItem(DRAFT_KEY);
      setBusinessName("");
      setIdNumber("");
      setCrNumber("");
      setTerm("");
      setDetails("");
      setItems([]);
      setAmount("");
      setIdDocPath(null);
      setCrDocPath(null);
      setStep(1);
      setShowErrors(false);
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
              <Field
                label="اسم المنشأة"
                error={showErrors && businessName.trim().length < 2 ? "مطلوب" : null}
              >
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="رقم الهوية" error={showErrors && !isId(idNumber) ? "١٠ أرقام" : null}>
                  <input
                    inputMode="numeric"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className={inputCls}
                    placeholder="10 أرقام"
                  />
                </Field>
                <Field
                  label="رقم السجل التجاري"
                  error={showErrors && !isId(crNumber) ? "١٠ أرقام" : null}
                >
                  <input
                    inputMode="numeric"
                    value={crNumber}
                    onChange={(e) => setCrNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className={inputCls}
                    placeholder="10 أرقام"
                  />
                </Field>
              </div>
              <Field label="المدة (أشهر) — اختياري" error={null}>
                <input
                  type="number"
                  min={1}
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-3">
                <DocUpload
                  label="صورة الهوية"
                  kind="id"
                  path={idDocPath}
                  onUploaded={setIdDocPath}
                  error={showErrors && !idDocPath ? "مطلوب" : null}
                />
                <DocUpload
                  label="السجل التجاري"
                  kind="cr"
                  path={crDocPath}
                  onUploaded={setCrDocPath}
                  error={showErrors && !crDocPath ? "مطلوب" : null}
                />
              </div>
              {showErrors && !step1Valid && (
                <div className="text-xs text-rose-600 font-bold">
                  أكمل كل الحقول المطلوبة ببيانات صحيحة للمتابعة.
                </div>
              )}
            </div>
          )}

          {/* ٢) المنتجات */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                اختر مصدر الأصناف، ثم اختر صنفاً واحداً أو أكثر:
              </p>

              {/* مصادر الأصناف جنب بعض */}
              <div className="grid grid-cols-3 gap-2">
                <SourceChip
                  icon={Tag}
                  label="العروض"
                  active={source === "offers"}
                  disabled={pricedQuotes.length === 0}
                  onClick={() => setSource((s) => (s === "offers" ? null : "offers"))}
                />
                <SourceChip
                  icon={ShoppingCart}
                  label="السلة"
                  active={source === "cart"}
                  disabled={cart.length === 0}
                  onClick={() => setSource((s) => (s === "cart" ? null : "cart"))}
                />
                <SourceChip
                  icon={Search}
                  label="بحث المنتجات"
                  active={source === "search"}
                  onClick={() => setSource((s) => (s === "search" ? null : "search"))}
                />
              </div>

              {/* محتوى المصدر المختار */}
              {source === "offers" && (
                <div className="space-y-1 max-h-56 overflow-y-auto">
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
              )}
              {source === "cart" && (
                <div className="space-y-1 max-h-56 overflow-y-auto">
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
              )}
              {source === "search" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                      value={searchQ}
                      onChange={(e) => setSearchQ(e.target.value)}
                      placeholder="ابحث عن منتج لإضافته…"
                      className="flex-1 bg-transparent outline-none text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1 max-h-56 overflow-y-auto">
                    {searchQ.trim().length < 2 ? (
                      <p className="text-xs text-muted-foreground py-2">
                        اكتب حرفين على الأقل للبحث.
                      </p>
                    ) : searching ? (
                      <p className="text-xs text-muted-foreground py-2">جارٍ البحث…</p>
                    ) : searchResults.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">لا نتائج مطابقة.</p>
                    ) : (
                      searchResults.map((p) => (
                        <PickRow
                          key={p.id}
                          title={p.name}
                          sub={
                            p.stats
                              ? `${p.stats.offers_count} عرض · يبدأ من ${formatSAR(Number(p.stats.min_price))}`
                              : (p.unit ?? "")
                          }
                          price={p.stats ? Number(p.stats.min_price) : null}
                          onAdd={() =>
                            addItem({
                              name: p.name,
                              supplier: p.cheapest_supplier?.name ?? null,
                              quantity: 1,
                              unit: p.unit,
                              price: p.stats ? Number(p.stats.min_price) : null,
                            })
                          }
                        />
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* المختارة */}
              <div className="rounded-2xl bg-secondary/40 p-3">
                <div className="text-sm font-bold mb-2">المنتجات المختارة ({items.length})</div>
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    لم تختر أي صنف بعد — اختر من العروض أو السلة، أو أضف عبر البحث.
                  </p>
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
              <Field label="مبلغ التمويل المطلوب (ر.س)" error={null}>
                <input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={inputCls}
                />
              </Field>
              {itemsTotal > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(itemsTotal))}
                  className="text-xs font-bold text-primary hover:underline -mt-2"
                >
                  استخدم إجمالي التسعيرات ({formatSAR(itemsTotal)})
                </button>
              )}

              <div className="rounded-2xl border border-border p-3 text-sm space-y-1">
                <div className="font-bold mb-1">ملخّص الطلب</div>
                <Row k="المنشأة" v={businessName || "—"} />
                <Row k="الهوية" v={idNumber || "—"} />
                <Row k="السجل التجاري" v={crNumber || "—"} />
                <Row k="المدة" v={term ? `${term} شهر` : "—"} />
                <Row
                  k="المستندات"
                  v={`${idDocPath ? "هوية ✓ " : ""}${crDocPath ? "سجل ✓" : "—"}`}
                />
                <Row k="عدد الأصناف" v={String(items.length)} />
              </div>

              <Field label="ملاحظات إضافية (اختياري)" error={null}>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </Field>
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
              {error}
            </div>
          )}

          {/* تنقّل */}
          <div className="flex items-center justify-between gap-2 mt-5">
            {step > 1 ? (
              <button
                type="button"
                onClick={back}
                className="inline-flex items-center gap-1 rounded-2xl border border-border px-4 py-2.5 text-sm font-bold"
              >
                <ChevronRight className="h-4 w-4" /> السابق
              </button>
            ) : (
              <span />
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={next}
                disabled={step === 1 && !step1Valid}
                className="inline-flex items-center gap-1 rounded-2xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold disabled:opacity-50"
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

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-bold mb-1">
        {label}
        {error && <span className="text-rose-600 mr-2 text-xs">({error})</span>}
      </label>
      {children}
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

function SourceChip({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: typeof Tag;
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-3 text-xs font-bold transition disabled:opacity-40 ${
        active ? "border-primary bg-brand-soft text-primary" : "border-border hover:bg-secondary"
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
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

function DocUpload({
  label,
  kind,
  path,
  onUploaded,
  error,
}: {
  label: string;
  kind: "id" | "cr";
  path: string | null;
  onUploaded: (p: string | null) => void;
  error: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadErr(null);
    if (file.size > 10 * 1024 * 1024) {
      setUploadErr("الملف كبير جداً (الحد 10MB)");
      return;
    }
    setBusy(true);
    try {
      const p = await uploadFinancingDoc(file, kind);
      onUploaded(p);
    } catch (err: any) {
      const msg = err?.message ?? "تعذّر الرفع";
      setUploadErr(
        /bucket/i.test(msg) ? "مخزن المستندات غير مُهيّأ بعد (طبّق migration التمويل)" : msg,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <label className="block text-sm font-bold mb-1">
        {label}
        {error && <span className="text-rose-600 mr-2 text-xs">({error})</span>}
      </label>
      <label
        className={`flex items-center gap-2 rounded-2xl border border-dashed px-3 py-2.5 text-sm cursor-pointer hover:bg-secondary/40 ${
          path ? "border-emerald-300 bg-emerald-50" : "border-border"
        }`}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : path ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        <span className="truncate text-muted-foreground">
          {busy ? "جارٍ الرفع…" : path ? "تم الرفع ✓ (اضغط للتغيير)" : "اختر ملفاً"}
        </span>
        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={pick} />
      </label>
      {uploadErr && <div className="text-xs text-rose-600 font-bold mt-1">{uploadErr}</div>}
    </div>
  );
}
