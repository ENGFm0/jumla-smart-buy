import { useEffect, useState } from "react";
import { Logo } from "./Logo";

// شاشة تحميل: شخص يحمّل كراتين على «دينة» قبل أن يفتح الموقع.
// تختفي عبر CSS (.splash) كي تظهر الصفحة حتى لو لم يعمل الجافاسكربت، ثم تُزال بالكامل.
export function Preloader() {
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRemoved(true), 3600);
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
    <svg
      viewBox="0 0 280 160"
      className="w-[clamp(230px,80vw,400px)] h-auto"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="جاري التحميل"
    >
      {/* الشارع */}
      <line x1="0" y1="131" x2="280" y2="131" stroke="#d8dee6" strokeWidth="4" />
      <line className="road-line" x1="0" y1="138" x2="280" y2="138" stroke="#c2cad6" strokeWidth="3" />

      {/* الكرتون الأخير يُرمى ويسقط على الشارع */}
      <g className="pl-toss-street">
        <rect x="48" y="48" width="22" height="19" rx="2" fill="#d99a55" />
        <path d="M59 48 V67" stroke="#b9844a" strokeWidth="2" />
      </g>

      {/* العامل */}
      <g>
        <circle cx="60" cy="70" r="9" fill="#0f766e" />
        <path d="M60 79 V104" stroke="#0f766e" strokeWidth="7" strokeLinecap="round" />
        <path d="M60 104 L52 128 M60 104 L68 128" stroke="#0f766e" strokeWidth="6" strokeLinecap="round" />
      </g>
      {/* الذراعان يرفعان (يتحرّكان) */}
      <g className="pl-lift">
        <path d="M60 86 L50 60 M60 86 L70 60" stroke="#0f766e" strokeWidth="5" strokeLinecap="round" fill="none" />
      </g>

      {/* الكرتون الذي يرميه العامل نحو الدينة (يتكرّر) */}
      <g className="pl-toss">
        <rect x="48" y="48" width="24" height="20" rx="2" fill="#e0a86b" />
        <path d="M60 48 V68" stroke="#b9844a" strokeWidth="2" />
        <path d="M48 57 H72" stroke="#b9844a" strokeWidth="1.5" opacity="0.6" />
      </g>

      {/* الدينة — تتحرّك وتطلع من الشاشة في النهاية */}
      <g className="truck-drive">
        <g className="pl-bob">
          {/* الكراتين المحمّلة */}
          <g className="pl-box" style={{ animationDelay: "0s" }}>
            <rect x="156" y="86" width="24" height="22" rx="2" fill="#e0a86b" />
            <path d="M168 86 V108" stroke="#b9844a" strokeWidth="2" />
          </g>
          <g className="pl-box" style={{ animationDelay: ".4s" }}>
            <rect x="182" y="86" width="24" height="22" rx="2" fill="#d99a55" />
            <path d="M194 86 V108" stroke="#b9844a" strokeWidth="2" />
          </g>
          <g className="pl-box" style={{ animationDelay: ".8s" }}>
            <rect x="169" y="64" width="24" height="22" rx="2" fill="#e7b277" />
            <path d="M181 64 V86" stroke="#b9844a" strokeWidth="2" />
          </g>
          {/* هيكل الدينة */}
          <rect x="150" y="108" width="92" height="7" rx="3" fill="#0d7d6b" />
          <rect x="150" y="100" width="66" height="10" rx="2" fill="#10b981" />
          {/* الكابينة */}
          <path d="M216 100 V78 H236 L244 100 Z" fill="#10b981" />
          <rect x="220" y="82" width="15" height="13" rx="2" fill="#bdeede" />
        </g>

        {/* العجلات */}
        <g>
          <circle cx="174" cy="118" r="13" fill="#1f2937" />
          <circle cx="174" cy="118" r="5" fill="#9ca3af" />
          <g className="pl-wheel">
            <path d="M174 110 V126 M166 118 H182" stroke="#4b5563" strokeWidth="2" />
          </g>
        </g>
        <g>
          <circle cx="228" cy="118" r="13" fill="#1f2937" />
          <circle cx="228" cy="118" r="5" fill="#9ca3af" />
          <g className="pl-wheel">
            <path d="M228 110 V126 M220 118 H236" stroke="#4b5563" strokeWidth="2" />
          </g>
        </g>
      </g>
    </svg>
  );
}
