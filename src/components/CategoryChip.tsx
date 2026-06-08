import * as Icons from "lucide-react";

export function CategoryChip({
  icon,
  name,
  count,
  active,
  onClick,
  asButton = true,
}: {
  icon?: string;
  name: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
  asButton?: boolean;
}) {
  const Icon = (icon && (Icons as any)[icon]) || Icons.Package;
  const cls = `inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition ${
    active
      ? "bg-primary text-primary-foreground border-primary shadow-md"
      : "bg-card text-foreground border-border hover:border-primary hover:text-primary"
  }`;
  const content = (
    <>
      <Icon className="h-4 w-4" />
      <span>{name}</span>
      {count != null && (
        <span className={`text-xs ${active ? "opacity-90" : "text-muted-foreground"}`}>
          ({count})
        </span>
      )}
    </>
  );
  if (!asButton) return <span className={cls}>{content}</span>;
  return (
    <button type="button" onClick={onClick} className={cls}>
      {content}
    </button>
  );
}