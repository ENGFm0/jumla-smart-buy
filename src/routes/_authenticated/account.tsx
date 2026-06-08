import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth, signOut } from "@/lib/auth";
import { getMyProfile, updateMyProfile } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "حسابي — مدد" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = useAuth();
  const { data: profile } = useQuery({ queryKey: ["my-profile"], queryFn: getMyProfile });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setDone(false);
    try {
      await updateMyProfile({ fullName, phone });
      setDone(true);
    } catch (err: any) {
      setError(err.message ?? "تعذّر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-6">حسابي</h1>
        <div className="max-w-md rounded-3xl bg-card border border-border p-6">
          <div className="text-sm text-muted-foreground mb-4">
            البريد: <span className="font-bold text-foreground">{user?.email}</span>
          </div>
          <form onSubmit={save} className="space-y-3">
            <div>
              <label className="block text-sm font-bold mb-1">الاسم الكامل</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">رقم الجوال</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثلاً: 05XXXXXXXX"
                className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
              />
            </div>
            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
                {error}
              </div>
            )}
            {done && (
              <div className="inline-flex items-center gap-1 text-emerald-600 text-sm font-bold">
                <CheckCircle2 className="h-4 w-4" /> تم الحفظ
              </div>
            )}
            <button
              disabled={saving}
              className="w-full rounded-2xl bg-primary text-primary-foreground py-3 font-bold disabled:opacity-60"
            >
              {saving ? "..." : "حفظ التغييرات"}
            </button>
          </form>
          <button
            onClick={() => signOut()}
            className="mt-4 text-sm text-rose-600 hover:underline"
          >
            تسجيل الخروج
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
