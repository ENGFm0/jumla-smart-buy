import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-16">
      <div className="container mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <Logo />
        <p className="text-sm text-muted-foreground text-center">
          منصة مدد &copy; {new Date().getFullYear()} — قارن أسعار الجملة واطلب من الأوفر لك.
        </p>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link to="/terms" className="hover:text-primary">
            الشروط والأحكام
          </Link>
          <Link to="/privacy" className="hover:text-primary">
            سياسة الخصوصية
          </Link>
          <span className="text-[11px] opacity-60">إصدار B46</span>
        </nav>
      </div>
    </footer>
  );
}
