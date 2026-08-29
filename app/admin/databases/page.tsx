"use client";

/**
 * قواعد البيانات.
 * ------------------------------------------------------------------
 * قاعدةٌ رئيسية وفروعٌ تحلّ محلَّها إن تعطّلت أو امتلأت. وكلُّها تحمل
 * النسخةَ نفسَها، فالانتقالُ بينها لا يفقد شيئاً.
 *
 * وهذه أخطر شاشة في اللوحة: الاعتمادُ الذي يُلصق هنا يفتح القاعدةَ
 * كلَّها. فهي للمالكة وحدها، ولا تُضاف قاعدةٌ قبل أن تُختبر قراءةً
 * وكتابةً، ولا يعود اعتمادٌ إلى الشاشة بعد حفظه.
 */

import { useCallback, useEffect, useState } from "react";
import { Database, Plus, Trash2, Check, Loader2, ShieldAlert, RefreshCw, Crown } from "lucide-react";
import { PageHeader, Card } from "@/components/dashboard/ui";

type Node = {
  id: string;
  name: string;
  host: string;
  role: "primary" | "branch";
  enabled: boolean;
  capacityMB: number;
  hasCredential: boolean;
  ok: boolean | null;
  error: string;
  bytes: number;
  fill: number | null;
  full: boolean;
  fromEnv: boolean;
};

const mb = (b: number) => (b / 1048576).toFixed(2);

export default function DatabasesPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [envOk, setEnvOk] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ bad?: boolean; text: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", url: "", secret: "", clientEmail: "", privateKey: "", capacityMB: 900 });

  const load = useCallback(async () => {
    const res = await fetch("/api/databases", { cache: "no-store" });
    if (!res.ok) { setMsg({ bad: true, text: "هذه الشاشة للمالكة وحدها" }); return; }
    const d = await res.json();
    setNodes(d.nodes ?? []);
    setEnvOk(Boolean(d.envConfigured));
  }, []);

  useEffect(() => { void load(); }, [load]);

  const call = async (body: Record<string, unknown>, key: string) => {
    setBusy(key);
    setMsg(null);
    const res = await fetch("/api/databases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) { setMsg({ bad: true, text: d.error || "تعذّر التنفيذ" }); return false; }
    if (d.nodes) setNodes(d.nodes);
    setMsg({ text: "تمّ" });
    return true;
  };

  return (
    <>
      <PageHeader
        title="قواعد البيانات"
        subtitle="قاعدة رئيسية وفروع تحلّ محلّها إن تعطّلت أو امتلأت"
      />

      <Card className="mb-5 border-amber-500/40 bg-amber-500/[0.06]">
        <p className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
          <ShieldAlert className="size-4" /> اقرأ قبل الإضافة
        </p>
        <ul className="mt-2 grid gap-1 text-[11px] leading-relaxed text-muted-foreground">
          <li>• كل قاعدة تحمل <b className="text-foreground">نسخةً كاملة</b> من بيانات المنصّة — فالانتقال بينها لا يفقد شيئاً.</li>
          <li>• القاعدة الجديدة تُختبر قراءةً وكتابةً قبل قبولها، وتُملأ بنسخةٍ فور إضافتها.</li>
          <li>• الكتابة تذهب للرئيسية، فإن تعطّلت أو تجاوزت ٩٢٪ من سعتها انتقلت للتالية <b className="text-foreground">تلقائياً</b>.</li>
          <li>• الاعتماد الذي تلصقه يفتح القاعدة كلّها — لا يعود إلى هذه الشاشة بعد حفظه.</li>
        </ul>
      </Card>

      {!envOk && (
        <Card className="mb-5 border-rose-500/40 bg-rose-500/[0.06]">
          <p className="text-xs font-bold text-rose-600">لا قاعدة مضبوطة في متغيّرات الاستضافة</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            تبقى قاعدةٌ واحدة على الأقلّ في البيئة مدخلاً لا يعتمد على شيء — وبدونها لا تُقرأ القائمة إن تعطّل كلُّ شيء.
          </p>
        </Card>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="font-display font-bold">
          السلسلة ({nodes.length.toLocaleString("ar-EG")})
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void call({ action: "check" }, "check")}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-border px-4 py-2 text-xs font-bold disabled:opacity-60"
          >
            {busy === "check" ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            افحص الكلّ
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-white"
          >
            <Plus className="size-4" /> قاعدة جديدة
          </button>
        </div>
      </div>

      {msg && (
        <p className={`mb-4 rounded-2xl px-4 py-2.5 text-xs font-bold ${
          msg.bad ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-600"
        }`}>
          {msg.text}
        </p>
      )}

      {open && (
        <Card className="mb-5 grid gap-3">
          <p className="font-display font-bold">إضافة قاعدة</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="اسمٌ للتمييز" value={f.name} onChange={(v) => setF({ ...f, name: v })} placeholder="فرع ٢" />
            <Field label="عنوان القاعدة" value={f.url} onChange={(v) => setF({ ...f, url: v })} placeholder="https://xxx.firebaseio.com" mono />
            <Field label="سرّ القاعدة (الأبسط)" value={f.secret} onChange={(v) => setF({ ...f, secret: v })} placeholder="Database secret" mono />
            <Field label="السعة (ميجابايت)" value={String(f.capacityMB)} onChange={(v) => setF({ ...f, capacityMB: Number(v) || 0 })} />
            <Field label="بريد حساب الخدمة (بديل للسرّ)" value={f.clientEmail} onChange={(v) => setF({ ...f, clientEmail: v })} mono />
            <Field label="المفتاح الخاص (بديل للسرّ)" value={f.privateKey} onChange={(v) => setF({ ...f, privateKey: v })} mono />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy !== null || !f.url.trim()}
              onClick={async () => {
                const ok = await call({ action: "add", ...f }, "add");
                if (ok) { setOpen(false); setF({ name: "", url: "", secret: "", clientEmail: "", privateKey: "", capacityMB: 900 }); }
              }}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60"
            >
              {busy === "add" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              اختبر وأضف
            </button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-2xl border border-border px-4 py-2.5 text-xs font-bold">
              إلغاء
            </button>
          </div>
        </Card>
      )}

      <div className="grid gap-3">
        {nodes.map((n) => (
          <Card key={n.id} className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                n.role === "primary" ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                <Database className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <b className="truncate text-sm font-bold">{n.name}</b>
                  {n.role === "primary" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-bold text-primary">
                      <Crown className="size-3" /> رئيسية
                    </span>
                  )}
                  {n.fromEnv && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">من الاستضافة</span>
                  )}
                  {n.full && (
                    <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-500">ممتلئة</span>
                  )}
                </span>
                <span className="block font-mono text-[10px] text-muted-foreground">{n.host}…</span>
              </span>

              <span className="mr-auto flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                  n.ok === false ? "bg-rose-500/15 text-rose-500"
                    : n.ok === true ? "bg-emerald-500/15 text-emerald-600"
                      : "bg-muted text-muted-foreground"
                }`}>
                  <span className={`size-1.5 rounded-full ${
                    n.ok === false ? "bg-rose-500" : n.ok === true ? "bg-emerald-500" : "bg-muted-foreground/50"
                  }`} />
                  {n.ok === false ? "معطّلة" : n.ok === true ? "تعمل" : "لم تُفحص"}
                </span>
                {!n.hasCredential && (
                  <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold text-amber-600">بلا اعتماد</span>
                )}
              </span>
            </div>

            {/* الامتلاء */}
            {n.fill !== null && (
              <div className="flex items-center gap-3">
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className={`block h-full rounded-full ${n.fill > 92 ? "bg-rose-500" : n.fill > 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.max(2, n.fill)}%` }}
                  />
                </span>
                <span className="shrink-0 text-[10px] font-bold text-muted-foreground">
                  {mb(n.bytes)} من {n.capacityMB.toLocaleString("ar-EG")} م.ب ({n.fill.toLocaleString("ar-EG")}٪)
                </span>
              </div>
            )}

            {n.error && <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-[11px] text-rose-500">{n.error}</p>}

            <div className="flex flex-wrap items-center gap-2">
              {n.role !== "primary" && (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void call({ action: "promote", id: n.id }, `p-${n.id}`)}
                  className="rounded-xl border border-border px-3 py-1.5 text-[11px] font-bold transition hover:border-primary/50 disabled:opacity-60"
                >
                  اجعلها الرئيسية
                </button>
              )}
              <button
                type="button"
                disabled={busy !== null || n.fromEnv}
                onClick={() => void call({ action: "patch", id: n.id, enabled: !n.enabled }, `e-${n.id}`)}
                className="rounded-xl border border-border px-3 py-1.5 text-[11px] font-bold disabled:opacity-40"
              >
                {n.enabled ? "إيقافها" : "تشغيلها"}
              </button>
              {!n.fromEnv && (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void call({ action: "remove", id: n.id }, `r-${n.id}`)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-[11px] font-bold text-muted-foreground transition hover:border-rose-500/50 hover:text-rose-500 disabled:opacity-60"
                >
                  <Trash2 className="size-3.5" /> حذف
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function Field({
  label, value, onChange, placeholder, mono,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        dir={mono ? "ltr" : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-2xl border border-border bg-card/60 px-4 py-2.5 text-sm outline-none focus:border-primary/50 ${mono ? "text-right font-mono" : ""}`}
      />
    </label>
  );
}
