import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PackageSearch, Search, Store, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getAllSuppliers } from "@/lib/suppliers";
import { createProductRequest } from "@/lib/quotes";

export const Route = createFileRoute("/_authenticated/request-product")({
  head: () => ({ meta: [{ title: "اطلب منتجاً غير متوفّر — مدد" }] }),
  component: RequestProductPage,
});

const input = "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm";

function RequestProductPage() {
  const navigate = useNavigate();
  const { data: suppliers = [] } = useQuery({
    queryKey: ["all-suppliers"],
    queryFn: getAllSuppliers,
  });

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [sendAll, setSendAll] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      suppliers.filter(
        (s) => !filter || s.name.includes(filter) || (s.city ?? "").includes(filter),
      ),
    [suppliers, filter],
  );

  const targetCount = sendAll ? suppliers.length : selected.size;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const ids = sendAll ? suppliers.map((s) => s.id) : Array.from(selected);
    if (!name.trim()) return setError("اكتب اسم المنتج المطلوب");
    if (ids.length === 0) return setError("اختر مورّداً واحداً على الأقل أو فعّل «إرسال للكل»");
    setSaving(true);
    try {
      await createProductRequest({
        customProduct: name,
        quantity: Math.max(1, Number(quantity) || 1),
        note,
        supplierIds: ids,
      });
      navigate({ to: "/my-requests" });
    } catch (err: any) {
      setError(err.message ?? "تعذّر إرسال الطلب");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1 max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
          <PackageSearch className="h-6 w-6" /> اطلب منتجاً غير متوفّر
        </h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          صف المنتج اللي تبيه وكميته، واختر الموردين — ويوصلهم طلبك ليسعّروه لك.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div className="rounded-3xl bg-card border border-border p-5 space-y-3">
            <div>
              <label className="block text-sm font-bold mb-1">المنتج المطلوب</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: سكر ناعم ٥٠ كجم — ماركة معيّنة…"
                className={input}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold mb-1">الكمية</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={input}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">ملاحظات (اختياري)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="مواصفات إضافية، وقت التسليم المطلوب…"
                className={`${input} resize-none`}
              />
            </div>
          </div>

          <div className="rounded-3xl bg-card border border-border p-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendAll}
                onChange={(e) => setSendAll(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              <span className="font-bold text-sm">إرسال لكل الموردين ({suppliers.length})</span>
            </label>

            {!sendAll && (
              <div className="mt-4">
                <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 mb-3">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="ابحث باسم المورّد أو المدينة…"
                    className="flex-1 bg-transparent outline-none text-sm"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                  {filtered.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-3 rounded-xl border border-border p-2.5 cursor-pointer hover:bg-secondary/50"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggle(s.id)}
                        className="h-4 w-4 accent-[var(--color-primary)]"
                      />
                      <div className="h-8 w-8 rounded-xl bg-brand-soft text-primary grid place-items-center font-bold text-sm">
                        {s.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate">{s.name}</div>
                        {s.city && (
                          <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                            <Store className="h-3 w-3" /> {s.city}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                  {filtered.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-6">
                      لا يوجد موردون مطابقون.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <button
            disabled={saving}
            className="w-full rounded-full bg-primary text-primary-foreground py-3 font-bold disabled:opacity-60 inline-flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/20 transition"
          >
            <CheckCircle2 className="h-5 w-5" />
            {saving
              ? "جارٍ الإرسال…"
              : `أرسل الطلب${targetCount ? ` لـ ${targetCount} مورّد` : ""}`}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
