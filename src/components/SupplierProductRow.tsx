import { useState } from "react";
import { Pencil, Trash2, Check, X, AlertTriangle } from "lucide-react";
import { editOffer, deleteOffer } from "@/lib/products";
import { formatSAR, type Product } from "@/types";

type Row = { id: string; price: number; moq: number; stock: number | null; product: Product };

export function SupplierProductRow({ row, onChange }: { row: Row; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(row.price));
  const [moq, setMoq] = useState(String(row.moq));
  const [stock, setStock] = useState(row.stock != null ? String(row.stock) : "");
  const [busy, setBusy] = useState(false);

  const low = row.stock != null && row.stock < 10;

  async function save() {
    setBusy(true);
    try {
      await editOffer(
        row.id,
        Number(price) || 0,
        Number(moq) || 1,
        stock.trim() === "" ? null : Math.max(0, Number(stock) || 0),
      );
      setEditing(false);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`حذف "${row.product.name}"؟`)) return;
    setBusy(true);
    try {
      await deleteOffer(row.id);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border p-3 ${low ? "border-amber-300 bg-amber-50" : "border-border"}`}
    >
      <div className="min-w-0 flex-1">
        <div className="font-bold truncate">{row.product.name}</div>
        {editing ? (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-24 rounded-xl border border-border bg-background px-2 py-1 text-sm"
              placeholder="السعر"
              title="شامل الضريبة"
            />
            <input
              type="number"
              min="1"
              value={moq}
              onChange={(e) => setMoq(e.target.value)}
              className="w-20 rounded-xl border border-border bg-background px-2 py-1 text-sm"
              placeholder="الحد الأدنى"
            />
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-24 rounded-xl border border-border bg-background px-2 py-1 text-sm"
              placeholder="المخزون"
              title="اتركه فارغاً لعدم تتبّع المخزون"
            />
          </div>
        ) : (
          <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
            <span>
              {row.product.unit} • الحد الأدنى: {row.moq}
            </span>
            {row.stock != null && (
              <span
                className={`inline-flex items-center gap-1 font-bold ${low ? "text-amber-700" : "text-emerald-700"}`}
              >
                {low && <AlertTriangle className="h-3 w-3" />}
                المخزون: {row.stock}
                {low ? " (منخفض)" : ""}
              </span>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <>
          <button
            onClick={save}
            disabled={busy}
            className="rounded-xl p-2 text-emerald-600 hover:bg-emerald-50"
            aria-label="حفظ"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => setEditing(false)}
            className="rounded-xl p-2 text-muted-foreground hover:bg-secondary"
            aria-label="إلغاء"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <div className="font-extrabold text-primary tabular-nums">
            {formatSAR(Number(row.price))}
          </div>
          <button
            onClick={() => setEditing(true)}
            className="rounded-xl p-2 text-muted-foreground hover:bg-secondary"
            aria-label="تعديل"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={remove}
            disabled={busy}
            className="rounded-xl p-2 text-rose-600 hover:bg-rose-50"
            aria-label="حذف"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
