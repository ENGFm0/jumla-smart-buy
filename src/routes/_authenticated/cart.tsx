import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ShoppingCart, Trash2, Store, Send, Plus, Minus } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart, setQty, removeFromCart, clearSupplier, type CartItem } from "@/lib/cart";
import { createQuoteRequest } from "@/lib/quotes";

export const Route = createFileRoute("/_authenticated/cart")({
  head: () => ({ meta: [{ title: "السلة — مدد" }] }),
  component: CartPage,
});

type Group = { supplierId: string; supplierName: string; items: CartItem[] };

function CartPage() {
  const items = useCart();
  const navigate = useNavigate();
  const [sending, setSending] = useState<string | null>(null);

  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>();
    for (const it of items) {
      let g = map.get(it.supplierId);
      if (!g) {
        g = { supplierId: it.supplierId, supplierName: it.supplierName, items: [] };
        map.set(it.supplierId, g);
      }
      g.items.push(it);
    }
    return Array.from(map.values());
  }, [items]);

  async function sendGroup(g: Group) {
    setSending(g.supplierId);
    try {
      for (const it of g.items) {
        await createQuoteRequest({
          productId: it.productId,
          supplierId: it.supplierId,
          quantity: it.quantity,
        });
      }
      clearSupplier(g.supplierId);
    } finally {
      setSending(null);
    }
    if (groups.length === 1) navigate({ to: "/my-requests" });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1 max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-2 flex items-center gap-2">
          <ShoppingCart className="h-6 w-6" /> السلة
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          تُرسَل منتجات كل مورّد كطلبات عروض أسعار، ثم تتابعها في «طلباتي».
        </p>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-16 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="font-bold mt-3">سلتك فارغة</h3>
            <p className="text-sm text-muted-foreground mt-1">
              أضف منتجات من صفحات المنتجات لتطلب عروض أسعار دفعة واحدة.
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
            {groups.map((g) => (
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
                        {it.unit && (
                          <div className="text-xs text-muted-foreground">الوحدة: {it.unit}</div>
                        )}
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

                <button
                  onClick={() => sendGroup(g)}
                  disabled={sending === g.supplierId}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground py-3 font-bold disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {sending === g.supplierId
                    ? "جارٍ الإرسال…"
                    : `أرسل طلبات السعر (${g.items.length})`}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
