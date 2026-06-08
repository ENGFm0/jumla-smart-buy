import { Phone, MessageCircle } from "lucide-react";

export function ContactButtons({
  phone,
  whatsapp,
  message,
  compact = false,
}: {
  phone: string;
  whatsapp: string;
  message?: string;
  compact?: boolean;
}) {
  const waLink = `https://wa.me/${whatsapp.replace(/\D/g, "")}${
    message ? `?text=${encodeURIComponent(message)}` : ""
  }`;
  return (
    <div className={`flex gap-2 ${compact ? "" : "w-full"}`}>
      <a
        href={waLink}
        target="_blank"
        rel="noreferrer"
        className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-white px-3 py-2 text-sm font-bold hover:bg-emerald-600 transition"
      >
        <MessageCircle className="h-4 w-4" />
        واتساب
      </a>
      <a
        href={`tel:${phone}`}
        className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-sm font-bold hover:bg-secondary transition"
      >
        <Phone className="h-4 w-4" />
        اتصال
      </a>
    </div>
  );
}