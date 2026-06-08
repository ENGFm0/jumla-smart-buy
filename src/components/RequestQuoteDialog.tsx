import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FileText, X, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { createQuoteRequest } from "@/lib/quotes";

export function RequestQuoteDialog({
  productId,
  supplierId,
  productName,
  supplierName,
}: {
  productId: string;
  supplierId: string;
  productName: string;
  supplierName: string;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function openDialog() {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    setDone(false);
    setError(null);
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createQuoteRequest({
        productId,
        supplierId,
        quantity: Number(quantity) || 1,
        note: note.trim() || undefined,
      });
      setDone(true);
    } catch (err: any) {
      setError(err.message ?? "تعذّر إرسال الطلب");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-primary text-primary px-3 py-2 text-sm font-bold hover:bg-brand-soft transition"
      >
        <FileText className="h-4 w-4" />
        اطلب عرض سعر
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-card border border-border p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg">طلب عرض سعر</h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-secondary"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {done ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500" />
                <p className="font-bold mt-3">تم إرسال طلبك بنجاح</p>
                <p className="text-sm text-muted-foreground mt-1">
                  ستجد رد المورّد في صفحة «طلباتي».
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="mt-5 rounded-2xl bg-primary text-primary-foreground px-5 py-2.5 font-bold"
                >
                  تمام
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  المنتج: <span className="font-bold text-foreground">{productName}</span>
                  <br />
                  المورّد: <span className="font-bold text-foreground">{supplierName}</span>
                </p>
                <div>
                  <label className="block text-sm font-bold mb-1">الكمية المطلوبة</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">ملاحظة (اختياري)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="مثلاً: أحتاج التوصيل خلال أسبوع…"
                    className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm resize-none"
                  />
                </div>
                {error && (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-primary text-primary-foreground py-3 font-bold disabled:opacity-60"
                >
                  {loading ? "..." : "إرسال الطلب"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
