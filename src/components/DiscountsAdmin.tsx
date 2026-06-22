import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tag, Ticket, Globe, Plus, Trash2, Power } from "lucide-react";
import {
  getAllDiscounts,
  createDiscount,
  setDiscountActive,
  deleteDiscount,
  type Discount,
  type DiscountType,
} from "@/lib/discounts";
import { getAllProducts } from "@/lib/admin";

const TYPE_META: Record<DiscountType, { label: string; Icon: typeof Tag; badge: string }> = {
  global: { label: "خصم عام", Icon: Globe, badge: "bg-violet-100 text-violet-700" },
  product: { label: "خصم منتج", Icon: Tag, badge: "bg-sky-100 text-sky-700" },
  coupon: { label: "كوبون", Icon: Ticket, badge: "bg-amber-100 text-amber-800" },
};

const input = "rounded-2xl border border-border bg-background px-3 py-2.5 text-sm";

export function DiscountsAdmin() {
  const qc = useQueryClient();
  const { data: discounts = [], error } = useQuery({
    queryKey: ["admin-discounts"],
    queryFn: getAllDiscounts,
  });
  const { data: products = [] } = useQuery({ queryKey: ["admin-products"], queryFn: getAllProducts });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-discounts"] });

  const [type, setType] = useState<DiscountType>("global");
  const [percent, setPercent] = useState("");
  const [code, setCode] = useState("");
  const [productId, setProductId] = useState("");
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const p = Number(percent);
    if (!(p > 0 && p <= 90)) return setMsg("النسبة يجب أن تكون بين 1 و 90.");
    if (type === "coupon" && !code.trim()) return setMsg("اكتب كود الكوبون.");
    if (type === "product" && !productId) return setMsg("اختر المنتج.");
    setBusy(true);
    try {
      await createDiscount({
        type,
        percent: p,
        code: code,
        productId,
        label,
        maxUses: maxUses ? Number(maxUses) : null,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      });
      setPercent("");
      setCode("");
      setProductId("");
      setLabel("");
      setMaxUses("");
      setEndsAt("");
      refresh();
      setMsg(null);
    } catch (err: any) {
      const m = String(err?.message ?? "");
      setMsg(
        /discounts|schema cache|relation/i.test(m)
          ? "جدول الخصومات غير مفعّل في القاعدة بعد — طبّق سكربت SQL أولاً."
          : /duplicate|unique/i.test(m)
            ? "كود الكوبون مستخدم مسبقاً."
            : m || "تعذّر الحفظ",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl bg-card border border-border p-6 mb-6">
      <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
        <Tag className="h-5 w-5 text-primary" /> الخصومات والكوبونات
      </h2>

      {/* نموذج الإضافة */}
      <form onSubmit={add} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-5">
        <select value={type} onChange={(e) => setType(e.target.value as DiscountType)} className={input}>
          <option value="global">خصم عام (على كل الطلبات)</option>
          <option value="product">خصم على منتج</option>
          <option value="coupon">كوبون بكود</option>
        </select>
        <input
          type="number"
          min={1}
          max={90}
          value={percent}
          onChange={(e) => setPercent(e.target.value)}
          placeholder="نسبة الخصم %"
          className={input}
        />
        {type === "coupon" && (
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="كود الكوبون (مثلاً WELCOME10)"
            className={input}
          />
        )}
        {type === "product" && (
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className={input}>
            <option value="">اختر المنتج</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="وصف (اختياري)"
          className={input}
        />
        {type === "coupon" && (
          <input
            type="number"
            min={1}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            placeholder="حد الاستخدام (اختياري)"
            className={input}
          />
        )}
        <input
          type="date"
          value={endsAt}
          onChange={(e) => setEndsAt(e.target.value)}
          title="ينتهي في (اختياري)"
          className={`${input} text-muted-foreground`}
        />
        <button
          disabled={busy}
          className="rounded-2xl bg-primary text-primary-foreground px-4 py-2.5 font-bold text-sm inline-flex items-center justify-center gap-1 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" /> إضافة
        </button>
        {msg && (
          <div className="sm:col-span-2 lg:col-span-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            {msg}
          </div>
        )}
      </form>

      {/* القائمة */}
      {error ? (
        <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          جدول الخصومات غير مفعّل بعد — طبّق سكربت SQL لتظهر الخصومات.
        </div>
      ) : discounts.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-4">لا توجد خصومات بعد.</div>
      ) : (
        <div className="space-y-2">
          {discounts.map((d) => (
            <DiscountRow key={d.id} d={d} products={products} onChange={refresh} />
          ))}
        </div>
      )}
    </section>
  );
}

function DiscountRow({
  d,
  products,
  onChange,
}: {
  d: Discount;
  products: { id: string; name: string }[];
  onChange: () => void;
}) {
  const meta = TYPE_META[(d.type as DiscountType) ?? "global"] ?? TYPE_META.global;
  const Icon = meta.Icon;
  const productName = d.product_id ? products.find((p) => p.id === d.product_id)?.name : null;
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border p-3 ${
        d.active ? "border-border" : "border-border bg-secondary/40 opacity-70"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${meta.badge}`}>
            <Icon className="h-3 w-3" /> {meta.label}
          </span>
          <span className="font-extrabold text-primary">{Number(d.percent)}%</span>
          {d.code && (
            <span className="font-mono text-xs rounded bg-secondary px-1.5 py-0.5" dir="ltr">
              {d.code}
            </span>
          )}
          {!d.active && <span className="text-[11px] text-muted-foreground">موقوف</span>}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {productName ? `المنتج: ${productName}` : d.type === "global" ? "على كل الطلبات" : ""}
          {d.label ? ` • ${d.label}` : ""}
          {d.ends_at ? ` • ينتهي ${new Date(d.ends_at).toLocaleDateString("ar-SA")}` : ""}
          {d.max_uses ? ` • استُخدم ${d.used_count}/${d.max_uses}` : ""}
        </div>
      </div>
      <button
        onClick={async () => {
          await setDiscountActive(d.id, !d.active);
          onChange();
        }}
        className={`rounded-xl px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1 transition ${
          d.active ? "border border-border hover:bg-secondary" : "bg-emerald-600 text-white hover:bg-emerald-700"
        }`}
      >
        <Power className="h-3.5 w-3.5" /> {d.active ? "إيقاف" : "تفعيل"}
      </button>
      <button
        onClick={async () => {
          if (confirm("حذف هذا الخصم؟")) {
            await deleteDiscount(d.id);
            onChange();
          }
        }}
        className="rounded-xl p-2 text-rose-600 hover:bg-rose-50"
        aria-label="حذف"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
