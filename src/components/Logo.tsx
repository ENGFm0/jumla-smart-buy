// شعار «مَدَدْ»: كرتون جملة مفتوح تبرز منه ملعقة وقنينة — يوحي بتجارة الجملة للمطاعم والمحلات.
export function Logo({ size = 38, showText = true }: { size?: number; showText?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        style={{ width: size, height: size }}
        className="rounded-2xl bg-gradient-to-br from-primary to-teal-700 grid place-items-center shadow-md shrink-0"
        aria-label="شعار مدد"
      >
        <svg
          viewBox="0 0 32 32"
          width={size * 0.66}
          height={size * 0.66}
          fill="none"
          role="img"
        >
          {/* لسانا الكرتون المفتوحان */}
          <path d="M6 13 L3.2 9 L12.6 11.2 Z" fill="#ffffff" fillOpacity="0.8" />
          <path d="M26 13 L28.8 9 L19.4 11.2 Z" fill="#ffffff" fillOpacity="0.8" />

          {/* ملعقة بارزة */}
          <ellipse cx="11.4" cy="6.6" rx="2.1" ry="2.8" fill="#ffffff" />
          <rect x="10.6" y="8.4" width="1.5" height="7" rx="0.75" fill="#ffffff" />

          {/* قنينة بارزة */}
          <rect x="17.7" y="4.9" width="1.7" height="2.3" rx="0.4" fill="#ffffff" />
          <rect x="16.4" y="6.9" width="4.2" height="8.5" rx="1.4" fill="#ffffff" />

          {/* جسم الكرتون (أمام) */}
          <path
            d="M6 13 H26 L24.4 27.1 A1.7 1.7 0 0 1 22.7 28.6 H9.3 A1.7 1.7 0 0 1 7.6 27.1 Z"
            fill="#ffffff"
          />

          {/* تفاصيل الكرتون: شريط لاصق وخط */}
          <path d="M16 13 V28.6" stroke="#0f766e" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M7 17.4 H25" stroke="#0f766e" strokeWidth="1.2" opacity="0.45" />
        </svg>
      </div>
      {showText && (
        <span className="text-xl font-extrabold tracking-tight" style={{ fontKerning: "normal" }}>
          مَدَدْ
        </span>
      )}
    </div>
  );
}
