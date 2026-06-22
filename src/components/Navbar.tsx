import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LogIn, ShoppingCart, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { NotificationBell } from "./NotificationBell";
import { useAuth, signOut, getUserRoles } from "@/lib/auth";
import { useCart } from "@/lib/cart";

function CartButton() {
  const items = useCart();
  return (
    <Link
      to="/cart"
      className="relative inline-flex items-center justify-center rounded-xl border border-border p-2 hover:bg-secondary transition"
      aria-label="السلة"
    >
      <ShoppingCart className="h-4 w-4" />
      {items.length > 0 && (
        <span className="absolute -top-1.5 -left-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center">
          {items.length}
        </span>
      )}
    </Link>
  );
}

type NavLink = { to: string; label: string };

export function Navbar() {
  const { user } = useAuth();
  const { data: roles = [] } = useQuery({
    queryKey: ["roles", user?.id],
    queryFn: () => getUserRoles(user!.id),
    enabled: !!user,
  });
  const isAdmin = roles.includes("admin");
  const isSupplier = roles.includes("supplier");
  const [menuOpen, setMenuOpen] = useState(false);

  const links: NavLink[] = [{ to: "/", label: "الرئيسية" }];
  if (user) {
    if (isSupplier) {
      // المورّد: الطلبات الواردة + لوحته (بدون مفضّلة/طلباتي/شراء بالآجل)
      links.push(
        { to: "/incoming", label: "الطلبات الواردة" },
        { to: "/dashboard", label: "لوحة المورّد" },
      );
    } else {
      links.push(
        { to: "/favorites", label: "المفضّلة" },
        { to: "/my-requests", label: "طلباتي" },
        { to: "/financing", label: "شراء بالآجل" },
      );
    }
    links.push({ to: "/account", label: "حسابي" });
    if (isAdmin) links.push({ to: "/admin", label: "الإدارة" });
  }

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-background/80 border-b border-border">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="shrink-0" onClick={() => setMenuOpen(false)}>
          <Logo />
        </Link>

        {/* تنقّل سطح المكتب */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="hover:text-primary transition"
              activeProps={{ className: "text-primary font-bold" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <CartButton />
              <NotificationBell />
              <button
                onClick={() => signOut()}
                className="hidden sm:inline text-xs text-muted-foreground hover:text-foreground"
              >
                خروج
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-sm hover:bg-secondary transition"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">دخول</span>
            </Link>
          )}

          {/* زر قائمة الجوال */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center rounded-xl border border-border p-2 hover:bg-secondary transition"
            aria-label="القائمة"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* قائمة الجوال المنسدلة */}
      {menuOpen && (
        <nav className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
          <div className="container mx-auto px-4 py-2 flex flex-col">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-bold text-muted-foreground hover:bg-secondary hover:text-primary transition"
                activeProps={{ className: "text-primary bg-brand-soft" }}
                activeOptions={{ exact: l.to === "/" }}
              >
                {l.label}
              </Link>
            ))}
            {user && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                className="text-right rounded-xl px-3 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 transition"
              >
                تسجيل الخروج
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
