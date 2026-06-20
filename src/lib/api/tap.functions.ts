import { createServerFn } from "@tanstack/react-start";
import process from "node:process";
import { z } from "zod";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

// تكامل بوّابة الدفع Tap (مدى / Apple Pay / بطاقات) عبر Charge API.
// المفتاح السري TAP_SECRET_KEY يُقرأ في الخادم فقط ولا يصل للمتصفّح أبداً.
// التدفّق: إنشاء عملية دفع → تحويل المشتري لصفحة Tap → العودة لـ /pay/return →
// التحقّق من حالة العملية في الخادم → تأكيد الدفع على الطلب عبر صلاحية الخدمة.

const TAP_API = "https://api.tap.company/v2";

function tapSecret(): string {
  const key = process.env.TAP_SECRET_KEY;
  if (!key) throw new Error("TAP_SECRET_KEY غير مهيّأ في الخادم");
  return key;
}

// الإجمالي المعتمد للطلب يُحسب في الخادم من السعر المعتمد × الكمية (شامل الضريبة)
type OrderRow = {
  id: string;
  buyer_id: string;
  quoted_price: number | null;
  quantity: number;
  paid_at: string | null;
  accepted_at: string | null;
  product_id: string | null;
};

async function loadOrder(orderId: string): Promise<OrderRow | null> {
  const { data } = await supabaseAdmin
    .from("quote_requests")
    .select("id, buyer_id, quoted_price, quantity, paid_at, accepted_at, product_id")
    .eq("id", orderId)
    .maybeSingle();
  return (data as OrderRow) ?? null;
}

// إنشاء عملية دفع وإرجاع رابط صفحة الدفع المستضافة
export const createTapCharge = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      orderId: z.string().uuid(),
      origin: z.string().url(),
    }),
  )
  .handler(async ({ data }) => {
    const order = await loadOrder(data.orderId);
    if (!order) throw new Error("الطلب غير موجود");
    if (!order.accepted_at) throw new Error("لم يتم قبول العرض بعد");
    if (order.paid_at) throw new Error("سبق دفع هذا الطلب");
    const unit = Number(order.quoted_price ?? 0);
    if (!(unit > 0)) throw new Error("لا يوجد سعر معتمد للطلب");
    const amount = Math.round(unit * order.quantity * 100) / 100;

    // بيانات العميل (الاسم والبريد) من ملف المشتري + حساب المصادقة
    let firstName = "عميل";
    let email: string | undefined;
    let phone: string | undefined;
    const { data: bp } = await supabaseAdmin
      .from("buyer_profiles")
      .select("business_name, phone")
      .eq("user_id", order.buyer_id)
      .maybeSingle();
    if (bp?.business_name) firstName = bp.business_name;
    if (bp?.phone) phone = bp.phone;
    const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(order.buyer_id);
    if (userRes?.user?.email) email = userRes.user.email;

    let productName = "طلب";
    if (order.product_id) {
      const { data: p } = await supabaseAdmin
        .from("products")
        .select("name")
        .eq("id", order.product_id)
        .maybeSingle();
      if (p?.name) productName = p.name;
    }

    const body = {
      amount,
      currency: "SAR",
      customer: {
        first_name: firstName,
        ...(email ? { email } : {}),
        ...(phone ? { phone: { country_code: "966", number: phone.replace(/\D/g, "") } } : {}),
      },
      source: { id: "src_all" },
      redirect: { url: `${data.origin}/pay/return` },
      reference: { order: data.orderId },
      metadata: { order_id: data.orderId },
      description: `دفع طلب ${productName} — منصة مدد`,
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
      const msg = json.errors?.[0]?.description ?? "تعذّر بدء عملية الدفع";
      throw new Error(msg);
    }
    return { url: json.transaction.url };
  });

// التحقّق من نتيجة الدفع بعد العودة من Tap وتأكيد الطلب (موثوق من الخادم)
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
    const paid = charge.status === "CAPTURED";

    if (paid && orderId) {
      const order = await loadOrder(orderId);
      if (order && !order.paid_at) {
        const invoice =
          "INV-" +
          new Date().toISOString().slice(2, 10).replace(/-/g, "") +
          "-" +
          orderId.slice(0, 6).toUpperCase();
        await supabaseAdmin
          .from("quote_requests")
          .update({
            paid_at: new Date().toISOString(),
            invoice_number: invoice,
          })
          .eq("id", orderId)
          .is("paid_at", null);
      }
    }

    return { ok: paid, orderId, status: charge.status ?? "UNKNOWN" };
  });
