import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Paperclip, Mic, Square, X, FileText, Download } from "lucide-react";
import {
  getOrderMessages,
  sendOrderMessage,
  uploadChatAttachment,
  getChatAttachmentUrl,
} from "@/lib/orders";
import type { QuoteMessage } from "@/types";

function fmtTime(d: string): string {
  try {
    return new Intl.DateTimeFormat("ar-SA", { hour: "2-digit", minute: "2-digit" }).format(
      new Date(d),
    );
  } catch {
    return "";
  }
}

// عرض مرفق برابط موقّع (يُجلب عند الحاجة ويُخزّن مؤقتاً)
function Attachment({ msg }: { msg: QuoteMessage }) {
  const { data: url } = useQuery({
    queryKey: ["chat-url", msg.attachment_path],
    queryFn: () => getChatAttachmentUrl(msg.attachment_path!),
    enabled: !!msg.attachment_path,
    staleTime: 50 * 60 * 1000,
  });
  if (!msg.attachment_path) return null;
  if (!url) return <div className="text-xs opacity-70">جارٍ تحميل المرفق…</div>;

  if (msg.attachment_type === "audio") {
    return <audio controls src={url} className="max-w-[240px]" />;
  }
  if (msg.attachment_type === "image") {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img
          src={url}
          alt={msg.attachment_name ?? "صورة"}
          className="rounded-xl max-h-56 object-cover"
        />
      </a>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-xl bg-black/5 px-3 py-2 text-sm font-bold"
    >
      <FileText className="h-4 w-4" />
      <span className="truncate max-w-[180px]">{msg.attachment_name ?? "ملف"}</span>
      <Download className="h-4 w-4 opacity-70" />
    </a>
  );
}

export function ChatPanel({ quoteId, currentUserId }: { quoteId: string; currentUserId: string }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cancelRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["order-messages", quoteId],
    queryFn: () => getOrderMessages(quoteId),
    refetchInterval: 4000,
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["order-messages", quoteId] });

  async function sendText(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await sendOrderMessage(quoteId, { body: text });
      setText("");
      refresh();
    } finally {
      setSending(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSending(true);
    setError(null);
    try {
      const path = await uploadChatAttachment(quoteId, file, file.name);
      await sendOrderMessage(quoteId, {
        attachmentPath: path,
        attachmentType: file.type.startsWith("image/") ? "image" : "file",
        attachmentName: file.name,
      });
      refresh();
    } catch {
      setError("تعذّر رفع الملف");
    } finally {
      setSending(false);
    }
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      cancelRef.current = false;
      mr.ondataavailable = (ev) => ev.data.size > 0 && chunksRef.current.push(ev.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        setRecording(false);
        setSeconds(0);
        if (cancelRef.current || chunksRef.current.length === 0) return;
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        setSending(true);
        try {
          const path = await uploadChatAttachment(quoteId, blob, `voice-${Date.now()}.webm`);
          await sendOrderMessage(quoteId, {
            attachmentPath: path,
            attachmentType: "audio",
            attachmentName: "رسالة صوتية",
          });
          refresh();
        } catch {
          setError("تعذّر إرسال التسجيل");
        } finally {
          setSending(false);
        }
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("لم يُسمح بالوصول إلى الميكروفون");
    }
  }

  function stopRecording(cancel: boolean) {
    cancelRef.current = cancel;
    mediaRef.current?.stop();
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/30">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">
            لا توجد رسائل بعد — ابدأ المحادثة بالأسفل.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-sm ${
                    mine
                      ? "bg-primary text-primary-foreground rounded-tl-sm"
                      : "bg-card border border-border rounded-tr-sm"
                  }`}
                >
                  {m.attachment_path && (
                    <div className="mb-1">
                      <Attachment msg={m} />
                    </div>
                  )}
                  {m.body && (
                    <div className="text-sm whitespace-pre-wrap break-words">{m.body}</div>
                  )}
                  <div
                    className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                  >
                    {fmtTime(m.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <div className="px-4 py-2 text-xs text-rose-700 bg-rose-50 border-t border-rose-200">
          {error}
        </div>
      )}

      <div className="border-t border-border bg-card p-2">
        {recording ? (
          <div className="flex items-center gap-3 px-2">
            <span className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
              جارٍ التسجيل {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
            </span>
            <div className="flex-1" />
            <button
              onClick={() => stopRecording(true)}
              className="rounded-xl border border-border px-3 py-2 text-sm font-bold inline-flex items-center gap-1"
            >
              <X className="h-4 w-4" /> إلغاء
            </button>
            <button
              onClick={() => stopRecording(false)}
              className="rounded-xl bg-primary text-primary-foreground px-3 py-2 text-sm font-bold inline-flex items-center gap-1"
            >
              <Send className="h-4 w-4" /> إرسال
            </button>
          </div>
        ) : (
          <form onSubmit={sendText} className="flex items-center gap-1.5">
            <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={sending}
              className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground disabled:opacity-50"
              aria-label="إرفاق ملف"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={startRecording}
              disabled={sending}
              className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground disabled:opacity-50"
              aria-label="تسجيل صوتي"
            >
              <Mic className="h-5 w-5" />
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="اكتب رسالة…"
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
              aria-label="إرسال"
            >
              {sending ? (
                <Square className="h-5 w-5 animate-pulse" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
