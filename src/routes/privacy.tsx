import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "سياسة الخصوصية — مدد" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-10 flex-1 max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-6">سياسة الخصوصية</h1>
        <div className="space-y-5 text-sm leading-7 text-muted-foreground">
          <p>
            نحرص في «مدد» على حماية خصوصيتك. توضّح هذه السياسة البيانات التي نجمعها وكيفية
            استخدامها.
          </p>
          <Section title="1. البيانات التي نجمعها">
            بيانات الحساب (الاسم، الجوال، البريد)، بيانات المنشأة (اسم المتجر/المطعم، المدينة،
            العنوان)، وبيانات الطلبات والمحادثات بين الأطراف.
          </Section>
          <Section title="2. كيف نستخدم البيانات">
            لتشغيل المنصة، ومطابقة الموردين بالمشترين، ومعالجة الطلبات، وإرسال الإشعارات، وتحسين
            الخدمة.
          </Section>
          <Section title="3. مشاركة البيانات">
            تُشارك بيانات التواصل والطلب مع الطرف الآخر في الطلب فقط لإتمام التعامل. لا نبيع بياناتك
            لأطراف خارجية.
          </Section>
          <Section title="4. التخزين والأمان">
            تُخزَّن البيانات لدى مزوّدنا (Supabase) مع ضوابط وصول وصلاحيات، ومرفقات المحادثة في مخزن
            خاص يُقرأ عبر روابط مؤقتة موقّعة.
          </Section>
          <Section title="5. حقوقك">
            يمكنك تعديل بياناتك من صفحة الحساب، أو طلب حذف حسابك بالتواصل معنا.
          </Section>
          <Section title="6. التحديثات">
            قد نحدّث هذه السياسة، وسننشر أي تغييرات على هذه الصفحة.
          </Section>
          <p>لأي استفسار حول الخصوصية تواصل معنا عبر بيانات التواصل في المنصة.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-bold text-foreground mb-1">{title}</h2>
      <p>{children}</p>
    </div>
  );
}
