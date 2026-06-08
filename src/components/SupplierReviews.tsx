import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getSupplierReviews, getMyReview, upsertReview } from "@/lib/reviews";

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
          aria-label={`${n} نجوم`}
        >
          <Star
            className={`h-5 w-5 ${n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
          />
        </button>
      ))}
    </div>
  );
}

export function SupplierReviews({ supplierId }: { supplierId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", supplierId],
    queryFn: () => getSupplierReviews(supplierId),
  });
  const { data: mine } = useQuery({
    queryKey: ["my-review", supplierId, user?.id],
    queryFn: () => getMyReview(supplierId),
    enabled: !!user,
  });

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (mine) {
      setRating(mine.rating);
      setComment(mine.comment ?? "");
    }
  }, [mine]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertReview(supplierId, rating, comment);
      qc.invalidateQueries({ queryKey: ["reviews", supplierId] });
      qc.invalidateQueries({ queryKey: ["my-review", supplierId, user?.id] });
      qc.invalidateQueries({ queryKey: ["supplier", supplierId] });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl bg-card border border-border p-6">
      <h2 className="font-bold text-lg mb-4">التقييمات ({reviews.length})</h2>

      {user ? (
        <form onSubmit={submit} className="rounded-2xl border border-border p-4 mb-5">
          <div className="text-sm font-bold mb-2">{mine ? "عدّل تقييمك" : "أضف تقييمك"}</div>
          <Stars value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="اكتب رأيك (اختياري)…"
            className="w-full mt-3 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm resize-none"
          />
          <button
            disabled={saving}
            className="mt-3 rounded-2xl bg-primary text-primary-foreground px-5 py-2.5 font-bold text-sm disabled:opacity-60"
          >
            {saving ? "..." : mine ? "تحديث التقييم" : "إرسال التقييم"}
          </button>
        </form>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-4 mb-5 text-sm text-muted-foreground">
          <Link to="/auth" className="text-primary font-bold">
            سجّل الدخول
          </Link>{" "}
          لإضافة تقييم.
        </div>
      )}

      <div className="space-y-3">
        {reviews.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-4">لا توجد تقييمات بعد.</div>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border p-4">
              <Stars value={r.rating} />
              {r.comment && <p className="text-sm mt-2">{r.comment}</p>}
              <div className="text-[11px] text-muted-foreground mt-1">
                {new Date(r.created_at).toLocaleDateString("ar-SA")}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
