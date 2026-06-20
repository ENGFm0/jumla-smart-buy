import { createServerFn } from "@tanstack/react-start";
import process from "node:process";
import { z } from "zod";

// تكامل بوّابة الدفع Tap (مدى / Apple Pay / بطاقات) عبر Charge API.
// المفتاح السري TAP_SECRET_KEY يُقرأ في الخادم فقط ولا يصل المتصفّح أبداً.
// لا نحتاج صلاحية خدمة Supabase هنا: الخادم ينشئ عملية الدفع ويتحقّق من حالتها،
// والمشتري (وهو مسجّل دخوله) يثبّت الطلب «مدفوع» عبر صلاحياته العادية (RLS).

const TAP_API = "https://api.tap.company/v2";

function tapSecret(): string {
  const key = process.env.TAP_SECRET_KEY;
  if (!key) throw new Error("لم يتم تهيئة مفتاح الدفع (TAP_SECRET_KEY) في الخادم");
  return key;
}

// إنشاء عملية دفع وإرجاع رابط صفحة الدفع المستضافة
export const createTapCharge = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      orderId: z.string().uuid(),
      amount: z.number().positive(),
      origin: z.string().url(),
      email: z.string().email().optional(),
      customerName: z.string().optional(),
      description: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const body = {
      amount: Math.round(data.amount * 100) / 100,
      currency: "SAR",
      customer: {
        first_name: data.customerName || "عميل",
        ...(data.email ? { email: data.email } : {}),
      },
      source: { id: "src_all" },
      redirect: { url: `${data.origin}/pay/return` },
      reference: { order: data.orderId },
      metadata: { order_id: data.orderId },
      description: data.description || "دفع طلب — منصة مدد",
    };

    const res = await fetch(`${TAP_API}/charges`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tapSecret()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as {
      transaction?: { url?: string };
      errors?: { description?: string }[];
    };
    if (!res.ok || !json.transaction?.url) {
      throw new Error(json.errors?.[0]?.description ?? "تعذّر بدء عملية الدفع");
    }
    return { url: json.transaction.url };
  });

// التحقّق من نتيجة الدفع بعد العودة من Tap (موثوق من الخادم عبر المفتاح السري)
export const verifyTapCharge = createServerFn({ method: "POST" })
  .inputValidator(z.object({ tapId: z.string().min(3) }))
  .handler(async ({ data }) => {
    const res = await fetch(`${TAP_API}/charges/${data.tapId}`, {
      headers: { Authorization: `Bearer ${tapSecret()}` },
    });
    const charge = (await res.json()) as {
      status?: string;
      amount?: number;
      reference?: { order?: string };
      metadata?: { order_id?: string };
    };
    const orderId = charge.reference?.order ?? charge.metadata?.order_id ?? null;
    return { ok: charge.status === "CAPTURED", orderId, status: charge.status ?? "UNKNOWN" };
  });
