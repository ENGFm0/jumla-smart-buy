import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, MapPin, Plus, Calendar } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Rating } from "@/components/Rating";
import { IncomingQuotes } from "@/components/IncomingQuotes";
import { BulkImport } from "@/components/BulkImport";
import { SupplierProductRow } from "@/components/SupplierProductRow";
import { PriceTiersEditor, cleanTiers } from "@/components/PriceTiersEditor";
import type { PriceTier } from "@/types";
import { useAuth } from "@/lib/auth";
import { getSupplierByUserId, upsertSupplier } from "@/lib/suppliers";
import {
  getCategories,
  getProductsBySupplier,
  addProductOffer,
  addCategory,
  uploadProductImage,
} from "@/lib/products";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "لوحة المورّد — مدد" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const { data: supplier, isLoading: sl } = useQuery({
    queryKey: ["supplier", userId],
    queryFn: () => getSupplierByUserId(userId!),
    enabled: !!userId,
  });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const { data: myProducts = [], refetch } = useQuery({
    queryKey: ["my-products", supplier?.id],
    queryFn: () => getProductsBySupplier(supplier!.id),
    enabled: !!supplier,
  });

  // Onboarding form for supplier profile
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  useEffect(() => {
    if (supplier) {
      setName(supplier.name);
      setCity(supplier.city);
      setPhone(supplier.phone);
      setWhatsapp(supplier.whatsapp);
      setDescription(supplier.description ?? "");
      setAddress(supplier.address ?? "");
      setMapsUrl(supplier.maps_url ?? "");
    }
  }, [supplier]);

  async function saveSupplier(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    await upsertSupplier({ userId, name, city, phone, whatsapp, description, address, mapsUrl });
    qc.invalidateQueries({ queryKey: ["supplier", userId] });
  }

  // Add product form
  const [pname, setPname] = useState("");
  const [cat, setCat] = useState("");
  const [spec, setSpec] = useState("");
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("");
  const [moq, setMoq] = useState("1");
  const [stock, setStock] = useState("");
  const [tiers, setTiers] = useState<PriceTier[]>([]);
  const [newCatMode, setNewCatMode] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!supplier) return;
    setAdding(true);
    setErr(null);
    try {
      let categoryId = cat;
      if (newCatMode) {
        if (!newCat.trim()) throw new Error("اكتب اسم الفئة الجديدة");
        const c = await addCategory(newCat);
        categoryId = c.id;
        qc.invalidateQueries({ queryKey: ["categories"] });
      }
      if (!categoryId) throw new Error("اختر الفئة");
      let imageUrl: string | null = null;
      if (image) imageUrl = await uploadProductImage(image);
      await addProductOffer({
        supplierId: supplier.id,
        name: pname,
        categoryId,
        spec,
        unit,
        price: Number(price),
        moq: Number(moq),
        stock: stock.trim() === "" ? null : Math.max(0, Number(stock) || 0),
        priceTiers: cleanTiers(tiers).length ? cleanTiers(tiers) : null,
        imageUrl,
      });
      setPname("");
      setSpec("");
      setUnit("");
      setPrice("");
      setMoq("1");
      setStock("");
      setTiers([]);
      setNewCat("");
      setNewCatMode(false);
      setImage(null);
      refetch();
    } catch (e: any) {
      setErr(e.message ?? "تعذّر الحفظ");
    } finally {
      setAdding(false);
    }
  }

  if (sl) return <div className="p-10 text-center">جاري التحميل…</div>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-2xl md:text-3xl font-extrabold">لوحة المورّد</h1>

        {!supplier ? (
          <div className="mt-6 rounded-3xl bg-card border border-border p-6 max-w-2xl">
            <h2 className="font-bold text-lg">أكمل بيانات مؤسستك</h2>
            <p className="text-sm text-muted-foreground mt-1">لكي تستطيع إضافة المنتجات والعروض.</p>
            <form onSubmit={saveSupplier} className="grid md:grid-cols-2 gap-3 mt-5">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اسم المؤسسة / المتجر"
                className="md:col-span-2 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف مختصر (اختياري)"
                rows={2}
                className="md:col-span-2 resize-none rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
              />
              <input
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="المدينة"
                className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
              />
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="العنوان (الحي/الشارع)"
                className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
              />
              <input
                value={mapsUrl}
                onChange={(e) => setMapsUrl(e.target.value)}
                placeholder="رابط الموقع في خرائط قوقل"
                className="md:col-span-2 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
              />
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="رقم الهاتف"
                className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
              />
              <input
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="رقم واتساب (بدون +)"
                className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
              />
              <button className="md:col-span-2 rounded-2xl bg-primary text-primary-foreground py-3 font-bold">
                حفظ
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="mt-6 rounded-3xl bg-gradient-to-br from-primary to-teal-700 text-white p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-extrabold">{supplier.name}</h2>
                    {supplier.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
                        <BadgeCheck className="h-3 w-3" /> موثّق
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-white/90 mt-2 flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {supplier.city}
                    </span>
                    <Rating value={Number(supplier.rating)} count={supplier.reviews_count} />
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> عضو منذ {supplier.joined_year}
                    </span>
                  </div>
                </div>
                <Link
                  to="/product/$id"
                  params={{ id: myProducts[0]?.product.id ?? "" }}
                  className="hidden"
                />
              </div>
            </div>

            <details className="mt-4 rounded-3xl bg-card border border-border p-5">
              <summary className="cursor-pointer font-bold text-sm">تعديل بيانات المتجر</summary>
              <form onSubmit={saveSupplier} className="grid md:grid-cols-2 gap-3 mt-4">
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اسم المؤسسة / المتجر"
                  className="md:col-span-2 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف مختصر (اختياري)"
                  rows={2}
                  className="md:col-span-2 resize-none rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
                />
                <input
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="المدينة"
                  className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
                />
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="العنوان (الحي/الشارع)"
                  className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
                />
                <input
                  value={mapsUrl}
                  onChange={(e) => setMapsUrl(e.target.value)}
                  placeholder="رابط الموقع في خرائط قوقل"
                  className="md:col-span-2 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
                />
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="رقم الهاتف"
                  className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
                />
                <input
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="رقم واتساب (بدون +)"
                  className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
                />
                <button className="md:col-span-2 rounded-2xl bg-primary text-primary-foreground py-3 font-bold">
                  حفظ التعديلات
                </button>
              </form>
            </details>

            <div className="mt-6">
              <BulkImport supplierId={supplier.id} onDone={refetch} />
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mt-6">
              <div className="rounded-3xl bg-card border border-border p-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5" /> إضافة منتج جديد
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  ملاحظة: أدخل السعر{" "}
                  <span className="font-bold">نهائياً شاملاً ضريبة القيمة المضافة (15%)</span> — لن
                  تُضاف الضريبة مرة أخرى على العميل.
                </p>
                <form onSubmit={addProduct} className="grid grid-cols-2 gap-3 mt-4">
                  <input
                    required
                    value={pname}
                    onChange={(e) => setPname(e.target.value)}
                    placeholder="اسم المنتج"
                    className="col-span-2 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
                  />
                  <div className="flex flex-col gap-1">
                    {newCatMode ? (
                      <input
                        required
                        value={newCat}
                        onChange={(e) => setNewCat(e.target.value)}
                        placeholder="اسم الفئة الجديدة"
                        className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
                      />
                    ) : (
                      <select
                        required
                        value={cat}
                        onChange={(e) => setCat(e.target.value)}
                        className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
                      >
                        <option value="">اختر الفئة</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={() => setNewCatMode((m) => !m)}
                      className="text-[11px] font-bold text-primary self-start"
                    >
                      {newCatMode ? "اختيار فئة موجودة" : "+ فئة جديدة"}
                    </button>
                  </div>
                  <input
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="وحدة البيع (مثلاً: كرتون)"
                    className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
                  />
                  <input
                    value={spec}
                    onChange={(e) => setSpec(e.target.value)}
                    placeholder="المواصفات"
                    className="col-span-2 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
                  />
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="السعر شامل الضريبة (ر.س)"
                    title="أدخل السعر النهائي شاملاً ضريبة القيمة المضافة"
                    className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
                  />
                  <input
                    required
                    type="number"
                    min="1"
                    value={moq}
                    onChange={(e) => setMoq(e.target.value)}
                    placeholder="الحد الأدنى"
                    className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
                  />
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="الكمية المتوفرة (المخزون)"
                    title="اتركه فارغاً إذا ما تبي تتبّع المخزون. ينقص تلقائياً عند التوصيل، وتُنبَّه إذا قلّ عن 10."
                    className="col-span-2 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
                  />
                  <div className="col-span-2">
                    <PriceTiersEditor tiers={tiers} onChange={setTiers} unit={unit} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold mb-1 text-muted-foreground">
                      صورة المنتج (اختياري)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                      className="w-full text-sm file:rounded-xl file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-bold"
                    />
                  </div>
                  {err && (
                    <div className="col-span-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                      {err}
                    </div>
                  )}
                  <button
                    disabled={adding}
                    className="col-span-2 rounded-2xl bg-primary text-primary-foreground py-3 font-bold disabled:opacity-60"
                  >
                    {adding ? "..." : "حفظ المنتج"}
                  </button>
                </form>
              </div>

              <div className="rounded-3xl bg-card border border-border p-6">
                <h3 className="font-bold text-lg">منتجاتي ({myProducts.length})</h3>
                <div className="mt-4 space-y-2">
                  {myProducts.map((row) => (
                    <SupplierProductRow key={row.id} row={row} onChange={refetch} />
                  ))}
                  {myProducts.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-6">
                      لا توجد منتجات بعد.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <IncomingQuotes supplierId={supplier.id} />
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
