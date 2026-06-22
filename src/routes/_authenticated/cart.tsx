import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Trash2, Store, CreditCard, Plus, Minus, Ticket, Check } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart, setQty, removeFromCart, clearSupplier, type CartItem } from "@/lib/cart";
import { createDirectOrders } from "@/lib/quotes";
import { getActiveDiscounts, validateCoupon, effectivePercent } from "@/lib/discounts";
import { formatSAR, unitPriceForQty } from "@/types";

export const Route = createFileRoute("/_authenticated/cart")({
  head: () => ({ meta: [{ title: "السلة — مدد" }] }),
  component: CartPage,
});

type Group = { supplierId: string; supplierName: string; items: CartItem[]; subtotal: number };

function CartPage() {
  const items = useCart();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);

  // الخصومات النشطة + الكوبون
  const { data: active = { global: 0, products: {} } } = useQuery({
    queryKey: ["active-discounts"],
    queryFn: getActiveDiscounts,
  });
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ percent: number; label: string | null } | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const couponPercent = coupon?.percent ?? 0;

  function discUnit(it: CartItem) {
    const base = unitPriceForQty(it.price, it.priceTiers, it.quantity);
    const pct = effectivePercent(it.productId, active, couponPercent);
    return { base, pct, unit: Math.round(base * (1 - pct / 100) * 100) / 100 };
  }

  async function applyCoupon() {
    setChecking(true);
    setCouponMsg(null);
    try {
      const r = await validateCoupon(couponInput);
      if (r) {
        setCoupon(r);
        setCouponMsg(null);
      } else {
        setCoupon(null);
        setCouponMsg("كود غير صالح أو منتهٍ.");
      }
    } finally {
      setChecking(false);
    }
  }

  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>();
    for (const it of items) {
      let g = map.get(it.supplierId);
      if (!g) {
        g = { supplierId: it.supplierId, supplierName: it.supplierName, items: [], subtotal: 0 };
        map.set(it.supplierId, g);
      }
      g.items.push(it);
    }
    const arr = Array.from(map.values());
    for (const g of arr)
      g.subtotal = g.items.reduce(
        (s, it) => s + unitPriceForQty(it.price, it.priceTiers, it.quantity) * it.quantity,
        0,
      );
    return arr;
  }, [items]);

  async function checkout(g: Group) {
    setBusy(g.supplierId);
    try {
      await createDirectOrders(
        g.items.map((it) => ({
          productId: it.productId,
          supplierId: it.supplierId,
          quantity: it.quantity,
          price: discUnit(it).unit,
        })),
      );
      clearSupplier(g.supplierId);
    } finally {
      setBusy(null);
    }
    navigate({ to: "/my-requests" });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1 max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-2 flex items-center gap-2">
          <ShoppingCart className="h-6 w-6" /> السلة
        </h1>
        <p className="text-sm text-muted-foreground mb-3">
          شراء مباشر بالسعر المعروض — يُحسب الإجمالي وتتم متابعة الدفع في «طلباتي». (لو تبي سعراً
          خاصاً لكمية كبيرة، استخدم «اطلب عرض سعر» من صفحة المنتج.)
        </p>
        <Link
          to="/financing"
          className="inline-flex items-center gap-2 rounded-2xl border border-primary text-primary px-4 py-2 text-sm font-bold hover:bg-brand-soft transition mb-6"
        >
          أو اشترِ بالآجل عبر مدد ←
        </Link>

        {/* كوبون الخصم */}
        {items.length > 0 && (
          <div className="mb-6 rounded-2xl border border-border p-3 flex flex-wrap items-center gap-2">
            <Ticket className="h-4 w-4 text-primary" />
            <input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="عندك كوبون خصم؟ اكتبه هنا"
              className="flex-1 min-w-40 rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              onClick={applyCoupon}
              disabled={checking || !couponInput.trim()}
              className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-60"
            >
              {checking ? "..." : "تطبيق"}
            </button>
            {coupon && (
              <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700">
                <Check className="h-4 w-4" /> خصم {coupon.percent}% مفعّل
              </span>
            )}
            {couponMsg && <span className="text-sm text-rose-700">{couponMsg}</span>}
          </div>
        )}

        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-16 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="font-bold mt-3">سلتك فارغة</h3>
            <p className="text-sm text-muted-foreground mt-1">
              أضف منتجات من صفحات المنتجات لتشتريها مباشرة.
            </p>
            <Link
              to="/search"
              className="inline-block mt-5 rounded-2xl bg-primary text-primary-foreground px-5 py-2.5 font-bold"
            >
              تصفّح المنتجات
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((g) => {
              // الأسعار شاملة الضريبة. نطبّق أعلى خصم منطبق على كل عنصر.
              const baseTotal = g.items.reduce((s, it) => s + discUnit(it).base * it.quantity, 0);
              const total = g.items.reduce((s, it) => s + discUnit(it).unit * it.quantity, 0);
              const saved = baseTotal - total;
              const vatIncluded = total - total / 1.15;
              return (
                <div key={g.supplierId} className="rounded-3xl bg-card border border-border p-5">
                  <div className="flex items-center gap-2 font-bold mb-3">
                    <Store className="h-4 w-4 text-primary" />
                    {g.supplierName}
                    <span className="text-xs text-muted-foreground font-normal">
                      · {g.items.length} منتج
                    </span>
                  </div>

                  <div className="space-y-2">
                    {g.items.map((it) => (
                      <div
                        key={it.productId}
                        className="flex items-center gap-3 rounded-2xl border border-border p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold truncate">{it.productName}</div>
                          {(() => {
                            const { base, pct, unit: u } = discUnit(it);
                            return (
                              <div className="text-xs text-muted-foreground">
                                {pct > 0 && (
                                  <span className="line-through opacity-60 ml-1">{formatSAR(base)}</span>
                                )}
                                {formatSAR(u)}
                                {it.unit ? ` / ${it.unit}` : ""} ·{" "}
                                <span className="font-bold text-foreground">
                                  {formatSAR(u * it.quantity)}
                                </span>
                                {pct > 0 && (
                                  <span className="text-emerald-600 font-bold"> · خصم {pct}%</span>
                                )}
                                {it.priceTiers && it.priceTiers.length > 0 && (
                                  <span className="text-primary"> · سعر حسب الكمية</span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              setQty(it.productId, it.supplierId, Math.max(1, it.quantity - 1))
                            }
                            className="h-7 w-7 rounded-lg border border-border grid place-items-center hover:bg-secondary"
                            aria-label="إنقاص"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={it.quantity}
                            onChange={(e) =>
                              setQty(
                                it.productId,
                                it.supplierId,
                                Math.max(1, Number(e.target.value) || 1),
                              )
                            }
                            className="w-14 text-center rounded-lg border border-border bg-background py-1 text-sm"
                          />
                          <button
                            onClick={() => setQty(it.productId, it.supplierId, it.quantity + 1)}
                            className="h-7 w-7 rounded-lg border border-border grid place-items-center hover:bg-secondary"
                            aria-label="زيادة"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(it.productId, it.supplierId)}
                          className="text-muted-foreground hover:text-rose-600 p-1"
                          aria-label="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* الإجمالي (الأسعار شاملة الضريبة) */}
                  <div className="mt-4 space-y-1 text-sm border-t border-border pt-3">
                    {saved > 0 && (
                      <>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>قبل الخصم</span>
                          <span className="line-through">{formatSAR(baseTotal)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-emerald-700">
                          <span>وفّرت</span>
                          <span>− {formatSAR(saved)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between items-center font-extrabold text-base">
                      <span>الإجمالي (شامل الضريبة)</span>
                      <span className="text-primary">{formatSAR(total)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>منها ضريبة القيمة المضافة (15%)</span>
                      <span>{formatSAR(vatIncluded)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => checkout(g)}
                    disabled={busy === g.supplierId}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground py-3 font-bold disabled:opacity-60"
                  >
                    <CreditCard className="h-4 w-4" />
                    {busy === g.supplierId ? "جارٍ الإتمام…" : `إتمام الشراء (${formatSAR(total)})`}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
