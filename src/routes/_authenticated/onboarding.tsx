import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Truck, Store, MapPin } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth, getUserRoles, setPrimaryRole } from "@/lib/auth";
import { getSupplierByUserId, upsertSupplier } from "@/lib/suppliers";
import { getMyBuyerProfile, upsertBuyerProfile } from "@/lib/buyer";
import { onboardingKey } from "@/lib/onboarding";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "إكمال التسجيل — مدد" }] }),
  component: OnboardingPage,
});

const input = "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm";

function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // عند إكمال البيانات: حدّث حالة البوابة فوراً حتى لا تُعيد توجيه المستخدم
  // إلى /onboarding بناءً على نسخة مخبّأة قديمة، ثم انتقل للوجهة.
  function finish(to: "/dashboard" | "/search") {
    if (user) queryClient.setQueryData(onboardingKey(user.id), true);
    navigate({ to });
  }

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", user?.id],
    queryFn: () => getUserRoles(user!.id),
    enabled: !!user,
  });
  const isSupplier = roles.includes("supplier");

  // إن كان الملف مكتملاً، وجّه المستخدم مباشرة
  const { data: supplier, isLoading: sLoading } = useQuery({
    queryKey: ["supplier", user?.id],
    queryFn: () => getSupplierByUserId(user!.id),
    enabled: !!user && isSupplier,
  });
  const { data: buyer, isLoading: bLoading } = useQuery({
    queryKey: ["buyer-profile"],
    queryFn: getMyBuyerProfile,
    enabled: !!user && !isSupplier && !rolesLoading,
  });

  useEffect(() => {
    if (isSupplier && supplier) navigate({ to: "/dashboard" });
  }, [isSupplier, supplier, navigate]);
  useEffect(() => {
    if (!rolesLoading && !isSupplier && buyer) navigate({ to: "/search" });
  }, [rolesLoading, isSupplier, buyer, navigate]);

  // اختيار الدور (يُهيّأ من الأدوار الحالية، ويمكن تغييره)
  const [selectedRole, setSelectedRole] = useState<"supplier" | "shop_owner">("shop_owner");
  useEffect(() => {
    if (!rolesLoading) setSelectedRole(roles.includes("supplier") ? "supplier" : "shop_owner");
  }, [rolesLoading, roles]);

  const loading = rolesLoading || (isSupplier ? sLoading : bLoading);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground">جاري التحميل…</div>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold mb-1">اختر نوع حسابك</h1>
              <p className="text-sm text-muted-foreground mb-4">حدّد إن كنت مورّداً أو صاحب محل/مطعم.</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setSelectedRole("supplier")}
                  className={`rounded-2xl p-4 border text-sm font-bold flex flex-col items-center gap-1 transition ${selectedRole === "supplier" ? "border-primary bg-brand-soft text-primary" : "border-border"}`}
                >
                  <Truck className="h-6 w-6" />
                  مورّد (بائع جملة)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("shop_owner")}
                  className={`rounded-2xl p-4 border text-sm font-bold flex flex-col items-center gap-1 transition ${selectedRole === "shop_owner" ? "border-primary bg-brand-soft text-primary" : "border-border"}`}
                >
                  <Store className="h-6 w-6" />
                  صاحب محل / مطعم
                </button>
              </div>
              {selectedRole === "supplier" ? (
                <SupplierForm userId={user!.id} onDone={() => finish("/dashboard")} />
              ) : (
                <BuyerForm onDone={() => finish("/search")} />
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function SupplierForm({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [iban, setIban] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await setPrimaryRole("supplier");
      await upsertSupplier({
        userId,
        name,
        city,
        phone,
        whatsapp,
        description,
        address,
        mapsUrl,
        iban,
        bankName,
        accountHolder,
      });
      onDone();
    } catch (err: any) {
      setError(err.message ?? "تعذّر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl bg-card border border-border p-6">
      <div className="flex items-center gap-2 mb-1 text-primary">
        <Truck className="h-5 w-5" />
        <span className="text-sm font-bold">حساب مورّد</span>
      </div>
      <h1 className="text-2xl font-extrabold">جهّز متجرك</h1>
      <p className="text-sm text-muted-foreground mt-1">
        أكمل بيانات مؤسستك ليبدأ أصحاب المحلات بالعثور عليك.
      </p>
      <form onSubmit={save} className="grid md:grid-cols-2 gap-3 mt-5">
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم المؤسسة / المتجر" className={`md:col-span-2 ${input}`} />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف مختصر لنشاطك (اختياري)" rows={2} className={`md:col-span-2 resize-none ${input}`} />
        <input required value={city} onChange={(e) => setCity(e.target.value)} placeholder="المدينة" className={input} />
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="العنوان (الحي/الشارع)" className={input} />
        <input value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} placeholder="رابط الموقع في خرائط قوقل" className={`md:col-span-2 ${input}`} />
        <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="رقم الجوال" className={input} />
        <input required value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="رقم واتساب (بدون +)" className={input} />
        <div className="md:col-span-2 mt-2 rounded-2xl border border-border bg-secondary/30 p-3">
          <p className="text-sm font-bold">بيانات الحساب البنكي (لاستلام مدفوعات الطلبات)</p>
          <p className="text-[11px] text-muted-foreground mb-3">
            يحوّل المشتري المبلغ مباشرةً إلى آيبانك ويرفق إيصال التحويل، ثم تؤكّد الاستلام وتشحن. لا
            نخصم أي عمولة.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <input
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder="رقم الآيبان (SA...)"
              className={`md:col-span-2 ${input}`}
            />
            <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="اسم البنك" className={input} />
            <input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="اسم صاحب الحساب" className={input} />
          </div>
        </div>
        {error && <div className="md:col-span-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</div>}
        <button disabled={saving} className="md:col-span-2 rounded-full bg-primary text-primary-foreground py-3 font-bold hover:shadow-lg hover:shadow-primary/20 transition disabled:opacity-60">
          {saving ? "..." : "حفظ ومتابعة"}
        </button>
      </form>
    </div>
  );
}

function BuyerForm({ onDone }: { onDone: () => void }) {
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("restaurant");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await setPrimaryRole("shop_owner");
      await upsertBuyerProfile({ businessName, businessType, city, address, mapsUrl, phone });
      onDone();
    } catch (err: any) {
      setError(err.message ?? "تعذّر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl bg-card border border-border p-6">
      <div className="flex items-center gap-2 mb-1 text-primary">
        <Store className="h-5 w-5" />
        <span className="text-sm font-bold">حساب صاحب محل / مطعم</span>
      </div>
      <h1 className="text-2xl font-extrabold">عرّفنا بمنشأتك</h1>
      <p className="text-sm text-muted-foreground mt-1">
        تساعدنا هذه البيانات في تحسين تجربتك وتسهيل التواصل مع الموردين.
      </p>
      <form onSubmit={save} className="grid md:grid-cols-2 gap-3 mt-5">
        <input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="اسم المطعم / المحل" className={`md:col-span-2 ${input}`} />
        <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} className={input}>
          <option value="restaurant">مطعم</option>
          <option value="cafe">كافيه</option>
          <option value="shop">بقالة / محل</option>
          <option value="other">أخرى</option>
        </select>
        <input required value={city} onChange={(e) => setCity(e.target.value)} placeholder="المدينة" className={input} />
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="العنوان (الحي/الشارع)" className={`md:col-span-2 ${input}`} />
        <input value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} placeholder="رابط الموقع في خرائط قوقل (اختياري)" className={`md:col-span-2 ${input}`} />
        <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="رقم الجوال" className={`md:col-span-2 ${input}`} />
        {error && <div className="md:col-span-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</div>}
        <button disabled={saving} className="md:col-span-2 rounded-full bg-primary text-primary-foreground py-3 font-bold hover:shadow-lg hover:shadow-primary/20 transition disabled:opacity-60">
          {saving ? "..." : "حفظ ومتابعة"}
        </button>
      </form>
    </div>
  );
}
