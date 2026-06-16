import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle } from "lucide-react";
import { getCategories, bulkAddProducts, type BulkRow } from "@/lib/products";

// محلّل CSV بسيط يدعم الحقول المقتبسة بين علامتي تنصيص.
function parseCSV(text: string): string[][] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // إزالة BOM
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      cur.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\r") {
      i++;
      continue;
    }
    if (c === "\n") {
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = "";
      i++;
      continue;
    }
    field += c;
    i++;
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

const norm = (s: string) => s.trim().toLowerCase();
const HEADERS: Record<string, string[]> = {
  name: ["name", "الاسم", "المنتج", "اسم المنتج"],
  category: ["category", "الفئة", "التصنيف"],
  unit: ["unit", "الوحدة", "وحدة البيع"],
  spec: ["spec", "المواصفات", "الوصف"],
  price: ["price", "السعر"],
  moq: ["moq", "الحد الأدنى", "الحد الادنى"],
};

type Parsed = {
  valid: BulkRow[];
  errors: { line: number; reason: string }[];
};

export function BulkImport({ supplierId, onDone }: { supplierId: string; onDone: () => void }) {
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [doneCount, setDoneCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function downloadTemplate() {
    const headers = ["name", "category", "unit", "spec", "price", "moq"];
    const sample = [
      ["أرز بسمتي 5كجم", categories[0]?.name ?? "أرز وحبوب", "كرتون", "10 أكياس", "120", "5"],
      ["زيت دوار الشمس 1.5ل", categories[0]?.name ?? "زيوت", "كرتون", "12 عبوة", "95", "3"],
    ];
    const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const csv = "﻿" + [headers, ...sample].map((r) => r.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "madad-products-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setDoneCount(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCSV(String(reader.result));
        if (rows.length < 2) {
          setError("الملف فارغ أو لا يحتوي بيانات.");
          setParsed(null);
          return;
        }
        const header = rows[0].map(norm);
        const col = (key: string) => header.findIndex((h) => HEADERS[key].includes(h));
        const ci = {
          name: col("name"),
          category: col("category"),
          unit: col("unit"),
          spec: col("spec"),
          price: col("price"),
          moq: col("moq"),
        };
        if (ci.name < 0 || ci.price < 0 || ci.category < 0) {
          setError("أعمدة ناقصة. لازم على الأقل: name و category و price (نزّل القالب).");
          setParsed(null);
          return;
        }
        const catMap = new Map<string, string>();
        for (const c of categories) {
          catMap.set(norm(c.name), c.id);
          catMap.set(norm(c.id), c.id);
        }
        const valid: BulkRow[] = [];
        const errors: { line: number; reason: string }[] = [];
        for (let r = 1; r < rows.length; r++) {
          const row = rows[r];
          const name = (row[ci.name] ?? "").trim();
          const catRaw = (row[ci.category] ?? "").trim();
          const priceRaw = (row[ci.price] ?? "").replace(/[^\d.]/g, "");
          const price = Number(priceRaw);
          const moqRaw = ci.moq >= 0 ? (row[ci.moq] ?? "").replace(/[^\d]/g, "") : "";
          const moq = Math.max(1, Number(moqRaw) || 1);
          const unit = (ci.unit >= 0 ? row[ci.unit] : "")?.trim() || "وحدة";
          const spec = (ci.spec >= 0 ? row[ci.spec] : "")?.trim() || "";
          const categoryId = catMap.get(norm(catRaw));
          if (!name) errors.push({ line: r + 1, reason: "اسم فارغ" });
          else if (!categoryId) errors.push({ line: r + 1, reason: `فئة غير معروفة: «${catRaw}»` });
          else if (!price || price <= 0) errors.push({ line: r + 1, reason: "سعر غير صالح" });
          else valid.push({ name, categoryId, spec, unit, price, moq });
        }
        setParsed({ valid, errors });
      } catch {
        setError("تعذّرت قراءة الملف. تأكد أنه CSV صالح.");
        setParsed(null);
      }
    };
    reader.readAsText(file, "utf-8");
  }

  async function doImport() {
    if (!parsed || parsed.valid.length === 0) return;
    setImporting(true);
    setProgress(0);
    setError(null);
    try {
      const n = await bulkAddProducts(supplierId, parsed.valid, (done, total) =>
        setProgress(Math.round((done / total) * 100)),
      );
      setDoneCount(n);
      setParsed(null);
      setFileName("");
      onDone();
    } catch (e: any) {
      setError(e.message ?? "تعذّر الاستيراد");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="rounded-3xl bg-card border border-border p-6">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <FileSpreadsheet className="h-5 w-5" /> استيراد جماعي (CSV)
      </h3>
      <p className="text-sm text-muted-foreground mt-1">
        ارفع آلاف المنتجات دفعة واحدة. نزّل القالب، عبّئه (يمكن من Excel ثم حفظ بصيغة CSV)، ثم
        ارفعه.
      </p>

      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={downloadTemplate}
          className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2.5 text-sm font-bold hover:bg-secondary"
        >
          <Download className="h-4 w-4" /> تنزيل القالب
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFile}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-bold"
        >
          <Upload className="h-4 w-4" /> اختر ملف CSV
        </button>
      </div>

      {categories.length > 0 && (
        <p className="text-xs text-muted-foreground mt-3">
          الفئات المتاحة (استخدمها في عمود category): {categories.map((c) => c.name).join(" · ")}
        </p>
      )}

      {error && (
        <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
          {error}
        </div>
      )}

      {doneCount != null && (
        <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-2 inline-flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> تم استيراد {doneCount} منتج بنجاح.
        </div>
      )}

      {parsed && (
        <div className="mt-4 space-y-3">
          <div className="text-sm">
            الملف: <span className="font-bold">{fileName}</span> — صالح:{" "}
            <span className="font-bold text-emerald-600">{parsed.valid.length}</span>
            {parsed.errors.length > 0 && (
              <>
                {" "}
                · مرفوض: <span className="font-bold text-rose-600">{parsed.errors.length}</span>
              </>
            )}
          </div>

          {parsed.errors.length > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              <div className="font-bold flex items-center gap-1 mb-1">
                <AlertTriangle className="h-3.5 w-3.5" /> صفوف مرفوضة (لن تُستورد):
              </div>
              <ul className="space-y-0.5">
                {parsed.errors.slice(0, 8).map((er, i) => (
                  <li key={i}>
                    سطر {er.line}: {er.reason}
                  </li>
                ))}
                {parsed.errors.length > 8 && <li>… و{parsed.errors.length - 8} غيرها</li>}
              </ul>
            </div>
          )}

          {parsed.valid.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden text-sm">
              <table className="w-full">
                <thead className="bg-secondary text-xs text-muted-foreground">
                  <tr>
                    <th className="text-right p-2">المنتج</th>
                    <th className="text-center p-2">الوحدة</th>
                    <th className="text-center p-2">السعر</th>
                    <th className="text-center p-2">الحد الأدنى</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.valid.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="p-2 font-bold">{r.name}</td>
                      <td className="p-2 text-center">{r.unit}</td>
                      <td className="p-2 text-center">{r.price}</td>
                      <td className="p-2 text-center">{r.moq}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsed.valid.length > 5 && (
                <div className="p-2 text-center text-xs text-muted-foreground">
                  … و{parsed.valid.length - 5} منتجات أخرى
                </div>
              )}
            </div>
          )}

          {importing ? (
            <div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1 text-center">
                جارٍ الاستيراد… {progress}%
              </div>
            </div>
          ) : (
            parsed.valid.length > 0 && (
              <button
                onClick={doImport}
                className="w-full rounded-2xl bg-primary text-primary-foreground py-3 font-bold"
              >
                استيراد {parsed.valid.length} منتج
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
