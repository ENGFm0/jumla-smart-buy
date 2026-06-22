import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  BadgeCheck,
  Building2,
  Package,
  FileText,
  Users,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Search,
  AlertTriangle,
  Landmark,
  ChevronDown,
  Activity,
  TrendingUp,
  Receipt,
  Printer,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FinancingAdmin } from "@/components/FinancingAdmin";
import { DiscountsAdmin } from "@/components/DiscountsAdmin";
import { AdminOrderDetail } from "@/components/AdminOrderDetail";
import { useAuth, getUserRoles } from "@/lib/auth";
import {
  getAdminStats,
  getAllSuppliers,
  setSupplierVerified,
  deleteSupplier,
  getAllOrders,
  type AdminOrder,
} from "@/lib/admin";
import { getProductsBySupplier } from "@/lib/products";
import { getBuyerContactsByIds, type BuyerContact } from "@/lib/orders";
import { printInvoice } from "@/lib/printInvoice";
import { classifyOrder, type OrderCategory } from "@/lib/orderFilters";
import { formatSAR } from "@/types";

export const Route = createFileRoute("/_authenticated/elaf")({
  head: () => ({ meta: [{ title: "لوحة الإدارة — مدد" }] }),
  component: AdminPage,
});

const CAT_LABEL: Record<OrderCategory, string> = {
  waiting: "بانتظار التسعير",
  ongoing: "جارٍ",
  done: "منتهٍ",
  rejected: "مرفوض/ملغي",
};
function AdminPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", user?.id],
    queryFn: () => getUserRoles(user!.id),
    enabled: !!user,
  });
  const isAdmin = roles.includes("admin");

  const { data: stats } = useQuery({ queryKey: ["admin-stats"], queryFn: getAdminStats, enabled: isAdmin });
  const { data: suppliers = [] } = useQuery({
    queryKey: ["admin-suppliers"],
    queryFn: getAllSuppliers,
    enabled: isAdmin,
  });
  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: getAllOrders,
    enabled: isAdmin,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-suppliers"] });
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  // بيانات المشترين (للبحث عن الفواتير برقم الجوال)
  const buyerIds = useMemo(() => Array.from(new Set(orders.map((o) => o.buyer_id))), [orders]);
  const { data: buyers = {} } = useQuery({
    queryKey: ["admin-buyer-contacts", buyerIds],
    queryFn: () => getBuyerContactsByIds(buyerIds),
    enabled: isAdmin && buyerIds.length > 0,
  });

  const [supQ, setSupQ] = useState("");
  const [invQ, setInvQ] = useState("");

  const invResults = useMemo(() => {
    const q = invQ.trim().toLowerCase();
    if (!q) return [];
    return orders
      .filter((o) => {
        const b = buyers[o.buyer_id];
        const hay =
          `${o.invoice_number ?? ""} ${o.product?.name ?? o.custom_product ?? ""} ${o.supplier?.name ?? ""} ${b?.business_name ?? ""} ${b?.phone ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 40);
  }, [invQ, orders, buyers]);

  // تحليلات مشتقّة من الطلبات
  const analytics = useMemo(() => {
    const byStatus: Record<OrderCategory, number> = { waiting: 0, ongoing: 0, done: 0, rejected: 0 };
    const sup = new Map<string, { name: string; orders: number; active: number; sales: number }>();
    const dayMap = new Map<string, number>();
    for (const o of orders) {
      const c = classifyOrder(o as never);
      byStatus[c]++;
      const sid = o.supplier?.id ?? o.supplier_id;
      if (sid) {
        const e = sup.get(sid) ?? { name: o.supplier?.name ?? "—", orders: 0, active: 0, sales: 0 };
        e.orders++;
        if (c === "ongoing" || c === "waiting") e.active++;
        if (o.delivered_at && o.quoted_price) e.sales += Number(o.quoted_price) * o.quantity;
        sup.set(sid, e);
      }
      const key = new Date(o.created_at).toISOString().slice(0, 10);
      dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
    }
    const days: { label: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        label: new Intl.DateTimeFormat("ar-SA", { day: "numeric", month: "short" }).format(d),
        count: dayMap.get(key) ?? 0,
      });
    }
    const topSuppliers = [...sup.entries()]
      .map(([id, e]) => ({ id, ...e }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 6);
    const totalSales = [...sup.values()].reduce((s, e) => s + e.sales, 0);
    return { byStatus, days, topSuppliers, sup, totalSales };
  }, [orders]);

  const activeOrders = useMemo(
    () => orders.filter((o) => classifyOrder(o as never) === "ongoing").slice(0, 12),
    [orders],
  );

  const pendingBank = useMemo(() => suppliers.filter((s) => s.iban && !s.verified).length, [suppliers]);
  const filteredSuppliers = useMemo(() => {
    const q = supQ.trim().toLowerCase();
    const list = suppliers.filter((s) =>
      !q ? true : `${s.name} ${s.city} ${s.iban ?? ""} ${s.account_holder ?? ""}`.toLowerCase().includes(q),
    );
    const rank = (s: (typeof suppliers)[number]) => (s.iban && !s.verified ? 0 : s.verified ? 2 : 1);
    return [...list].sort((a, b) => rank(a) - rank(b));
  }, [suppliers, supQ]);

  const pie = [
    { name: CAT_LABEL.waiting, value: analytics.byStatus.waiting, fill: "#94a3b8" },
    { name: CAT_LABEL.ongoing, value: analytics.byStatus.ongoing, fill: "#0ea5e9" },
    { name: CAT_LABEL.done, value: analytics.byStatus.done, fill: "#10b981" },
    { name: CAT_LABEL.rejected, value: analytics.byStatus.rejected, fill: "#f43f5e" },
  ].filter((d) => d.value > 0);

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
            <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground" />
            <h1 className="font-extrabold text-xl mt-3">الصفحة غير موجودة</h1>
            <p className="text-sm text-muted-foreground mt-1">تعذّر العثور على الصفحة المطلوبة.</p>
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
        <p className="text-sm text-muted-foreground mb-6">نظرة شاملة على المنصّة.</p>

        {/* الإحصائيات */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <StatCard icon={Building2} label="الموردون" value={stats?.suppliers} tone="emerald" />
          <StatCard icon={Package} label="المنتجات" value={stats?.products} tone="sky" />
          <StatCard icon={FileText} label="الطلبات" value={orders.length} tone="violet" />
          <StatCard icon={Activity} label="الجارية الآن" value={analytics.byStatus.ongoing} tone="amber" />
          <StatCard icon={Users} label="المستخدمون" value={stats?.users} tone="slate" />
        </div>

        {pendingBank > 0 && (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              <span className="font-bold">{pendingBank}</span> مورّد بانتظار توثيق الحساب البنكي — راجع
              الآيبان قبل التوثيق.
            </span>
          </div>
        )}

        {/* بحث الفواتير والطلبات */}
        <section className="rounded-3xl bg-card border border-border p-6 mb-8">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" /> بحث الفواتير والطلبات
            </h2>
            <SearchBox value={invQ} onChange={setInvQ} placeholder="رقم الفاتورة / الجوال / المنتج…" />
          </div>
          {invQ.trim() === "" ? (
            <p className="text-sm text-muted-foreground">
              اكتب رقم الفاتورة أو رقم جوال العميل أو اسم المنتج/المورّد للبحث وعرض الفاتورة وطباعتها.
            </p>
          ) : invResults.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد نتائج مطابقة.</p>
          ) : (
            <div className="space-y-2">
              {invResults.map((o) => {
                const b = buyers[o.buyer_id];
                const total = o.quoted_price != null ? Number(o.quoted_price) * o.quantity : null;
                return (
                  <div
                    key={o.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold">{o.invoice_number ?? "غير مدفوع"}</span>
                        {total != null && (
                          <span className="text-primary font-extrabold text-sm">{formatSAR(total)}</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        {o.product?.name ?? o.custom_product ?? "منتج"} • {o.supplier?.name ?? "—"}
                        {b?.business_name ? ` • ${b.business_name}` : ""}
                        {b?.phone ? ` • ${b.phone}` : ""}
                      </div>
                    </div>
                    <button
                      onClick={() => printOrderInvoice(o, b)}
                      disabled={!o.paid_at}
                      title={o.paid_at ? "طباعة الفاتورة" : "لا توجد فاتورة (لم يُدفع بعد)"}
                      className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-1.5 text-xs font-bold hover:bg-secondary disabled:opacity-50 shrink-0"
                    >
                      <Printer className="h-3.5 w-3.5" /> طباعة
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* الرسوم البيانية */}
        <div className="grid lg:grid-cols-3 gap-4 mb-8">
          <ChartCard title="الطلبات حسب الحالة">
            {mounted && pie.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pie} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {pie.map((d, i) => (
                      <Cell key={i} fill={d.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
            <Legend items={pie.map((d) => ({ label: d.name, color: d.fill, value: d.value }))} />
          </ChartCard>

          <ChartCard title="النشاط — آخر 14 يوم">
            {mounted ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analytics.days} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={1} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="طلبات" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </ChartCard>

          <ChartCard title="أعلى الموردين مبيعاً (منجزة)">
            {mounted && analytics.topSuppliers.some((s) => s.sales > 0) ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={analytics.topSuppliers}
                  layout="vertical"
                  margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
                >
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => formatSAR(v)} />
                  <Bar dataKey="sales" name="المبيعات" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="لا توجد مبيعات منجزة بعد" />
            )}
          </ChartCard>
        </div>

        {/* الطلبات الجارية الآن */}
        <section className="rounded-3xl bg-card border border-border p-6 mb-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> الطلبات الجارية الآن ({analytics.byStatus.ongoing})
          </h2>
          <div className="space-y-2">
            {activeOrders.map((o) => (
              <AdminOrderDetail key={o.id} order={o} buyer={buyers[o.buyer_id]} />
            ))}
            {activeOrders.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-6">لا توجد طلبات جارية الآن.</div>
            )}
          </div>
        </section>

        {/* الخصومات والكوبونات */}
        <DiscountsAdmin />

        {/* البيع بالآجل */}
        <FinancingAdmin />

        {/* لوحة الموردين */}
        <section className="rounded-3xl bg-card border border-border p-6 mb-6 mt-6">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <h2 className="font-bold text-lg">الموردون ({suppliers.length})</h2>
            <SearchBox value={supQ} onChange={setSupQ} placeholder="ابحث باسم/مدينة/آيبان…" />
          </div>
          <div className="space-y-2.5">
            {filteredSuppliers.map((s) => (
              <SupplierBoardRow
                key={s.id}
                s={s}
                stat={analytics.sup.get(s.id)}
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
      </main>
      <Footer />
    </div>
  );
}

function printOrderInvoice(o: AdminOrder, b?: BuyerContact) {
  printInvoice({
    invoiceNumber: o.invoice_number,
    date: o.paid_at,
    supplier: { name: o.supplier?.name },
    buyer: { name: b?.business_name, city: b?.city, phone: b?.phone },
    productName: o.product?.name ?? o.custom_product ?? "منتج",
    quantity: o.quantity,
    unitPrice: Number(o.quoted_price ?? 0),
  });
}

/* ---------- مكوّنات مساعدة ---------- */

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
  tone: string;
}) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${TONES[tone]} text-white flex items-center justify-center shadow-sm`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-extrabold mt-2 tabular-nums">{value ?? "…"}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-card border border-border p-5">
      <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5 text-muted-foreground">
        <TrendingUp className="h-4 w-4" /> {title}
      </h3>
      {children}
    </div>
  );
}

function EmptyChart({ label = "لا توجد بيانات بعد" }: { label?: string }) {
  return <div className="h-[220px] grid place-items-center text-sm text-muted-foreground">{label}</div>;
}

function Legend({ items }: { items: { label: string; color: string; value: number }[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: i.color }} />
          {i.label} ({i.value})
        </span>
      ))}
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

function SupplierBoardRow({
  s,
  stat,
  onToggle,
  onDelete,
}: {
  s: AdminSupplier;
  stat?: { orders: number; active: number; sales: number };
  onToggle: () => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const pending = !!s.iban && !s.verified;
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-sup-products", s.id],
    queryFn: () => getProductsBySupplier(s.id),
    enabled: open,
  });

  return (
    <div className={`rounded-2xl border ${pending ? "border-amber-300 bg-amber-50/60" : "border-border"}`}>
      <div className="flex items-start gap-3 p-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-teal-600 text-white flex items-center justify-center font-extrabold shrink-0 shadow-sm"
          aria-label="عرض المنتجات"
        >
          {s.name.charAt(0)}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold truncate">{s.name}</span>
            {s.verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5">
                <BadgeCheck className="h-3 w-3" /> موثّق
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold px-2 py-0.5">
                غير موثّق
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {s.city} • {s.phone}
          </div>
          {/* مبيعاته وتفاعله */}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Chip>طلبات: {stat?.orders ?? 0}</Chip>
            <Chip tone="sky">جارية: {stat?.active ?? 0}</Chip>
            <Chip tone="emerald">مبيعات: {formatSAR(stat?.sales ?? 0)}</Chip>
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
                  <AlertTriangle className="h-3 w-3" /> طابق اسم صاحب الحساب مع المورّد قبل التوثيق.
                </div>
              )}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <button
            onClick={onToggle}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              s.verified ? "border border-border hover:bg-secondary" : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {s.verified ? "إلغاء التوثيق" : "توثيق"}
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setOpen((v) => !v)}
              className="rounded-xl p-2 text-muted-foreground hover:bg-secondary"
              aria-label="المنتجات"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            <button onClick={onDelete} className="rounded-xl p-2 text-rose-600 hover:bg-rose-50" aria-label="حذف">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="border-t border-border p-3 bg-secondary/20">
          <div className="text-xs font-bold text-muted-foreground mb-2">منتجاته ({products.length})</div>
          {isLoading ? (
            <div className="text-center text-xs text-muted-foreground py-4">جاري التحميل…</div>
          ) : products.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-4">لا توجد منتجات.</div>
          ) : (
            <div className="space-y-1.5">
              {products.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-2.5"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate">{row.product.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {row.product.unit} • الحد الأدنى {row.moq}
                      {row.stock != null ? ` • مخزون ${row.stock}` : ""}
                    </div>
                  </div>
                  <div className="font-extrabold text-primary text-sm tabular-nums shrink-0">
                    {formatSAR(Number(row.price))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Chip({ children, tone }: { children: React.ReactNode; tone?: "sky" | "emerald" }) {
  const cls =
    tone === "sky"
      ? "bg-sky-100 text-sky-700"
      : tone === "emerald"
        ? "bg-emerald-100 text-emerald-700"
        : "bg-secondary text-muted-foreground";
  return <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${cls}`}>{children}</span>;
}
