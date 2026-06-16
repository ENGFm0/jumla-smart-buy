import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeCheck, Trophy, MapPin, Lock, ShoppingCart, Check } from "lucide-react";
import { formatSAR, type OfferWithSupplier } from "@/types";
import { useAuth } from "@/lib/auth";
import { addToCart } from "@/lib/cart";
import { Rating } from "./Rating";
import { ContactButtons } from "./ContactButtons";
import { RequestQuoteDialog } from "./RequestQuoteDialog";

export function OfferRow({
  offer,
  isBest,
  minPrice,
  productId,
  productName,
  unit,
}: {
  offer: OfferWithSupplier;
  isBest: boolean;
  minPrice: number;
  productId: string;
  productName: string;
  unit?: string | null;
}) {
  const { user } = useAuth();
  const [added, setAdded] = useState(false);
  const s = offer.supplier;
  const diff = offer.price - minPrice;
  const diffPct = minPrice > 0 ? Math.round((diff / minPrice) * 100) : 0;

  function add() {
    addToCart({
      productId,
      productName,
      supplierId: s.id,
      supplierName: s.name,
      unit: unit ?? null,
      price: Number(offer.price),
      quantity: offer.moq || 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }
  return (
    <div
      className={`rounded-3xl border p-4 md:p-5 transition ${
        isBest
          ? "border-primary bg-brand-soft/40 shadow-md"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="rounded-2xl bg-primary text-primary-foreground h-12 w-12 grid place-items-center font-extrabold shrink-0">
            {user ? s.name.charAt(0) : <Lock className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {user ? (
                <Link
                  to="/supplier/$id"
                  params={{ id: s.id }}
                  className="font-bold truncate hover:text-primary transition"
                >
                  {s.name}
                </Link>
              ) : (
                <span className="font-bold text-muted-foreground">
                  مورّد (سجّل الدخول لعرض الاسم)
                </span>
              )}
              {s.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5">
                  <BadgeCheck className="h-3 w-3" /> موثّق
                </span>
              )}
              {isBest && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5">
                  <Trophy className="h-3 w-3" /> الأوفر
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {s.city}
              </span>
              <Rating value={Number(s.rating)} count={s.reviews_count} />
              <span>الحد الأدنى: {offer.moq}</span>
            </div>
          </div>
        </div>

        <div className="md:text-center">
          <div className="text-xl md:text-2xl font-extrabold tabular-nums text-primary">
            {formatSAR(Number(offer.price))}
          </div>
          {!isBest && diff > 0 && (
            <div className="text-[11px] text-rose-600 font-bold">
              +{formatSAR(diff)} ({diffPct}%) عن الأوفر
            </div>
          )}
        </div>

        <div className="md:w-56 space-y-2">
          {user ? (
            <>
              <ContactButtons
                phone={s.phone}
                whatsapp={s.whatsapp}
                message={`السلام عليكم، استفسر عن سعر "${productName}" المعروض عبر منصة مدد.`}
              />
              <RequestQuoteDialog
                productId={productId}
                supplierId={s.id}
                productName={productName}
                supplierName={s.name}
              />
              <button
                onClick={add}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-bold transition border ${
                  added
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-secondary border-border hover:bg-secondary/70"
                }`}
              >
                {added ? (
                  <>
                    <Check className="h-4 w-4" /> أُضيف للسلة
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" /> أضف للسلة
                  </>
                )}
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground px-3 py-2.5 text-sm font-bold hover:opacity-90 transition"
            >
              <Lock className="h-4 w-4" />
              سجّل الدخول للتواصل
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
