import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getNotifications, markAllRead } from "@/lib/notifications";

// وقت نسبي مختصر بالعربية
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `قبل ${h} س`;
  const d = Math.floor(h / 24);
  return `قبل ${d} يوم`;
}

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => getNotifications(20),
    enabled: !!user,
    refetchInterval: 30000,
  });

  if (!user) return null;
  const unread = items.filter((n) => !n.read).length;

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      await markAllRead();
      qc.invalidateQueries({ queryKey: ["notifications", user!.id] });
    }
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        aria-label="الإشعارات"
        className="relative inline-flex items-center justify-center h-10 w-10 rounded-xl border border-border hover:bg-secondary transition"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-rose-500 text-white text-[10px] font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 w-80 max-w-[90vw] z-50 rounded-2xl bg-card border border-border shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border font-bold text-sm">الإشعارات</div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  <BellOff className="h-8 w-8 mx-auto mb-2" />
                  لا توجد إشعارات
                </div>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      setOpen(false);
                      if (n.link) navigate({ to: n.link as string });
                    }}
                    className="w-full text-right px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/60 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-sm">{n.title}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                    {n.body && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.body}</p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
