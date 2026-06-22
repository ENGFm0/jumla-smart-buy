// شعار «مَدَدْ»: الكلمة نفسها هي الشعار — حروف بالحركات بتدرّج لوني (لا رسمة منفصلة).
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <span
      className="inline-block font-black leading-none bg-gradient-to-l from-emerald-500 to-teal-700 bg-clip-text text-transparent select-none"
      style={{ fontSize: size, letterSpacing: "-0.01em" }}
      aria-label="مدد"
    >
      مَدَدْ
    </span>
  );
}
