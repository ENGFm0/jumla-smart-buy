import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Landmark, FileText } from "lucide-react";
import {
  getAllFinancing,
  updateFinancing,
  getFinancingDocUrl,
  FINANCING_STATUS_LABEL,
  type FinancingRequest,
  type FinancingStatus,
} from "@/lib/financing";
import { formatSAR } from "@/types";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  signed: "bg-sky-100 text-sky-700",
  purchased: "bg-indigo-100 text-indigo-700",
  settled: "bg-slate-200 text-slate-600",
};

function DocLink({ path, label }: { path: string; label: string }) {
  const { data: url } = useQuery({
    queryKey: ["financing-doc", path],
    queryFn: () => getFinancingDocUrl(path),
    staleTime: 50 * 60 * 1000,
  });
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-xl border border-border px-2.5 py-1.5 text-xs font-bold hover:bg-secondary"
    >
      <FileText className="h-3.5 w-3.5" /> {label}
    </a>
  );
}

export function FinancingAdmin() {
  const qc = useQueryClient();
  const { data: requests = [] } = useQuery({
    queryKey: ["admin-financing"],
    queryFn: getAllFinancing,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-financing"] });

  async function update(id: string, input: Parameters<typeof updateFinancing>[1]) {
    await updateFinancing(id, input);
    refresh();
  }

  function approve(r: FinancingRequest) {
    const v = window.prompt("الحد الائتماني المعتمد (ر.س):", String(r.amount));
    if (v === null) return;
    update(r.id, { status: "approved", creditLimit: Number(v) || Number(r.amount) });
  }
  function reject(r: FinancingRequest) {
    const note = window.prompt("سبب الرفض (اختياري):", "");
    if (note === null) return;
    update(r.id, { status: "rejected", adminNote: note });
  }
  function sign(r: FinancingRequest) {
    const no = window.prompt("رقم السند لأمر:", r.promissory_no ?? "");
    if (no === null) return;
    update(r.id, { status: "signed", promissoryNo: no });
  }

  const pending = requests.filter((r) => r.status === "pending").length;

  return (
    <section className="rounded-3xl bg-card border border-border p-6 mb-6">
      <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
        <Landmark className="h-5 w-5" /> طلبات الشراء بالآجل ({requests.length})
        {pending > 0 && (
          <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[11px] font-bold">
            {pending} بانتظار المراجعة
          </span>
        )}
      </h2>

      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border p-4">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <div className="font-extrabold text-lg">{formatSAR(Number(r.amount))}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {r.business_name ?? "—"}
                  {r.term_months ? ` · ${r.term_months} شهر` : ""}
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[r.status] ?? "bg-secondary"}`}
              >
                {FINANCING_STATUS_LABEL[r.status] ?? r.status}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
              {r.id_number && <div>الهوية: {r.id_number}</div>}
              {r.cr_number && <div>السجل التجاري: {r.cr_number}</div>}
              {r.credit_limit != null && (
                <div>الحد المعتمد: {formatSAR(Number(r.credit_limit))}</div>
              )}
              {r.promissory_no && <div>سند: {r.promissory_no}</div>}
            </div>
            {r.details && <div className="text-sm mt-2">{r.details}</div>}

            <div className="flex flex-wrap items-center gap-2 mt-3">
              {r.id_doc_path && <DocLink path={r.id_doc_path} label="الهوية" />}
              {r.cr_doc_path && <DocLink path={r.cr_doc_path} label="السجل التجاري" />}

              {r.status === "pending" && (
                <>
                  <button
                    onClick={() => approve(r)}
                    className="rounded-xl bg-primary text-primary-foreground px-3 py-1.5 text-xs font-bold"
                  >
                    اعتماد + تحديد الحد
                  </button>
                  <button
                    onClick={() => reject(r)}
                    className="rounded-xl border border-rose-200 text-rose-700 px-3 py-1.5 text-xs font-bold hover:bg-rose-50"
                  >
                    رفض
                  </button>
                </>
              )}
              {r.status === "approved" && (
                <button
                  onClick={() => sign(r)}
                  className="rounded-xl bg-primary text-primary-foreground px-3 py-1.5 text-xs font-bold"
                >
                  تأكيد توقيع السند
                </button>
              )}
              {r.status === "signed" && (
                <button
                  onClick={() => update(r.id, { status: "purchased" as FinancingStatus })}
                  className="rounded-xl bg-primary text-primary-foreground px-3 py-1.5 text-xs font-bold"
                >
                  تم شراء البضاعة
                </button>
              )}
              {r.status === "purchased" && (
                <button
                  onClick={() => update(r.id, { status: "settled" as FinancingStatus })}
                  className="rounded-xl bg-emerald-600 text-white px-3 py-1.5 text-xs font-bold"
                >
                  تم السداد/الإغلاق
                </button>
              )}
            </div>
          </div>
        ))}
        {requests.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-6">لا توجد طلبات تمويل.</div>
        )}
      </div>
    </section>
  );
}
