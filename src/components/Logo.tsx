// شعار «مَدَدْ» الحروفي: الحروف نفسها هي التصميم — الميم على شكل ملعقة،
// والدالان خطّافان ثقيلان، مع الحركات (فتحة، فتحة، سكون). تدرّج لوني واحد.
export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 138 72"
      height={size}
      role="img"
      aria-label="مدد"
      className="block w-auto"
    >
      <defs>
        <linearGradient id="madadGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#0d7d6b" />
        </linearGradient>
      </defs>

      <g
        fill="none"
        stroke="url(#madadGrad)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* الخط القاعدي الذي تتصل عليه الحروف */}
        <path d="M104 52 H40" />

        {/* الميم = ملعقة: ذيلٌ ينزل من رأس الملعقة إلى الخط القاعدي */}
        <path d="M114 30 C113 42 110 50 104 52" />

        {/* الدال الأولى (الوسطى) — خطّاف */}
        <path d="M86 33 C77 32 72 39 74 46" />

        {/* الدال الثانية (اليسرى) — خطّاف */}
        <path d="M62 33 C53 32 48 39 50 46" />
      </g>

      {/* رأس الملعقة (يشكّل دائرة الميم) */}
      <ellipse cx="116" cy="22" rx="9" ry="11" fill="url(#madadGrad)" />
      <ellipse cx="116" cy="21" rx="4" ry="5.5" fill="#ffffff" fillOpacity="0.28" />

      {/* الحركات */}
      <g stroke="url(#madadGrad)" strokeLinecap="round" fill="none">
        {/* فتحة فوق الميم */}
        <path d="M108 8 L120 5" strokeWidth="3.5" />
        {/* فتحة فوق الدال الأولى */}
        <path d="M72 17 L84 14" strokeWidth="3.5" />
        {/* سكون فوق الدال الثانية */}
        <circle cx="56" cy="16" r="3.4" strokeWidth="3" />
      </g>
    </svg>
  );
}
