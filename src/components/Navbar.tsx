import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, LogIn, ShoppingCart } from "lucide-react";
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

export function Navbar() {
  const { user } = useAuth();
  const { data: roles = [] } = useQuery({
    queryKey: ["roles", user?.id],
    queryFn: () => getUserRoles(user!.id),
    enabled: !!user,
  });
  const isAdmin = roles.includes("admin");
  const isSupplier = roles.includes("supplier");
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-background/80 border-b border-border">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="shrink-0">
          <Logo />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link
            to="/"
            className="hover:text-primary transition"
            activeProps={{ className: "text-primary" }}
          >
            الرئيسية
          </Link>
          {user && (
            <>
              <Link
                to="/favorites"
                className="hover:text-primary transition"
                activeProps={{ className: "text-primary" }}
              >
                المفضّلة
              </Link>
              <Link
                to="/my-requests"
                className="hover:text-primary transition"
                activeProps={{ className: "text-primary" }}
              >
                طلباتي
              </Link>
              <Link
                to="/financing"
                className="hover:text-primary transition"
                activeProps={{ className: "text-primary" }}
              >
                شراء بالآجل
              </Link>
              {isSupplier && (
                <Link
                  to="/dashboard"
                  className="hover:text-primary transition"
                  activeProps={{ className: "text-primary" }}
                >
                  لوحة المورّد
                </Link>
              )}
              <Link
                to="/account"
                className="hover:text-primary transition"
                activeProps={{ className: "text-primary" }}
              >
                حسابي
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="hover:text-primary transition"
                  activeProps={{ className: "text-primary" }}
                >
                  الإدارة
                </Link>
              )}
            </>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <CartButton />
              <NotificationBell />
              {isSupplier && (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-sm hover:bg-secondary transition"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">لوحتي</span>
                </Link>
              )}
              <button
                onClick={() => signOut()}
                className="text-xs text-muted-foreground hover:text-foreground"
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
        </div>
      </div>
    </header>
  );
}
