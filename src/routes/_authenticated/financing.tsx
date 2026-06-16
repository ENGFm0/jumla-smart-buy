import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Landmark, Upload, FileText, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  createFinancingRequest,
  getMyFinancing,
  uploadFinancingDoc,
  FINANCING_STATUS_LABEL,
} from "@/lib/financing";
import { formatSAR } from "@/types";

export const Route = createFileRoute("/_authenticated/financing")({
  head: () => ({ meta: [{ title: "الشراء بالآجل — مدد" }] }),
  component: FinancingPage,
});

const inputCls = "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm";

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

  const [amount, setAmount] = useState("");
  const [term, setTerm] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [details, setDetails] = useState("");
  const [idDoc, setIdDoc] = useState<File | null>(null);
  const [crDoc, setCrDoc] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError("أدخل مبلغاً صحيحاً");
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
      });
      setAmount("");
      setTerm("");
      setBusinessName("");
      setIdNumber("");
      setCrNumber("");
      setDetails("");
      setIdDoc(null);
      setCrDoc(null);
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
          قدّم طلب تمويل ببياناتك ومستنداتك، ويراجعه فريقنا ويحدّد حدّك الائتماني، ثم يُوقّع سند
          لأمر ونشتري لك البضاعة.
        </p>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 text-sky-800 text-xs px-4 py-3 mb-5 flex gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
          بياناتك ومستنداتك محفوظة في مخزن خاص، ولا يطّلع عليها إلا فريق المراجعة.
        </div>

        {/* طلباتي السابقة */}
        {requests.length > 0 && (
          <section className="mb-6 space-y-2">
            <h2 className="font-bold">طلباتي ({requests.length})</h2>
            {requests.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="font-extrabold text-lg">{formatSAR(Number(r.amount))}</div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[r.status] ?? "bg-secondary"}`}
                  >
                    {FINANCING_STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {r.term_months ? `مدة ${r.term_months} شهر · ` : ""}
                  {fmt(r.created_at)}
                </div>
                {r.credit_limit != null && (
                  <div className="text-sm mt-1">
                    الحد الائتماني المعتمد:{" "}
                    <span className="font-bold text-emerald-700">
                      {formatSAR(Number(r.credit_limit))}
                    </span>
                  </div>
                )}
                {r.promissory_no && (
                  <div className="text-xs text-muted-foreground mt-1">
                    سند رقم: {r.promissory_no}
                  </div>
                )}
                {r.admin_note && (
                  <div className="text-sm mt-1 text-muted-foreground">
                    ملاحظة الإدارة: {r.admin_note}
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* نموذج طلب جديد */}
        <form onSubmit={submit} className="rounded-3xl bg-card border border-border p-5 space-y-3">
          <h2 className="font-bold">طلب تمويل جديد</h2>
          {done && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-2">
              تم إرسال طلبك، وسيتواصل معك فريق المراجعة.
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold mb-1">المبلغ المطلوب (ر.س)</label>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputCls}
                required
              />
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
            <label className="block text-sm font-bold mb-1">
              تفاصيل (البضاعة المطلوبة، ملاحظات)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <DocField label="صورة الهوية" file={idDoc} onChange={setIdDoc} />
            <DocField label="السجل التجاري" file={crDoc} onChange={setCrDoc} />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
              {error}
            </div>
          )}
          <button
            disabled={saving}
            className="w-full rounded-2xl bg-primary text-primary-foreground py-3 font-bold disabled:opacity-60"
          >
            {saving ? "جارٍ الإرسال…" : "إرسال طلب التمويل"}
          </button>
        </form>
      </main>
      <Footer />
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
