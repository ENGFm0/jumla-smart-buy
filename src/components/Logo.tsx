// شعار «مَدَدْ»: الكلمة نفسها هي الشعار — حروف نظيفة بخط ثقيل وتدرّج لوني (بدون رموز).
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <span
      className="inline-block font-black leading-none bg-gradient-to-l from-emerald-500 to-teal-700 bg-clip-text text-transparent select-none"
      style={{ fontSize: size, letterSpacing: "-0.01em", paddingBottom: "0.12em" }}
      aria-label="مدد"
    >
      مَدَدْ
    </span>
  );
}
