import { formatSAR } from "@/types";

export type InvoiceData = {
  invoiceNumber: string | null;
  date: string | null;
  supplier: { name?: string | null; city?: string | null; phone?: string | null };
  buyer: { name?: string | null; city?: string | null; phone?: string | null };
  productName: string;
  unitLabel?: string | null;
  quantity: number;
  unitPrice: number;
};

function fmtDate(d: string | null): string {
  if (!d) return "";
  try {
    return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(d));
  } catch {
    return "";
  }
}

// يفتح نافذة بفاتورة منسّقة ويطبعها مباشرة (RTL/عربي)
export function printInvoice(d: InvoiceData) {
  const total = d.unitPrice * d.quantity;
  const net = total / 1.15;
  const vat = total - net;
  const row = (a: string, b: string) =>
    `<div class="row"><span class="muted">${a}</span><span class="bold">${b}</span></div>`;

  const html = `<!doctype html>
<html dir="rtl" lang="ar"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>فاتورة ${d.invoiceNumber ?? ""}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Cairo','Segoe UI',system-ui,sans-serif; color:#1f2937; padding:28px; max-width:760px; margin:auto; }
  .head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #10b981; padding-bottom:14px; }
  .brand { font-size:24px; font-weight:800; color:#0f766e; }
  .sub { color:#6b7280; font-size:12px; margin-top:2px; }
  .inv { text-align:left; }
  .inv .n { font-weight:800; font-size:16px; }
  .grid { display:flex; gap:20px; margin:18px 0; }
  .box { flex:1; border:1px solid #e5e7eb; border-radius:12px; padding:12px; }
  .label { font-size:11px; color:#6b7280; margin-bottom:4px; }
  table { width:100%; border-collapse:collapse; margin-top:8px; font-size:14px; }
  th,td { padding:10px 8px; }
  thead th { color:#6b7280; font-size:12px; text-align:right; border-bottom:1px solid #e5e7eb; }
  td.c { text-align:center; } td.l { text-align:left; }
  .totals { margin-top:10px; border-top:1px solid #e5e7eb; padding-top:10px; }
  .row { display:flex; justify-content:space-between; padding:3px 0; font-size:14px; }
  .muted { color:#6b7280; } .bold { font-weight:700; }
  .grand { border-top:1px solid #e5e7eb; margin-top:6px; padding-top:8px; font-size:18px; font-weight:800; color:#0f766e; }
  .foot { margin-top:24px; color:#9ca3af; font-size:11px; text-align:center; }
  @media print { body { padding:0; } }
</style></head>
<body>
  <div class="head">
    <div><div class="brand">منصّة مدد</div><div class="sub">فاتورة ضريبية مبسّطة</div></div>
    <div class="inv">
      <div class="label">رقم الفاتورة</div>
      <div class="n">${d.invoiceNumber ?? "—"}</div>
      <div class="sub">${fmtDate(d.date)}</div>
    </div>
  </div>

  <div class="grid">
    <div class="box">
      <div class="label">المورّد</div>
      ${row("الاسم", d.supplier.name ?? "—")}
      ${d.supplier.city ? row("المدينة", d.supplier.city) : ""}
      ${d.supplier.phone ? row("الجوال", d.supplier.phone) : ""}
    </div>
    <div class="box">
      <div class="label">المشتري</div>
      ${row("الاسم", d.buyer.name ?? "—")}
      ${d.buyer.city ? row("المدينة", d.buyer.city) : ""}
      ${d.buyer.phone ? row("الجوال", d.buyer.phone) : ""}
    </div>
  </div>

  <table>
    <thead><tr><th>المنتج</th><th>الكمية</th><th>سعر الوحدة</th><th style="text-align:left">الإجمالي</th></tr></thead>
    <tbody>
      <tr style="border-top:1px solid #e5e7eb">
        <td class="bold">${d.productName}</td>
        <td class="c">${d.quantity}${d.unitLabel ? " " + d.unitLabel : ""}</td>
        <td class="c">${formatSAR(d.unitPrice)}</td>
        <td class="l bold">${formatSAR(total)}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    ${row("المجموع قبل الضريبة", formatSAR(net))}
    ${row("ضريبة القيمة المضافة (15%)", formatSAR(vat))}
    <div class="row grand"><span>الإجمالي شامل الضريبة</span><span>${formatSAR(total)}</span></div>
  </div>

  <div class="foot">شكراً لتعاملك عبر منصّة مدد</div>
  <script>window.onload = function(){ window.print(); }</script>
</body></html>`;

  const w = window.open("", "_blank", "width=820,height=920");
  if (!w) {
    alert("فضلاً اسمح بالنوافذ المنبثقة لطباعة الفاتورة.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
