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

      {/* العامل */}
      <g>
        {/* الأرجل */}
        <path d="M55 99 L51 127" stroke="#134e4a" strokeWidth="7" strokeLinecap="round" />
        <path d="M63 99 L67 127" stroke="#134e4a" strokeWidth="7" strokeLinecap="round" />
        {/* الأحذية */}
        <path d="M47 127 H54" stroke="#0b3b34" strokeWidth="5" strokeLinecap="round" />
        <path d="M64 127 H71" stroke="#0b3b34" strokeWidth="5" strokeLinecap="round" />
        {/* الجذع (قميص العمل) */}
        <path d="M49 76 Q49 70 55 70 H63 Q69 70 69 76 V100 H49 Z" fill="#0f766e" />
        {/* الرأس */}
        <circle cx="59" cy="60" r="9" fill="#e8b89a" />
        {/* الكاب (قبّعة) */}
        <path d="M50 56 Q59 47 68 56 Z" fill="#0d7d6b" />
        <path d="M68 56 H79" stroke="#0d7d6b" strokeWidth="3.5" strokeLinecap="round" />
        {/* الذراع الخلفية */}
        <path d="M51 81 L45 71" stroke="#e8b89a" strokeWidth="5" strokeLinecap="round" />
      </g>
      {/* الذراع الرامية (تتحرّك) */}
      <g className="pl-lift">
        <path d="M66 79 L75 57" stroke="#e8b89a" strokeWidth="5" strokeLinecap="round" fill="none" />
      </g>

      {/* العامل يرمي الكرتون مرّتين — تدخل الدينة ثم يتوقّف قبل أن تتحرّك */}
      <g className="pl-toss">
        <rect x="64" y="46" width="22" height="19" rx="2" fill="#e0a86b" />
        <path d="M75 46 V65" stroke="#b9844a" strokeWidth="2" />
        <path d="M64 55 H86" stroke="#b9844a" strokeWidth="1.5" opacity="0.6" />
      </g>

      {/* الدينة — أكثر واقعية، تتحرّك وتطلع يميناً */}
      <g className="truck-drive">
        <g className="pl-bob">
          {/* الكراتين داخل الصندوق */}
          <g className="pl-box" style={{ animationDelay: "0s" }}>
            <rect x="158" y="86" width="22" height="22" rx="2" fill="#e0a86b" />
            <path d="M169 86 V108" stroke="#b9844a" strokeWidth="2" />
          </g>
          <g className="pl-box" style={{ animationDelay: ".4s" }}>
            <rect x="182" y="86" width="22" height="22" rx="2" fill="#d99a55" />
            <path d="M193 86 V108" stroke="#b9844a" strokeWidth="2" />
          </g>
          <g className="pl-box" style={{ animationDelay: ".8s" }}>
            <rect x="170" y="64" width="22" height="22" rx="2" fill="#e7b277" />
            <path d="M181 64 V86" stroke="#b9844a" strokeWidth="2" />
          </g>

          {/* صندوق الحمولة (جدار خلفي + أرضية) */}
          <rect x="150" y="84" width="5" height="26" fill="#0d7d6b" />
          <rect x="150" y="104" width="62" height="6" fill="#0d7d6b" />
          {/* الكابينة بزجاج أمامي مائل */}
          <path d="M210 110 V86 Q210 80 216 80 H229 L245 101 V110 Z" fill="#10b981" />
          <path d="M218 84 H228 L240 100 H218 Z" fill="#bdeede" />
          <path d="M218 86 V110" stroke="#0d7d6b" strokeWidth="2" />
          {/* الشاصي والمصباح */}
          <rect x="150" y="109" width="98" height="6" rx="2" fill="#0b5f52" />
          <circle cx="244" cy="105" r="2.6" fill="#fde68a" />
        </g>

        {/* العجلات بأقواس */}
        <g>
          <path d="M160 118 a14 14 0 0 1 28 0" fill="none" stroke="#0b5f52" strokeWidth="4" />
          <circle cx="174" cy="118" r="13" fill="#1f2937" />
          <circle cx="174" cy="118" r="5" fill="#9ca3af" />
          <g className="pl-wheel">
            <path d="M174 110 V126 M166 118 H182" stroke="#4b5563" strokeWidth="2" />
          </g>
        </g>
        <g>
          <path d="M214 118 a14 14 0 0 1 28 0" fill="none" stroke="#0b5f52" strokeWidth="4" />
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
