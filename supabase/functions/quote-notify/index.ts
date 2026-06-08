// =====================================================================
// Edge Function: quote-notify
// يُستدعى من مُشغّل قاعدة البيانات عند إنشاء/تحديث طلب عرض سعر،
// فيرسل إشعار واتساب للطرف المعني عبر WhatsApp Cloud API.
//
// النشر:  supabase functions deploy quote-notify --no-verify-jwt
// الأسرار المطلوبة (supabase secrets set ...):
//   WHATSAPP_TOKEN              توكن الوصول الدائم من Meta
//   WHATSAPP_PHONE_NUMBER_ID    معرّف رقم الواتساب
//   WHATSAPP_TEMPLATE_SUPPLIER  اسم قالب إشعار المورّد (مثلاً: madad_new_quote)
//   WHATSAPP_TEMPLATE_BUYER     اسم قالب إشعار المشتري (مثلاً: madad_quote_reply)
//   WHATSAPP_LANG               لغة القالب (افتراضي: ar)
//   WEBHOOK_SECRET              سر مشترك للتحقق من أن الطلب من قاعدة بياناتنا
//   (SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY يُحقنان تلقائياً)
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GRAPH_VERSION = "v21.0";

// تحويل الرقم إلى صيغة دولية بدون + (يفترض السعودية 966)
function normalizeNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let n = raw.replace(/\D/g, "");
  if (n.startsWith("00")) n = n.slice(2);
  if (n.startsWith("966")) return n;
  if (n.startsWith("0")) return "966" + n.slice(1);
  if (n.length === 9 && n.startsWith("5")) return "966" + n;
  return n;
}

async function sendTemplate(to: string, template: string, params: string[]) {
  const token = Deno.env.get("WHATSAPP_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const lang = Deno.env.get("WHATSAPP_LANG") ?? "ar";
  if (!token || !phoneId) {
    console.error("Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID");
    return;
  }
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${phoneId}/messages`;
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: template,
      language: { code: lang },
      components: [
        {
          type: "body",
          parameters: params.map((p) => ({ type: "text", text: String(p) })),
        },
      ],
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error("WhatsApp send failed:", res.status, await res.text());
  }
}

Deno.serve(async (req) => {
  // تحقق من السر المشترك (اختياري لكن مُستحسن)
  const secret = Deno.env.get("WEBHOOK_SECRET");
  if (secret && req.headers.get("x-webhook-secret") !== secret) {
    return new Response("unauthorized", { status: 401 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response("bad request", { status: 400 });
  }

  const { type, table, record, old_record } = payload ?? {};
  if (table !== "quote_requests" || !record) {
    return new Response("ignored", { status: 200 });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // اسم المنتج (مشترك للحالتين)
  const { data: product } = await admin
    .from("products")
    .select("name")
    .eq("id", record.product_id)
    .maybeSingle();
  const productName = product?.name ?? "منتج";

  const templSupplier = Deno.env.get("WHATSAPP_TEMPLATE_SUPPLIER") ?? "madad_new_quote";
  const templBuyer = Deno.env.get("WHATSAPP_TEMPLATE_BUYER") ?? "madad_quote_reply";

  try {
    if (type === "INSERT") {
      // إشعار المورّد بطلب جديد
      const { data: supplier } = await admin
        .from("suppliers")
        .select("name, whatsapp")
        .eq("id", record.supplier_id)
        .maybeSingle();
      const to = normalizeNumber(supplier?.whatsapp);
      if (to) {
        await sendTemplate(to, templSupplier, [
          supplier?.name ?? "المورّد",
          productName,
          String(record.quantity ?? 1),
        ]);
      }
    } else if (type === "UPDATE") {
      // إشعار المشتري عند تغيّر الحالة إلى تم التسعير / مرفوض
      const statusChanged = old_record?.status !== record.status;
      if (statusChanged && (record.status === "quoted" || record.status === "rejected")) {
        const { data: buyer } = await admin
          .from("profiles")
          .select("phone")
          .eq("id", record.buyer_id)
          .maybeSingle();
        const to = normalizeNumber(buyer?.phone);
        const statusText =
          record.status === "quoted"
            ? `تم التسعير${record.quoted_price ? ` بسعر ${record.quoted_price} ر.س` : ""}`
            : "مرفوض";
        if (to) {
          await sendTemplate(to, templBuyer, [productName, statusText]);
        }
      }
    }
  } catch (e) {
    console.error("notify error:", e);
  }

  return new Response("ok", { status: 200 });
});
