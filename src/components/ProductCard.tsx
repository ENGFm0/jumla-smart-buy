import { Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { formatSAR, type ProductWithStats } from "@/types";
import { useAuth } from "@/lib/auth";
import { PriceStat } from "./PriceStat";
import { FavoriteButton } from "./FavoriteButton";

export function ProductCard({ product }: { product: ProductWithStats }) {
  const { user } = useAuth();
  const Icon = ((Icons as any)[product.icon] || Icons.Package) as typeof Icons.Package;
  const stats = product.stats;
  const savePct =
    stats && stats.max_price > 0
      ? Math.round(((stats.max_price - stats.min_price) / stats.max_price) * 100)
      : 0;
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="group block rounded-3xl bg-card border border-border hover:border-primary hover:shadow-lg transition p-5"
    >
      <div className="flex items-start gap-3">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-12 w-12 rounded-2xl object-cover shrink-0"
            loading="lazy"
          />
        ) : (
          <div className="rounded-2xl bg-brand-soft text-primary p-3 shrink-0">
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground group-hover:text-primary transition truncate">
            {product.name}
          </h3>
          {product.spec && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{product.spec}</p>
          )}
          <div className="text-xs text-muted-foreground mt-1">
            {stats?.offers_count ?? 0} عروض • الوحدة: {product.unit}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <FavoriteButton productId={product.id} size="sm" />
          {savePct > 0 && (
            <span className="rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-1">
              وفّر حتى {savePct}%
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <PriceStat variant="low" value={stats?.min_price ?? null} />
        <PriceStat variant="avg" value={stats?.avg_price ?? null} />
        <PriceStat variant="high" value={stats?.max_price ?? null} />
      </div>

      {product.cheapest_supplier && stats && (
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {user ? (
              <>
                الأوفر:{" "}
                <span className="font-bold text-foreground">{product.cheapest_supplier.name}</span> —{" "}
                {product.cheapest_supplier.city}
              </>
            ) : (
              <span className="text-muted-foreground">🔒 سجّل الدخول لعرض المورّد</span>
            )}
          </span>
          <span className="font-extrabold text-primary tabular-nums">{formatSAR(stats.min_price)}</span>
        </div>
      )}
    </Link>
  );
}
