import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-16">
      <div className="container mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <Logo />
        <p className="text-sm text-muted-foreground text-center">
          منصة مدد &copy; {new Date().getFullYear()} — قارن أسعار الجملة واطلب من الأوفر لك.
        </p>
      </div>
    </footer>
  );
}