import { formatSAR } from "@/types";
import { TrendingDown, BarChart3, TrendingUp } from "lucide-react";

type Variant = "low" | "avg" | "high";

const config: Record<Variant, { label: string; cls: string; Icon: typeof TrendingDown }> = {
  low: {
    label: "أرخص",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Icon: TrendingDown,
  },
  avg: {
    label: "المتوسط",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    Icon: BarChart3,
  },
  high: {
    label: "الأعلى",
    cls: "bg-rose-50 text-rose-700 border-rose-200",
    Icon: TrendingUp,
  },
};

export function PriceStat({ variant, value }: { variant: Variant; value: number | null }) {
  const { label, cls, Icon } = config[variant];
  return (
    <div className={`rounded-2xl border px-3 py-2 ${cls}`}>
      <div className="flex items-center gap-1 text-[11px] font-medium opacity-80">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="text-sm font-extrabold tabular-nums mt-0.5">
        {value == null ? "—" : formatSAR(value)}
      </div>
    </div>
  );
}