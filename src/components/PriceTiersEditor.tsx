import { Plus, Trash2 } from "lucide-react";
import type { PriceTier } from "@/types";

// محرّر عروض الكمية: شرائح {من كمية, السعر} يحدّدها المورّد.
export function PriceTiersEditor({
  tiers,
  onChange,
  unit,
}: {
  tiers: PriceTier[];
  onChange: (t: PriceTier[]) => void;
  unit?: string | null;
}) {
  function update(i: number, key: "min" | "price", val: number) {
    onChange(tiers.map((t, n) => (n === i ? { ...t, [key]: val } : t)));
  }
  return (
    <div className="rounded-2xl border border-border p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold">عروض الكمية (اختياري)</span>
        <button
          type="button"
          onClick={() => onChange([...tiers, { min: 0, price: 0 }])}
          className="text-xs font-bold text-primary inline-flex items-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" /> إضافة شريحة
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground mb-2">
        سعر أقل للكميات الأكبر. مثال: من 5 بسعر أقل، من 10 بسعر أقل. (الوحدة: {unit || "قطعة"})
      </p>
      {tiers.length === 0 ? (
        <p className="text-xs text-muted-foreground">لا توجد عروض كمية — السعر ثابت.</p>
      ) : (
        <div className="space-y-2">
          {tiers.map((t, i) => (
            <div key={i} className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">من</span>
              <input
                type="number"
                min={2}
                value={t.min || ""}
                onChange={(e) => update(i, "min", Math.max(0, Number(e.target.value) || 0))}
                placeholder="الكمية"
                className="w-20 rounded-xl border border-border bg-background px-2 py-1 text-sm"
              />
              <span className="text-xs text-muted-foreground">بسعر</span>
              <input
                type="number"
                step="0.01"
                min={0}
                value={t.price || ""}
                onChange={(e) => update(i, "price", Math.max(0, Number(e.target.value) || 0))}
                placeholder="السعر شامل الضريبة"
                className="w-32 rounded-xl border border-border bg-background px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={() => onChange(tiers.filter((_, n) => n !== i))}
                className="text-rose-600 p-1"
                aria-label="حذف"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// تنظيف الشرائح قبل الحفظ: صالحة فقط (min>1 و price>0) ومرتّبة
export function cleanTiers(tiers: PriceTier[]): PriceTier[] {
  return tiers.filter((t) => t.min > 1 && t.price > 0).sort((a, b) => a.min - b.min);
}
