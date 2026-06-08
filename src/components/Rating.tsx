import { Star } from "lucide-react";

export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <div className="inline-flex items-center gap-1 text-xs text-amber-600">
      <Star className="h-3.5 w-3.5 fill-amber-500 stroke-amber-500" />
      <span className="font-bold tabular-nums">{value.toFixed(1)}</span>
      {count != null && <span className="text-muted-foreground">({count})</span>}
    </div>
  );
}