import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { signIn, signUp, signInWithProvider } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "تسجيل الدخول — مدد" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        // الدور يُختار بعد التسجيل في صفحة الإكمال
        await signUp({ email, password, fullName, phone, role: "shop_owner" });
      } else {
        await signIn(email, password);
      }
      navigate({ to: "/onboarding" });
    } catch (err: any) {
      setError(err.message ?? "حصل خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 flex-1 flex items-start justify-center">
        <div className="w-full max-w-md rounded-3xl bg-card border border-border p-6 md:p-8 shadow-sm">
          <div className="flex bg-secondary rounded-2xl p-1 mb-6">
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${mode === "signup" ? "bg-card shadow text-primary" : "text-muted-foreground"}`}
            >
              حساب جديد
            </button>
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${mode === "signin" ? "bg-card shadow text-primary" : "text-muted-foreground"}`}
            >
              تسجيل دخول
            </button>
          </div>

          <h1 className="text-2xl font-extrabold">
            {mode === "signup" ? "أنشئ حسابك في مدد" : "أهلاً بعودتك"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signup" ? "ابدأ الآن — وتختار نوع حسابك بعد التسجيل." : "سجّل دخولك للمتابعة."}
          </p>

          <form onSubmit={handle} className="mt-5 space-y-3">
            {mode === "signup" && (
              <>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="الاسم الكامل"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
                />
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="رقم الجوال"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
                />
              </>
            )}
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني"
              className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
            />
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
            />

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-primary text-primary-foreground py-3 font-bold disabled:opacity-60"
            >
              {loading ? "..." : mode === "signup" ? "إنشاء الحساب" : "دخول"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">أو</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            disabled={googleLoading}
            onClick={async () => {
              setError(null);
              setGoogleLoading(true);
              try {
                await signInWithProvider("google");
                // عند النجاح يتم التحويل لصفحة Google ثم العودة إلى /onboarding
              } catch (err: any) {
                setError(err.message ?? "تعذّر تسجيل الدخول عبر Google");
                setGoogleLoading(false);
              }
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 font-bold text-sm hover:bg-secondary transition disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
            </svg>
            المتابعة عبر Google
          </button>
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            يتطلب تفعيل مزوّد Google في إعدادات Supabase.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}