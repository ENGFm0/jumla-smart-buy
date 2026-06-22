// شعار «مَدَدْ» الحروفي: الكلمة نفسها هي التصميم — حروف متّصلة بتدرّج لوني،
// مدموج معها كرتون جملة تبرز منه ملعقة وقنينة (يجلس الاسم داخل صندوق التموين).
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 156 78"
      height={size}
      role="img"
      aria-label="مدد"
      className="block w-auto"
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="madadGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#0d7d6b" />
        </linearGradient>
      </defs>

      {/* عناصر التموين تبرز من فوق الكرتون (خلف الكلمة) */}
      {/* ملعقة */}
      <ellipse cx="60" cy="40" rx="3" ry="4" fill="#10b981" />
      <rect x="58.8" y="43" width="2.4" height="12" rx="1.2" fill="#10b981" />
      {/* قنينة */}
      <rect x="92" y="36.5" width="2.4" height="3.2" rx="0.5" fill="#0d7d6b" />
      <rect x="90" y="39.5" width="6.4" height="14" rx="2.2" fill="#0d7d6b" />

      {/* الكلمة «مدد» كحروف متّصلة بتدرّج لوني */}
      <text
        x="150"
        y="52"
        textAnchor="end"
        fontFamily="Cairo, system-ui, sans-serif"
        fontWeight={900}
        fontSize="46"
        fill="url(#madadGrad)"
        style={{ letterSpacing: "-3px" }}
      >
        مدد
      </text>

      {/* كرتون الجملة المفتوح — تجلس فيه الكلمة */}
      <path d="M30 58 L26 51 L44 55 Z" fill="url(#madadGrad)" opacity="0.85" />
      <path d="M126 58 L130 51 L112 55 Z" fill="url(#madadGrad)" opacity="0.85" />
      <path
        d="M30 58 H126 L121 75 A3 3 0 0 1 118 77 H38 A3 3 0 0 1 35 75 Z"
        fill="url(#madadGrad)"
      />
      {/* شريط الكرتون */}
      <path d="M78 58 V77" stroke="#ffffff" strokeWidth="2" opacity="0.55" strokeLinecap="round" />
      <path d="M34 64 H122" stroke="#ffffff" strokeWidth="1.5" opacity="0.4" />
    </svg>
  );
}
