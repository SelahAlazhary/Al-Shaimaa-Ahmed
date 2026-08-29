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
import { Database, Plus, Trash2, Check, Loader2, ShieldAlert, RefreshCw, Crown, ClipboardPaste, ExternalLink, BookOpen, Unlock } from "lucide-react";
import { PageHeader, Card } from "@/components/dashboard/ui";
import { DbRulesCard, rulesUrl } from "@/components/admin/db-rules";

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
  /** قواعدُها مفتوحة للعالم — تعمل، وهذا وجهُ الخطر. */
  open?: boolean;
  checkedAt?: number;
};

/** سطرٌ من تقرير الفحص. */
type Row = { id: string; name: string; ok: boolean; open: boolean; error?: string };

/** ما اكتُشف من الإعداد الملصوق قبل الإضافة. */
type Detect = {
  ok: boolean;
  projectId: string | null;
  url: string | null;
  writable: boolean | null;
  openRules: boolean;
  hasCredential: boolean;
  tried: { url: string; status: number; note: string }[];
  error?: string;
};

const mb = (b: number) => (b / 1048576).toFixed(2);

export default function DatabasesPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [envOk, setEnvOk] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ bad?: boolean; text: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", url: "", secret: "", clientEmail: "", privateKey: "", capacityMB: 900 });
  const [paste, setPaste] = useState("");
  const [detect, setDetect] = useState<Detect | null>(null);
  const [report, setReport] = useState<Row[] | null>(null);
  const [manual, setManual] = useState(false);
  const [guide, setGuide] = useState(false);

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
    /* تقريرُ الفحص يُعرض سطراً سطراً — «تمّ» وحدها لا تقول شيئاً. */
    if (d.report) setReport(d.report as Row[]);
    setMsg({
      text: d.promoted
        ? `تمّ الفحص — وتولّت «${d.promoted}» مكان الرئيسية`
        : d.openRules
          ? "أُضيفت — لكن قواعدَها مفتوحة للعالم، اقفلها"
          : "تمّ",
    });
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
            onClick={() => setGuide((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-border px-4 py-2 text-xs font-bold"
          >
            <BookOpen className="size-4" /> كيف أنشئ قاعدة؟
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

      {guide && (
        <Card className="mb-5">
          <p className="font-display mb-1 font-bold">إنشاء قاعدة بيانات جديدة — بالروابط</p>
          <p className="mb-4 text-[11px] leading-relaxed text-muted-foreground">
            كلُّ قاعدةٍ مشروعٌ مستقلٌّ في فايربيز، وله حصّتُه المجّانية الخاصّة — وهذا هو
            المقصود: مساحةٌ تُضاف لا مساحةٌ تُقتسم.
          </p>

          <ol className="grid gap-3 text-[11px] leading-relaxed">
            {([
              {
                t: "أنشئ مشروعاً جديداً",
                d: "اضغط «Add project»، سمِّه ما شئت، وتخطَّ Google Analytics — لا حاجة إليه.",
                href: "https://console.firebase.google.com/",
                label: "console.firebase.google.com",
              },
              {
                t: "أنشئ قاعدة Realtime Database",
                d: "من القائمة اليسرى: Build ← Realtime Database ← «Create Database». اختر الإقليم، وابدأ بوضع «Locked mode» — القفلُ أسلم، والاعتمادُ يفتحه لنا وحدنا.",
                href: "https://console.firebase.google.com/project/_/database",
                label: "فتح Realtime Database",
              },
              {
                t: "انسخ إعداد الويب",
                d: "Project settings ← تبويب General ← انزل إلى «Your apps» ← أضف تطبيق ويب </> ← انسخ مقطع <script> كاملاً والصقه في الصندوق أدناه.",
                href: "https://console.firebase.google.com/project/_/settings/general",
                label: "فتح Project settings",
              },
              {
                t: "انسخ حساب الخدمة (لازمٌ للقاعدة المقفلة)",
                d: "Project settings ← تبويب Service accounts ← «Generate new private key» ← يُنزَّل ملفُّ JSON. الصق محتواه في الصندوق نفسِه تحت الإعداد — يُقرأ منه البريدُ والمفتاح.",
                href: "https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk",
                label: "فتح Service accounts",
              },
              {
                t: "اعرف حدَّ خطّتك",
                d: "الخطّة المجّانية (Spark) تعطي ١ جيجابايت تخزيناً و١٠ جيجابايت تنزيلاً شهرياً لكل مشروع. اكتب السعة هنا بالميجابايت (٩٠٠ للمجّانية) لينتقل النظام للفرع التالي قبل الامتلاء.",
                href: "https://firebase.google.com/pricing",
                label: "صفحة الأسعار والحدود",
              },
            ] as const).map((x, i) => (
              <li key={x.t} className="flex gap-3 rounded-2xl border border-border p-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {(i + 1).toLocaleString("ar-EG")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{x.t}</p>
                  <p className="mt-0.5 text-muted-foreground">{x.d}</p>
                  <a
                    href={x.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 font-bold text-primary transition hover:underline"
                  >
                    <ExternalLink className="size-3.5" /> {x.label}
                  </a>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-4 rounded-2xl bg-muted/50 p-3 text-[11px] leading-relaxed text-muted-foreground">
            <b className="text-foreground">لماذا لا يكفي إعدادُ الويب وحدَه؟</b> مفتاحُ
            <code className="mx-1 rounded bg-card px-1 font-mono">apiKey</code> فيه ليس سرّاً — هو
            معرّفٌ عامٌّ يُنشر في كل صفحة ولا يفتح قاعدةً مقفلة. فإن كانت قاعدتُك في وضع
            Locked لزم معها حسابُ خدمة. وإن عملت بلا اعتماد فمعنى ذلك أنّ قواعدها مفتوحةٌ
            للعالم — وسننبّهك، فاقفلها.
          </p>
        </Card>
      )}

      {report && (
        <Card className="mb-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="font-display font-bold">تقرير الفحص</p>
            <button
              type="button"
              onClick={() => setReport(null)}
              className="text-[11px] font-bold text-muted-foreground transition hover:text-primary"
            >
              إخفاء
            </button>
          </div>
          <ul className="grid gap-2">
            {report.map((r) => (
              <li
                key={r.id}
                className={`flex flex-wrap items-center gap-2 rounded-2xl border p-2.5 text-[11px] ${
                  r.ok ? "border-emerald-500/35 bg-emerald-500/[0.05]" : "border-rose-500/40 bg-rose-500/[0.05]"
                }`}
              >
                <span className={`size-2 shrink-0 rounded-full ${r.ok ? "bg-emerald-500" : "bg-rose-500"}`} />
                <b className="text-foreground">{r.name}</b>
                <span className="text-muted-foreground">{r.ok ? "تقرأ وتكتب" : r.error || "لم تجتز الفحص"}</span>
                {r.open && (
                  <span className="mr-auto inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 font-bold text-rose-600">
                    <Unlock className="size-3" /> قواعدها مفتوحة للعالم
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
            الفحصُ يقرأ ويكتب فعلاً ويقرأ حالةَ الردّ نفسَها — لا يكتفي بوصول الطلب. وإن سقطت
            الرئيسيةُ أو امتلأت تولّى فرعٌ سليمٌ مكانَها هنا وفوراً، ويُسجَّل ذلك في سجلّ الأمان.
          </p>
        </Card>
      )}

      {guide && (
        <Card className="mb-5">
          <DbRulesCard hosts={nodes.filter((n) => !n.fromEnv).map((n) => ({ id: n.id, name: n.name, host: n.host }))} />
        </Card>
      )}

      {open && (
        <Card className="mb-5 grid gap-3">
          <p className="font-display font-bold">إضافة قاعدة</p>

          {/*
            المدخلُ الأوّل هو اللصق: الأدمن لا يحفظ عنوان قاعدته ولا يعرف
            إقليمَها، وما بين يديه هو ما يعطيه إيّاه كونسول فايربيز.
          */}
          <div>
            <span className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
              <ClipboardPaste className="size-3.5" /> الصق كود قاعدة البيانات (مقطع &lt;script&gt; كما هو)
            </span>
            <textarea
              dir="ltr"
              rows={6}
              value={paste}
              onChange={(e) => { setPaste(e.target.value); setDetect(null); }}
              placeholder={'<script type="module">\n  const firebaseConfig = {\n    apiKey: "…",\n    projectId: "…"\n  };\n</script>'}
              className="w-full rounded-2xl border border-border bg-card/60 p-3 font-mono text-[11px] leading-relaxed outline-none focus:border-primary/60"
            />
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
              الصق معه محتوى ملفّ حساب الخدمة (JSON) إن كانت قاعدتُك مقفلة — يُقرأ منه البريدُ
              والمفتاح تلقائياً. العنوانُ يُشتقّ من <code className="font-mono">projectId</code>{" "}
              وتُجرَّب أقاليمُه حتى يُعرف أيُّها يردّ.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy !== null || paste.trim().length < 10}
              onClick={async () => {
                setBusy("detect");
                setMsg(null);
                const res = await fetch("/api/databases", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "detect", paste }),
                });
                const d = await res.json().catch(() => ({}));
                setBusy(null);
                if (!res.ok) { setMsg({ bad: true, text: d.error || "تعذّر القراءة" }); return; }
                setDetect(d as Detect);
              }}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-border px-4 py-2 text-xs font-bold disabled:opacity-60"
            >
              {busy === "detect" ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              اقرأ الكود واعثر على العنوان
            </button>
            <button
              type="button"
              onClick={() => setManual((v) => !v)}
              className="rounded-2xl border border-border px-3 py-2 text-[11px] font-bold text-muted-foreground transition hover:border-primary/40 hover:text-primary"
            >
              {manual ? "إخفاء الحقول اليدوية" : "أو اكتب الحقول يدوياً"}
            </button>
          </div>

          {detect && (
            <div className={`rounded-2xl border p-3 text-[11px] leading-relaxed ${
              detect.ok ? "border-emerald-500/40 bg-emerald-500/[0.06]" : "border-rose-500/40 bg-rose-500/[0.06]"
            }`}>
              {detect.ok ? (
                <>
                  <p className="font-bold text-emerald-700 dark:text-emerald-400">
                    وجدتُها — تقرأ وتكتب.
                  </p>
                  <p dir="ltr" className="mt-1 break-all font-mono text-[10px] text-muted-foreground">{detect.url}</p>
                  {detect.openRules && (
                    <p className="mt-2 flex items-start gap-1.5 font-bold text-amber-700 dark:text-amber-400">
                      <Unlock className="mt-0.5 size-3.5 shrink-0" />
                      قواعدُها مفتوحة: كُتب فيها بلا اعتماد. أيُّ أحدٍ يعرف العنوان يقرأ بيانات
                      الطلاب ويكتب فيها — اقفلها من Rules في كونسول فايربيز، وأضف حسابَ خدمة.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-bold text-rose-600">{detect.error}</p>
                  {detect.tried.length > 0 && (
                    <ul dir="ltr" className="mt-2 grid gap-0.5 font-mono text-[10px] text-muted-foreground">
                      {detect.tried.map((t) => (
                        <li key={t.url} className="break-all">
                          {t.status || "—"} · {t.url}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="اسمٌ للتمييز" value={f.name} onChange={(v) => setF({ ...f, name: v })} placeholder="فرع ٢" />
            <Field label="السعة (ميجابايت)" value={String(f.capacityMB)} onChange={(v) => setF({ ...f, capacityMB: Number(v) || 0 })} />
          </div>

          {manual && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="عنوان القاعدة" value={f.url} onChange={(v) => setF({ ...f, url: v })} placeholder="https://xxx.firebaseio.com" mono />
              <Field label="سرّ القاعدة (الأبسط)" value={f.secret} onChange={(v) => setF({ ...f, secret: v })} placeholder="Database secret" mono />
              <Field label="بريد حساب الخدمة (بديل للسرّ)" value={f.clientEmail} onChange={(v) => setF({ ...f, clientEmail: v })} mono />
              <Field label="المفتاح الخاص (بديل للسرّ)" value={f.privateKey} onChange={(v) => setF({ ...f, privateKey: v })} mono />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy !== null || (!f.url.trim() && paste.trim().length < 10)}
              onClick={async () => {
                const ok = await call({ action: "add", ...f, paste }, "add");
                if (ok) {
                  setOpen(false);
                  setPaste("");
                  setDetect(null);
                  setF({ name: "", url: "", secret: "", clientEmail: "", privateKey: "", capacityMB: 900 });
                }
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
                {/* المفتوحةُ تعمل — والتحذيرُ في أنّها تعمل للجميع. */}
                {n.open && (
                  <span
                    title="كُتب فيها بلا اعتماد: أيُّ أحدٍ يعرف عنوانها يقرأ ويكتب"
                    className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 text-[10px] font-bold text-rose-600"
                  >
                    <Unlock className="size-3" /> قواعدها مفتوحة
                  </span>
                )}
                {n.error && (
                  <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold text-rose-500">{n.error}</span>
                )}
                {/* بابُ القواعد بجانب القاعدة نفسِها — لا يُبحث عنه في الكونسول */}
                {!n.fromEnv && (
                  <a
                    href={rulesUrl(n.host)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] font-bold text-muted-foreground transition hover:border-primary/50 hover:text-primary"
                  >
                    <ExternalLink className="size-3" /> قواعد الأمان
                  </a>
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
