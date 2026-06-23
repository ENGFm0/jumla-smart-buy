import { useEffect, useState } from "react";
import { Logo } from "./Logo";

// شاشة تحميل: شخص يحمّل كراتين على «دينة» قبل أن يفتح الموقع.
// تختفي عبر CSS (.splash) كي تظهر الصفحة حتى لو لم يعمل الجافاسكربت، ثم تُزال بالكامل.
export function Preloader() {
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRemoved(true), 2800);
    return () => clearTimeout(t);
  }, []);

  if (removed) return null;

  return (
    <div className="splash fixed inset-0 z-[100] grid place-items-center bg-background">
      <div className="flex flex-col items-center gap-6 px-6">
        <Logo size={46} />
        <TruckScene />
        <div className="flex items-center gap-1 text-sm font-bold text-muted-foreground">
          جاري التحميل
          <span className="pl-dot" style={{ animationDelay: "0s" }}>
            .
          </span>
          <span className="pl-dot" style={{ animationDelay: ".2s" }}>
            .
          </span>
          <span className="pl-dot" style={{ animationDelay: ".4s" }}>
            .
          </span>
        </div>
      </div>
    </div>
  );
}

function TruckScene() {
  return (
    <svg viewBox="0 0 260 150" width="260" height="150" className="max-w-[78vw]" role="img" aria-label="جاري التحميل">
      {/* الأرض */}
      <line x1="10" y1="126" x2="250" y2="126" stroke="#e5e7eb" strokeWidth="3" strokeLinecap="round" />

      {/* الشخص يحمّل كرتوناً */}
      <g className="pl-lift">
        {/* الكرتون المرفوع */}
        <rect x="40" y="46" width="26" height="22" rx="2" fill="#e0a86b" />
        <path d="M53 46 V68" stroke="#b9844a" strokeWidth="2" />
        <path d="M40 55 H66" stroke="#b9844a" strokeWidth="1.6" opacity="0.7" />
        {/* الذراعان */}
        <path d="M70 86 L60 66 M76 86 L66 66" stroke="#0f766e" strokeWidth="5" strokeLinecap="round" fill="none" />
      </g>
      <g>
        {/* الرأس والجسم والأرجل */}
        <circle cx="74" cy="74" r="9" fill="#0f766e" />
        <path d="M74 83 V104" stroke="#0f766e" strokeWidth="7" strokeLinecap="round" />
        <path d="M74 104 L66 124 M74 104 L82 124" stroke="#0f766e" strokeWidth="6" strokeLinecap="round" />
      </g>

      {/* الدينة (شاحنة صغيرة) */}
      <g className="pl-bob">
        {/* الكراتين المحمّلة على الصندوق (تظهر بالتتابع) */}
        <g>
          <g className="pl-box" style={{ animationDelay: "0s" }}>
            <rect x="150" y="86" width="24" height="22" rx="2" fill="#e0a86b" />
            <path d="M162 86 V108" stroke="#b9844a" strokeWidth="2" />
          </g>
          <g className="pl-box" style={{ animationDelay: ".35s" }}>
            <rect x="176" y="86" width="24" height="22" rx="2" fill="#d99a55" />
            <path d="M188 86 V108" stroke="#b9844a" strokeWidth="2" />
          </g>
          <g className="pl-box" style={{ animationDelay: ".7s" }}>
            <rect x="163" y="64" width="24" height="22" rx="2" fill="#e7b277" />
            <path d="M175 64 V86" stroke="#b9844a" strokeWidth="2" />
          </g>
        </g>

        {/* هيكل الدينة */}
        <rect x="146" y="108" width="86" height="6" rx="3" fill="#0d7d6b" />
        <rect x="146" y="100" width="62" height="10" rx="2" fill="#10b981" />
        {/* الكابينة */}
        <path d="M208 100 V80 H226 L234 100 Z" fill="#10b981" />
        <rect x="212" y="84" width="14" height="12" rx="2" fill="#bdeede" />
      </g>

      {/* العجلات */}
      <g>
        <circle cx="166" cy="116" r="12" fill="#1f2937" />
        <circle cx="166" cy="116" r="5" fill="#9ca3af" />
        <g className="pl-wheel">
          <path d="M166 109 V123 M159 116 H173" stroke="#4b5563" strokeWidth="2" />
        </g>
      </g>
      <g>
        <circle cx="218" cy="116" r="12" fill="#1f2937" />
        <circle cx="218" cy="116" r="5" fill="#9ca3af" />
        <g className="pl-wheel">
          <path d="M218 109 V123 M211 116 H225" stroke="#4b5563" strokeWidth="2" />
        </g>
      </g>
    </svg>
  );
}
