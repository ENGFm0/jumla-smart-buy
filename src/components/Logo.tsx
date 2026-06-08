export function Logo({ size = 36 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        style={{ width: size, height: size }}
        className="rounded-2xl bg-gradient-to-br from-primary to-teal-700 text-primary-foreground grid place-items-center font-extrabold shadow-md"
      >
        <span style={{ fontSize: size * 0.55 }}>م</span>
      </div>
      <span className="text-xl font-extrabold tracking-tight">مدد</span>
    </div>
  );
}