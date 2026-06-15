import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "الشروط والأحكام — مدد" }] }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-10 flex-1 max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-6">الشروط والأحكام</h1>
        <div className="space-y-5 text-sm leading-7 text-muted-foreground">
          <p>
            مرحباً بك في منصة «مدد» للبيع بالجملة (B2B). باستخدامك للمنصة فإنك توافق على هذه الشروط.
          </p>
          <Section title="1. طبيعة المنصة">
            مدد وسيط يربط الموردين بأصحاب المحلات والمطاعم لعرض المنتجات ومقارنة الأسعار وإتمام
            الطلبات. مدد ليست طرفاً في عقد البيع بين المورّد والمشتري.
          </Section>
          <Section title="2. الحسابات">
            يلتزم المستخدم بتقديم بيانات صحيحة وتحديثها، وهو مسؤول عن سرية حسابه وكل ما يتم من
            خلاله.
          </Section>
          <Section title="3. الطلبات والأسعار">
            الأسعار المعروضة تقديرية ويعتمدها المورّد عند التسعير. يتحمّل المورّد دقّة بيانات
            منتجاته، ويتحمّل المشتري صحة بيانات طلبه.
          </Section>
          <Section title="4. الدفع والفواتير">
            تتم عمليات الدفع والاتفاق على آليتها بين الطرفين، وتُحتسب ضريبة القيمة المضافة وفق
            الأنظمة المعمول بها في المملكة العربية السعودية.
          </Section>
          <Section title="5. التوصيل">
            يتفق الطرفان على تفاصيل التوصيل والشحن. مدد غير مسؤولة عن التأخير أو الأضرار الناتجة عن
            عملية الشحن.
          </Section>
          <Section title="6. المحتوى والسلوك">
            يُمنع نشر محتوى مخالف للأنظمة أو مضلّل، ويحق لمدد تعليق أي حساب يخالف الشروط.
          </Section>
          <Section title="7. حدود المسؤولية">
            تُقدَّم المنصة «كما هي»، ولا تتحمّل مدد مسؤولية النزاعات بين الموردين والمشترين، مع
            سعيها للمساعدة في حلّها.
          </Section>
          <Section title="8. التعديلات">
            يحق لمدد تعديل هذه الشروط، ويُعدّ استمرار الاستخدام موافقةً على التعديلات.
          </Section>
          <p>لأي استفسار تواصل معنا عبر بيانات التواصل في المنصة.</p>
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
