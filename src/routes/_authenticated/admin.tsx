import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Building2,
  Package,
  Tag,
  FileText,
  Users,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Search,
  AlertTriangle,
  Landmark,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FinancingAdmin } from "@/components/FinancingAdmin";
import { useAuth, getUserRoles } from "@/lib/auth";
import {
  getAdminStats,
  getAllSuppliers,
  setSupplierVerified,
  deleteSupplier,
  getAllProducts,
  deleteProduct,
} from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "لوحة الإدارة — مدد" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", user?.id],
    queryFn: () => getUserRoles(user!.id),
    enabled: !!user,
  });
  const isAdmin = roles.includes("admin");

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: getAdminStats,
    enabled: isAdmin,
  });
  const { data: suppliers = [] } = useQuery({
    queryKey: ["admin-suppliers"],
    queryFn: getAllSuppliers,
    enabled: isAdmin,
  });
  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: getAllProducts,
    enabled: isAdmin,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-suppliers"] });
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const [supQ, setSupQ] = useState("");
  const [prodQ, setProdQ] = useState("");

  // الموردون: المنتظرون لتوثيق الحساب البنكي (آيبان موجود وغير موثّق) أولاً
  const pendingBank = useMemo(
    () => suppliers.filter((s) => s.iban && !s.verified).length,
    [suppliers],
  );
  const filteredSuppliers = useMemo(() => {
    const q = supQ.trim().toLowerCase();
    const list = suppliers.filter((s) =>
      !q
        ? true
        : `${s.name} ${s.city} ${s.phone} ${s.iban ?? ""} ${s.account_holder ?? ""}`
            .toLowerCase()
            .includes(q),
    );
    const rank = (s: (typeof suppliers)[number]) => (s.iban && !s.verified ? 0 : s.verified ? 2 : 1);
    return [...list].sort((a, b) => rank(a) - rank(b));
  }, [suppliers, supQ]);

  const filteredProducts = useMemo(() => {
    const q = prodQ.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      `${p.name} ${p.category?.name ?? ""} ${p.unit}`.toLowerCase().includes(q),
    );
  }, [products, prodQ]);

  if (rolesLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
          جاري التحميل…
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16 flex-1">
          <div className="max-w-md mx-auto text-center rounded-3xl border border-border p-10">
            <ShieldAlert className="h-12 w-12 mx-auto text-rose-500" />
            <h1 className="font-extrabold text-xl mt-3">غير مصرّح</h1>
            <p className="text-sm text-muted-foreground mt-1">هذه الصفحة مخصّصة للإدارة فقط.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-1 flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-primary" /> لوحة الإدارة
        </h1>
        <p className="text-sm text-muted-foreground mb-6">إدارة الموردين والمنتجات وطلبات التمويل.</p>

        {/* الإحصائيات */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <StatCard icon={Building2} label="الموردون" value={stats?.suppliers} tone="emerald" />
          <StatCard icon={Package} label="المنتجات" value={stats?.products} tone="sky" />
          <StatCard icon={Tag} label="العروض" value={stats?.offers} tone="violet" />
          <StatCard icon={FileText} label="الطلبات" value={stats?.quotes} tone="amber" />
          <StatCard icon={Users} label="المستخدمون" value={stats?.users} tone="slate" />
        </div>

        {/* تنبيه: موردون بانتظار توثيق الحساب البنكي */}
        {pendingBank > 0 && (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              <span className="font-bold">{pendingBank}</span> مورّد بانتظار توثيق الحساب البنكي —
              راجع الآيبان قبل التوثيق.
            </span>
          </div>
        )}

        {/* طلبات التمويل (الشراء بالآجل) */}
        <FinancingAdmin />

        {/* الموردون */}
        <section className="rounded-3xl bg-card border border-border p-6 mb-6 mt-6">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <h2 className="font-bold text-lg">الموردون ({suppliers.length})</h2>
            <SearchBox value={supQ} onChange={setSupQ} placeholder="ابحث باسم/مدينة/آيبان…" />
          </div>
          <div className="space-y-2.5">
            {filteredSuppliers.map((s) => (
              <SupplierRow
                key={s.id}
                s={s}
                onToggle={async () => {
                  await setSupplierVerified(s.id, !s.verified);
                  refresh();
                }}
                onDelete={async () => {
                  if (confirm(`حذف المورّد "${s.name}"؟ سيُحذف معه كل عروضه.`)) {
                    await deleteSupplier(s.id);
                    refresh();
                  }
                }}
              />
            ))}
            {filteredSuppliers.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-6">
                {supQ ? "لا نتائج مطابقة." : "لا يوجد موردون."}
              </div>
            )}
          </div>
        </section>

        {/* المنتجات */}
        <section className="rounded-3xl bg-card border border-border p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <h2 className="font-bold text-lg">المنتجات ({products.length})</h2>
            <SearchBox value={prodQ} onChange={setProdQ} placeholder="ابحث باسم المنتج/الفئة…" />
          </div>
          <div className="space-y-2">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3 hover:bg-secondary/30 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5">
                      {p.category?.name ?? p.category_id}
                    </span>{" "}
                    • {p.unit}
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (confirm(`حذف المنتج "${p.name}"؟`)) {
                      await deleteProduct(p.id);
                      refresh();
                    }
                  }}
                  className="rounded-xl p-2 text-rose-600 hover:bg-rose-50"
                  aria-label="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-6">
                {prodQ ? "لا نتائج مطابقة." : "لا توجد منتجات."}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

const TONES: Record<string, string> = {
  emerald: "from-emerald-500 to-teal-600",
  sky: "from-sky-500 to-blue-600",
  violet: "from-violet-500 to-purple-600",
  amber: "from-amber-500 to-orange-600",
  slate: "from-slate-500 to-slate-700",
};

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Building2;
  label: string;
  value?: number;
  tone: keyof typeof TONES | string;
}) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <div
        className={`h-9 w-9 rounded-xl bg-gradient-to-br ${TONES[tone] ?? TONES.slate} text-white flex items-center justify-center shadow-sm`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-extrabold mt-2 tabular-nums">{value ?? "…"}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full sm:w-64">
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-border bg-background pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
      />
    </div>
  );
}

type AdminSupplier = Awaited<ReturnType<typeof getAllSuppliers>>[number];

function SupplierRow({
  s,
  onToggle,
  onDelete,
}: {
  s: AdminSupplier;
  onToggle: () => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const pending = !!s.iban && !s.verified;
  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-2xl border p-3 ${
        pending ? "border-amber-300 bg-amber-50/60" : "border-border"
      }`}
    >
      <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-teal-600 text-white flex items-center justify-center font-extrabold shrink-0 shadow-sm">
        {s.name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold truncate">{s.name}</span>
          {s.verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5">
              <BadgeCheck className="h-3 w-3" /> موثّق
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold px-2 py-0.5">
              غير موثّق
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {s.city} • {s.phone}
        </div>
        {s.iban ? (
          <div className="mt-1.5 rounded-lg bg-background border border-border px-2 py-1.5 text-[11px]">
            <div className="flex items-center gap-1 font-bold">
              <Landmark className="h-3 w-3 text-primary" />
              {s.account_holder || "—"}
              {s.bank_name ? ` • ${s.bank_name}` : ""}
            </div>
            <div className="font-mono mt-0.5" dir="ltr">
              {s.iban}
            </div>
            {pending && (
              <div className="text-amber-700 mt-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> تأكّد أن اسم صاحب الحساب يطابق المورّد قبل
                التوثيق.
              </div>
            )}
          </div>
        ) : (
          <div className="mt-1 text-[11px] text-muted-foreground">لم يضف آيباناً بعد.</div>
        )}
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <button
          onClick={onToggle}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
            s.verified
              ? "border border-border hover:bg-secondary"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          {s.verified ? "إلغاء التوثيق" : "توثيق"}
        </button>
        <button
          onClick={onDelete}
          className="rounded-xl p-2 text-rose-600 hover:bg-rose-50"
          aria-label="حذف"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
