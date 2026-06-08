import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import { getSupplierQuoteRequests, respondToQuote } from "@/lib/quotes";
import {
  formatSAR,
  QUOTE_STATUS_LABEL,
  type QuoteRequestDetailed,
  type QuoteStatus,
} from "@/types";

const STATUS_STYLE: Record<QuoteStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  quoted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  closed: "bg-slate-200 text-slate-600",
};

export function IncomingQuotes({ supplierId }: { supplierId: string }) {
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["incoming-quotes", supplierId],
    queryFn: () => getSupplierQuoteRequests(supplierId),
  });

  return (
    <div className="rounded-3xl bg-card border border-border p-6">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <Inbox className="h-5 w-5" /> طلبات واردة ({requests.length})
      </h3>
      {isLoading ? (
        <div className="text-center text-sm text-muted-foreground py-6">جاري التحميل…</div>
      ) : requests.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-6">
          لا توجد طلبات عروض أسعار بعد.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {requests.map((r) => (
            <QuoteCard key={r.id} req={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuoteCard({ req }: { req: QuoteRequestDetailed }) {
  const qc = useQueryClient();
  const [price, setPrice] = useState(req.quoted_price != null ? String(req.quoted_price) : "");
  const [reply, setReply] = useState(req.supplier_reply ?? "");
  const [saving, setSaving] = useState(false);

  async function respond(status: QuoteStatus) {
    setSaving(true);
    try {
      await respondToQuote(req.id, {
        quotedPrice: status === "quoted" ? Number(price) || null : null,
        reply: reply.trim() || null,
        status,
      });
      qc.invalidateQueries({ queryKey: ["incoming-quotes", req.supplier_id] });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="font-bold">{req.product?.name ?? "منتج"}</div>
          <div className="text-sm text-muted-foreground mt-1">
            الكمية المطلوبة: <span className="font-bold text-foreground">{req.quantity}</span>
          </div>
          {req.note && <div className="text-sm text-muted-foreground mt-1">ملاحظة: {req.note}</div>}
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[req.status]}`}>
          {QUOTE_STATUS_LABEL[req.status]}
        </span>
      </div>

      {req.status === "pending" ? (
        <div className="mt-3 grid sm:grid-cols-2 gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="السعر المقترح (ر.س)"
            className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
          />
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="رد مختصر (اختياري)"
            className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
          />
          <button
            onClick={() => respond("quoted")}
            disabled={saving || !price}
            className="rounded-2xl bg-primary text-primary-foreground py-2.5 font-bold text-sm disabled:opacity-60"
          >
            إرسال التسعير
          </button>
          <button
            onClick={() => respond("rejected")}
            disabled={saving}
            className="rounded-2xl border border-rose-200 text-rose-700 py-2.5 font-bold text-sm hover:bg-rose-50 disabled:opacity-60"
          >
            رفض الطلب
          </button>
        </div>
      ) : (
        <div className="mt-3 text-sm text-muted-foreground">
          {req.quoted_price != null && (
            <span className="font-bold text-primary">
              سعرك المقترح: {formatSAR(Number(req.quoted_price))}
            </span>
          )}
          {req.supplier_reply && <span className="block mt-1">ردّك: {req.supplier_reply}</span>}
        </div>
      )}
    </div>
  );
}
