import { createFileRoute } from "@tanstack/react-router";
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
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
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

  if (rolesLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">جاري التحميل…</div>
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
            <p className="text-sm text-muted-foreground mt-1">
              هذه الصفحة مخصّصة للإدارة فقط.
            </p>
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
        <h1 className="text-2xl md:text-3xl font-extrabold mb-6">لوحة الإدارة</h1>

        {/* الإحصائيات */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <StatCard icon={<Building2 className="h-5 w-5" />} label="الموردون" value={stats?.suppliers} />
          <StatCard icon={<Package className="h-5 w-5" />} label="المنتجات" value={stats?.products} />
          <StatCard icon={<Tag className="h-5 w-5" />} label="العروض" value={stats?.offers} />
          <StatCard icon={<FileText className="h-5 w-5" />} label="الطلبات" value={stats?.quotes} />
          <StatCard icon={<Users className="h-5 w-5" />} label="المستخدمون" value={stats?.users} />
        </div>

        {/* الموردون */}
        <section className="rounded-3xl bg-card border border-border p-6 mb-6">
          <h2 className="font-bold text-lg mb-4">الموردون ({suppliers.length})</h2>
          <div className="space-y-2">
            {suppliers.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold truncate">{s.name}</span>
                    {s.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5">
                        <BadgeCheck className="h-3 w-3" /> موثّق
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.city} • {s.phone}</div>
                </div>
                <button
                  onClick={async () => { await setSupplierVerified(s.id, !s.verified); refresh(); }}
                  className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold hover:bg-secondary"
                >
                  {s.verified ? "إلغاء التوثيق" : "توثيق"}
                </button>
                <button
                  onClick={async () => {
                    if (confirm(`حذف المورّد "${s.name}"؟ سيُحذف معه كل عروضه.`)) {
                      await deleteSupplier(s.id);
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
            {suppliers.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-6">لا يوجد موردون.</div>
            )}
          </div>
        </section>

        {/* المنتجات */}
        <section className="rounded-3xl bg-card border border-border p-6">
          <h2 className="font-bold text-lg mb-4">المنتجات ({products.length})</h2>
          <div className="space-y-2">
            {products.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3">
                <div className="min-w-0 flex-1">
                  <div className="font-bold truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.category?.name ?? p.category_id} • {p.unit}
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
            {products.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-6">لا توجد منتجات.</div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value?: number }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-extrabold mt-1 tabular-nums">{value ?? "…"}</div>
    </div>
  );
}
