import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Landmark, Power, Settings } from "lucide-react";
import { getFinancingEnabled, setFinancingEnabled } from "@/lib/settings";

// إعدادات المنصّة للأدمن: تفعيل/إيقاف الخدمات (مثل البيع بالآجل)
export function PlatformSettings() {
  const qc = useQueryClient();
  const { data: enabled = true } = useQuery({
    queryKey: ["financing-enabled"],
    queryFn: getFinancingEnabled,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setErr(null);
    try {
      await setFinancingEnabled(!enabled);
      qc.invalidateQueries({ queryKey: ["financing-enabled"] });
    } catch (e: any) {
      setErr(/settings|schema cache|relation/i.test(String(e?.message ?? ""))
        ? "جدول الإعدادات غير مفعّل بعد — طبّق سكربت SQL أولاً."
        : (e?.message ?? "تعذّر الحفظ"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl bg-card border border-border p-6 mb-6">
      <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" /> خدمات المنصّة
      </h2>
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border p-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="rounded-xl bg-brand-soft text-primary p-2 shrink-0">
            <Landmark className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="font-bold">الشراء بالآجل</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {enabled
                ? "مفعّلة — يستطيع العملاء تقديم طلبات الشراء بالآجل."
                : "موقوفة — يظهر للعملاء «قريباً»."}
            </div>
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={busy}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold inline-flex items-center gap-1.5 transition disabled:opacity-60 ${
            enabled ? "bg-emerald-600 text-white hover:bg-emerald-700" : "border border-border hover:bg-secondary"
          }`}
        >
          <Power className="h-4 w-4" /> {busy ? "..." : enabled ? "مفعّلة" : "موقوفة"}
        </button>
      </div>
      {err && <p className="text-sm text-rose-700 mt-2">{err}</p>}
    </section>
  );
}
