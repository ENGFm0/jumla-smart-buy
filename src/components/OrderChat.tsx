import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, MessageCircle } from "lucide-react";
import { getOrderMessages, sendOrderMessage } from "@/lib/orders";

// محادثة بين المشتري والمورّد حول الطلب. تُحدّث دورياً (كل 5 ثوانٍ).
export function OrderChat({ quoteId, currentUserId }: { quoteId: string; currentUserId: string }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["order-messages", quoteId],
    queryFn: () => getOrderMessages(quoteId),
    refetchInterval: 5000,
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await sendOrderMessage(quoteId, text);
      setText("");
      qc.invalidateQueries({ queryKey: ["order-messages", quoteId] });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-background">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border text-sm font-bold">
        <MessageCircle className="h-4 w-4 text-primary" /> المحادثة
      </div>
      <div className="max-h-60 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-6">
            ابدأ المحادثة — اكتب رسالتك بالأسفل.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    mine
                      ? "bg-primary text-primary-foreground rounded-tl-sm"
                      : "bg-secondary text-foreground rounded-tr-sm"
                  }`}
                >
                  {m.body}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="flex items-center gap-2 p-2 border-t border-border">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="اكتب رسالة…"
          className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm"
        />
        <button
          disabled={sending || !text.trim()}
          className="rounded-xl bg-primary text-primary-foreground p-2 disabled:opacity-50"
          aria-label="إرسال"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
