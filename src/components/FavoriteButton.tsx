import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getFavoriteIds, addFavorite, removeFavorite } from "@/lib/favorites";

export function FavoriteButton({
  productId,
  size = "md",
}: {
  productId: string;
  size?: "sm" | "md";
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: ids = [] } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: getFavoriteIds,
    enabled: !!user,
  });
  const isFav = ids.includes(productId);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (isFav) await removeFavorite(productId);
    else await addFavorite(productId);
    qc.invalidateQueries({ queryKey: ["favorites", user.id] });
  }

  const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isFav ? "إزالة من المفضّلة" : "أضف للمفضّلة"}
      title={isFav ? "إزالة من المفضّلة" : "أضف للمفضّلة"}
      className={`${dim} grid place-items-center rounded-full border transition shrink-0 ${
        isFav
          ? "bg-rose-50 border-rose-200 text-rose-500"
          : "bg-card border-border text-muted-foreground hover:text-rose-500 hover:border-rose-200"
      }`}
    >
      <Heart className={`${icon} ${isFav ? "fill-current" : ""}`} />
    </button>
  );
}
