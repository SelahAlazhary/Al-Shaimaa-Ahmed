"use client";

/**
 * بوّابة الدفع — طرق الدفع وطلبات التحويل وبوت تليجرام وتصميم البوّابة.
 * ------------------------------------------------------------------
 * كل ما يخصّ الدفع في شاشة واحدة: أين يُحوَّل المال، ومن حوّل، وهل
 * التحويل صحيح، وكيف تبدو البوّابة للطالب.
 */

import { useCallback, useEffect, useState } from "react";
import {
  Wallet, Plus, Trash2, Check, X, Loader2, Send, Image as ImageIcon,
  Landmark, Smartphone, Link2, CreditCard, Palette, Inbox, ShieldCheck, RotateCcw,
} from "lucide-react";
import { PageHeader, Card, StatCard, StatusBadge } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";
import { PAY_STYLES, findPayStyle, DEFAULT_PAY_STYLE, PAY_KINDS, type PayStyle } from "@/lib/pay-styles";
import { PayPreview } from "@/components/admin/skin-preview";
import { findSkin } from "@/lib/skins";
import { numberLabel, STATUS_LABEL } from "@/lib/payments";
import type { PayMethod, PayRequest, PayMethodKind } from "@/lib/types";

type Tab = "inbox" | "methods" | "bot" | "design";

const SWATCH = ["#173972", "#c9a227", "#0ea5e9", "#12b981", "#e11d48", "#7c3aed", "#f59e0b"];

const KIND_ICON: Record<string, React.ReactNode> = {
  wallet: <Smartphone className="size-4" />,
  bank: <Landmark className="size-4" />,
  instapay: <CreditCard className="size-4" />,
  fawry: <CreditCard className="size-4" />,
  link: <Link2 className="size-4" />,
  other: <Wallet className="size-4" />,
};

function TabBtn({
  active, onClick, icon, children, badge,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode; badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition ${
        active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
      }`}
    >
      {icon}
      {children}
      {badge ? (
        <span className="grid min-w-5 place-items-center rounded-full bg-rose-500 px-1.5 text-[10px] font-extrabold text-white">
          {badge.toLocaleString("ar-EG")}
        </span>
      ) : null}
    </button>
  );
}

export default function PaymentsAdmin() {
  const { db, content, saveContent, refresh, uploadImage } = useContent();
  const [tab, setTab] = useState<Tab>("inbox");
  const cfg = content.payments ?? {};
  const methods = cfg.methods ?? [];
  const requests = (db?.payments ?? []) as PayRequest[];
  const pending = requests.filter((r) => r.status === "pending");
  const skin = findSkin(content.studentSkin);
  const style = findPayStyle(cfg.style);

  const setCfg = (patch: Record<string, unknown>) => saveContent({ payments: { ...cfg, ...patch } });
  const setMethods = (list: PayMethod[]) => setCfg({ methods: list });

  return (
    <>
      <PageHeader
        title="بوّابة الدفع"
        subtitle="طرق الدفع وطلبات التحويل — يراجعها المشرف ويُصدر كود التفعيل"
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="طلبات قيد المراجعة" value={pending.length.toLocaleString("ar-EG")} icon={<Inbox className="size-5" />} tone="accent" />
        <StatCard label="طرق دفع مفعّلة" value={methods.filter((m) => m.active).length.toLocaleString("ar-EG")} icon={<Wallet className="size-5" />} index={1} />
        <StatCard
          label="حالة البوّابة"
          value={cfg.enabled ? "تعمل" : "مطفأة"}
          icon={<ShieldCheck className="size-5" />}
          tone={cfg.enabled ? "emerald" : "primary"}
          index={2}
        />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <TabBtn active={tab === "inbox"} onClick={() => setTab("inbox")} icon={<Inbox className="size-4" />} badge={pending.length}>
          الطلبات
        </TabBtn>
        <TabBtn active={tab === "methods"} onClick={() => setTab("methods")} icon={<Wallet className="size-4" />}>
          طرق الدفع ({methods.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "bot"} onClick={() => setTab("bot")} icon={<Send className="size-4" />}>
          بوت تليجرام
        </TabBtn>
        <TabBtn active={tab === "design"} onClick={() => setTab("design")} icon={<Palette className="size-4" />}>
          تصميم البوّابة ({PAY_STYLES.length.toLocaleString("ar-EG")})
        </TabBtn>
      </div>

      {tab === "inbox" && <Inbox_ requests={requests} refresh={refresh} autoCode={cfg.autoCode !== false} />}

      {tab === "methods" && (
        <MethodsTab
          cfg={cfg}
          methods={methods}
          setCfg={setCfg}
          setMethods={setMethods}
          uploadImage={uploadImage}
        />
      )}

      {tab === "bot" && <BotTab />}

      {tab === "design" && (
        <DesignTab style={style} skin={skin} cfg={cfg} setCfg={setCfg} />
      )}
    </>
  );
}

/* ================================================================== */
/*  الطلبات                                                            */
/* ================================================================== */

function Inbox_({
  requests, refresh, autoCode,
}: {
  requests: PayRequest[]; refresh: () => Promise<void>; autoCode: boolean;
}) {
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [manualCode, setManualCode] = useState<Record<string, string>>({});

  const list = requests.filter((r) => (filter === "all" ? true : r.status === filter));

  const act = async (id: string, action: "approve" | "reject", extra: Record<string, unknown> = {}) => {
    setErr(null);
    setBusy(id);
    const res = await fetch("/api/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, ...extra }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) { setErr(data.error || "تعذّر تنفيذ الإجراء"); return; }
    setRejecting(null);
    setReason("");
    await refresh();
  };

  const remove = async (id: string) => {
    setBusy(id);
    await fetch(`/api/payments?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setBusy(null);
    await refresh();
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {([
          { id: "pending" as const, label: "قيد المراجعة" },
          { id: "approved" as const, label: "مقبولة" },
          { id: "rejected" as const, label: "مرفوضة" },
          { id: "all" as const, label: "الكل" },
        ]).map((f) => {
          const n = f.id === "all" ? requests.length : requests.filter((r) => r.status === f.id).length;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-4 py-1.5 text-xs font-bold transition ${
                filter === f.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {f.label} ({n.toLocaleString("ar-EG")})
            </button>
          );
        })}
      </div>

      {err && <p className="mb-4 rounded-2xl bg-rose-500/10 px-4 py-2.5 text-sm font-bold text-rose-500">{err}</p>}

      {list.length === 0 ? (
        <Card className="py-14 text-center text-sm text-muted-foreground">لا توجد طلبات في هذا التصنيف.</Card>
      ) : (
        <div className="grid gap-4">
          {list.map((r) => (
            <Card key={r.id} className="grid gap-4 sm:grid-cols-[auto,1fr,auto] sm:items-start">
              {/* صورة الإيصال */}
              <button
                type="button"
                onClick={() => r.receipt && setZoom(r.receipt)}
                className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-muted"
              >
                {r.receipt ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.receipt} alt="إيصال التحويل" className="size-full object-cover" />
                ) : (
                  <ImageIcon className="size-6 text-muted-foreground" />
                )}
              </button>

              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <p className="font-display text-base font-extrabold">{r.student}</p>
                  <StatusBadge status={STATUS_LABEL[r.status]} />
                  {r.telegram === "failed" && (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                      لم يصل تليجرام
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {[r.phone, r.grade, r.track].filter(Boolean).join(" · ")}
                </p>
                <div className="mt-2 grid gap-1 text-xs">
                  <p><span className="text-muted-foreground">الخطة:</span> <b>{r.planName}</b>{r.subjectName ? ` — ${r.subjectName}` : ""}</p>
                  <p><span className="text-muted-foreground">المبلغ:</span> <b>{r.amount.toLocaleString("ar-EG")} ج.م</b> · {r.methodName}</p>
                  {r.senderName && <p><span className="text-muted-foreground">المُحوِّل:</span> {r.senderName}</p>}
                  {r.senderRef && <p><span className="text-muted-foreground">رقم العملية:</span> {r.senderRef}</p>}
                  {r.note && <p><span className="text-muted-foreground">ملاحظة:</span> {r.note}</p>}
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(r.at).toLocaleString("ar-EG")} · <span className="font-mono">{r.id}</span>
                  </p>
                  {r.status === "approved" && r.code && (
                    <p className="rounded-xl bg-emerald-500/10 px-2.5 py-1.5 font-mono text-sm font-bold text-emerald-600">
                      {r.code}
                    </p>
                  )}
                  {r.status === "rejected" && r.reason && (
                    <p className="text-rose-500">سبب الرفض: {r.reason}</p>
                  )}
                  {r.handledBy && (
                    <p className="text-[11px] text-muted-foreground">بواسطة {r.handledBy}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-2 sm:w-44">
                {r.status === "pending" ? (
                  rejecting === r.id ? (
                    <>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        placeholder="سبب الرفض — يصل الطالب كما هو"
                        className="w-full rounded-2xl border border-border bg-card/60 px-3 py-2 text-xs outline-none focus:border-primary/50"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busy === r.id}
                          onClick={() => act(r.id, "reject", { reason })}
                          className="flex-1 rounded-2xl bg-rose-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                        >
                          {busy === r.id ? <Loader2 className="mx-auto size-4 animate-spin" /> : "تأكيد الرفض"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setRejecting(null); setReason(""); }}
                          className="rounded-2xl border border-border px-3 py-2 text-xs font-bold"
                        >
                          إلغاء
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {!autoCode && (
                        <input
                          value={manualCode[r.id] ?? ""}
                          onChange={(e) => setManualCode({ ...manualCode, [r.id]: e.target.value })}
                          placeholder="كود التفعيل"
                          className="w-full rounded-2xl border border-border bg-card/60 px-3 py-2 text-center font-mono text-xs outline-none focus:border-primary/50"
                        />
                      )}
                      <button
                        type="button"
                        disabled={busy === r.id}
                        onClick={() => act(r.id, "approve", manualCode[r.id] ? { code: manualCode[r.id] } : {})}
                        className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-500 px-3 py-2.5 text-xs font-bold text-white disabled:opacity-60"
                      >
                        {busy === r.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                        قبول وإصدار الكود
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejecting(r.id)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-rose-500/40 px-3 py-2.5 text-xs font-bold text-rose-500"
                      >
                        <X className="size-4" /> رفض
                      </button>
                    </>
                  )
                ) : (
                  <button
                    type="button"
                    disabled={busy === r.id}
                    onClick={() => remove(r.id)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-border px-3 py-2.5 text-xs font-bold text-muted-foreground transition hover:border-rose-500/50 hover:text-rose-500"
                  >
                    <Trash2 className="size-4" /> حذف السجلّ
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* تكبير الإيصال */}
      {zoom && (
        <div
          onClick={() => setZoom(null)}
          className="fixed inset-0 z-[200] grid place-items-center bg-black/80 p-6"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="إيصال التحويل" className="max-h-[90dvh] max-w-full rounded-2xl object-contain" />
        </div>
      )}
    </>
  );
}

/* ================================================================== */
/*  طرق الدفع                                                          */
/* ================================================================== */

function MethodsTab({
  cfg, methods, setCfg, setMethods, uploadImage,
}: {
  cfg: Record<string, unknown> & { enabled?: boolean; requireReceipt?: boolean; requireSender?: boolean; autoCode?: boolean; title?: string; desc?: string; note?: string };
  methods: PayMethod[];
  setCfg: (p: Record<string, unknown>) => void;
  setMethods: (l: PayMethod[]) => void;
  uploadImage: (f: File) => Promise<string | null>;
}) {
  const [busyLogo, setBusyLogo] = useState<string | null>(null);

  const add = () => setMethods([
    ...methods,
    {
      id: `M-${Date.now().toString(36)}`,
      kind: "wallet",
      name: "فودافون كاش",
      number: "",
      active: true,
      order: methods.length,
    },
  ]);

  const patch = (id: string, p: Partial<PayMethod>) =>
    setMethods(methods.map((m) => (m.id === id ? { ...m, ...p } : m)));

  const remove = (id: string) => setMethods(methods.filter((m) => m.id !== id));

  const move = (id: string, dir: -1 | 1) => {
    const i = methods.findIndex((m) => m.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= methods.length) return;
    const next = [...methods];
    [next[i], next[j]] = [next[j], next[i]];
    setMethods(next.map((m, k) => ({ ...m, order: k })));
  };

  const pickLogo = async (id: string, file: File) => {
    setBusyLogo(id);
    const url = await uploadImage(file);
    if (url) patch(id, { logo: url });
    setBusyLogo(null);
  };

  return (
    <>
      <Card className="mb-5">
        <p className="font-display mb-1 font-bold">إعدادات البوّابة</p>
        <p className="mb-4 text-[11px] leading-relaxed text-muted-foreground">
          البوّابة مطفأة = يبقى الشراء عبر واتساب كما كان. تشغيلها يجعل الطالب
          يختار الخطة ثم طريقة الدفع ثم يرفع إيصال التحويل داخل المنصّة.
        </p>

        <div className="grid gap-3">
          <Toggle label="تشغيل بوّابة الدفع" hint="تظهر للطالب عند شراء أي كورس" on={cfg.enabled === true} onChange={(v) => setCfg({ enabled: v })} />
          <Toggle label="إلزام صورة الإيصال" hint="لا يُقبل الطلب بلا صورة تحويل" on={cfg.requireReceipt !== false} onChange={(v) => setCfg({ requireReceipt: v })} />
          <Toggle label="إلزام اسم/رقم المُحوِّل" hint="يسهّل مطابقة التحويل بكشف الحساب" on={cfg.requireSender !== false} onChange={(v) => setCfg({ requireSender: v })} />
          <Toggle label="توليد كود التفعيل تلقائياً" hint="عند القبول يُولَّد كود ويصل الطالب فوراً" on={cfg.autoCode !== false} onChange={(v) => setCfg({ autoCode: v })} />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="عنوان البوّابة" value={cfg.title ?? ""} placeholder="ادفع واستلم كود التفعيل" onChange={(v) => setCfg({ title: v })} />
          <Field label="وصف مختصر" value={cfg.desc ?? ""} placeholder="حوّل المبلغ ثم ارفع صورة التحويل" onChange={(v) => setCfg({ desc: v })} />
        </div>
        <div className="mt-3">
          <Field label="تنبيه أسفل البوّابة" value={cfg.note ?? ""} placeholder="تُراجَع التحويلات خلال ٢٤ ساعة" onChange={(v) => setCfg({ note: v })} />
        </div>
      </Card>

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="font-display font-bold">طرق الدفع</p>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-white"
        >
          <Plus className="size-4" /> طريقة جديدة
        </button>
      </div>

      {methods.length === 0 ? (
        <Card className="py-12 text-center text-sm text-muted-foreground">
          لم تُضَف طرق دفع بعد — أضف حساباً بنكياً أو رقم محفظة ليظهر للطلاب.
        </Card>
      ) : (
        <div className="grid gap-4">
          {methods.map((m, i) => (
            <Card key={m.id} className="grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  {KIND_ICON[m.kind]}
                </span>
                <select
                  value={m.kind}
                  onChange={(e) => patch(m.id, { kind: e.target.value as PayMethodKind })}
                  className="rounded-2xl border border-border bg-card/60 px-3 py-2 text-xs font-bold outline-none focus:border-primary/50"
                >
                  {PAY_KINDS.map((k) => (
                    <option key={k.id} value={k.id}>{k.label}</option>
                  ))}
                </select>
                <span className="text-[11px] text-muted-foreground">
                  {PAY_KINDS.find((k) => k.id === m.kind)?.hint}
                </span>

                <div className="mr-auto flex items-center gap-1.5">
                  <button type="button" onClick={() => move(m.id, -1)} disabled={i === 0}
                    className="rounded-xl border border-border px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-40">▲</button>
                  <button type="button" onClick={() => move(m.id, 1)} disabled={i === methods.length - 1}
                    className="rounded-xl border border-border px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-40">▼</button>
                  <button type="button" onClick={() => remove(m.id)}
                    className="rounded-xl border border-border px-2.5 py-1.5 text-muted-foreground transition hover:border-rose-500/50 hover:text-rose-500">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="اسم الطريقة" value={m.name} placeholder="فودافون كاش" onChange={(v) => patch(m.id, { name: v })} />
                <Field label="اسم صاحب الحساب" value={m.holder ?? ""} placeholder="الشيماء أحمد" onChange={(v) => patch(m.id, { holder: v })} />
                <Field label={numberLabel(m.kind)} value={m.number} placeholder="01xxxxxxxxx" mono onChange={(v) => patch(m.id, { number: v })} />
                <Field label="بيانات إضافية" value={m.extra ?? ""} placeholder="اسم البنك · الفرع · رقم الحساب" onChange={(v) => patch(m.id, { extra: v })} />
              </div>

              <Field label="تعليمات للطالب" value={m.note ?? ""} placeholder="حوّل المبلغ ثم صوّر رسالة التأكيد" onChange={(v) => patch(m.id, { note: v })} />

              <div className="flex flex-wrap items-center gap-3">
                <Toggle label="مفعّلة" hint="المعطّلة لا تظهر للطالب" on={m.active} onChange={(v) => patch(m.id, { active: v })} />

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-[11px] font-bold transition hover:border-primary/60">
                  {busyLogo === m.id ? <Loader2 className="size-3.5 animate-spin text-primary" /> : <ImageIcon className="size-3.5 text-primary" />}
                  {m.logo ? "تغيير الشعار" : "شعار (اختياري)"}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void pickLogo(m.id, f); }} />
                </label>
                {m.logo && (
                  <>
                    <span className="size-9 rounded-xl border border-border bg-cover bg-center" style={{ backgroundImage: `url(${m.logo})` }} />
                    <button type="button" onClick={() => patch(m.id, { logo: "" })}
                      className="text-[11px] font-bold text-muted-foreground hover:text-rose-500">إزالة</button>
                  </>
                )}

                <span className="ms-2 text-[11px] font-semibold text-muted-foreground">اللون:</span>
                <button type="button" onClick={() => patch(m.id, { color: "" })}
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${!m.color ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
                  الثيم
                </button>
                {SWATCH.map((c) => (
                  <button key={c} type="button" aria-label={c} onClick={() => patch(m.id, { color: c })}
                    className={`size-6 rounded-lg border transition ${m.color?.toLowerCase() === c ? "border-primary ring-2 ring-primary/40" : "border-border"}`}
                    style={{ background: c }} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

/* ================================================================== */
/*  بوت تليجرام                                                        */
/* ================================================================== */

type BotState = {
  configured: boolean;
  enabled: boolean;
  chatId: string;
  username: string;
  webhookSetAt: string;
  fromEnv: boolean;
};

function BotTab() {
  const [state, setState] = useState<BotState | null>(null);
  const [token, setToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "warn" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/telegram", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as BotState;
    setState(data);
    setChatId(data.chatId ?? "");
  }, []);

  useEffect(() => { void load(); }, [load]);

  const call = async (body: Record<string, unknown>, key: string) => {
    setBusy(key);
    setMsg(null);
    const res = await fetch("/api/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) { setMsg({ kind: "err", text: data.error || "تعذّر الاتصال بتليجرام" }); return; }
    if (data.warn) setMsg({ kind: "warn", text: data.warn });
    else setMsg({ kind: "ok", text: "تمّ" });
    setToken("");
    await load();
  };

  return (
    <>
      <Card className="mb-5">
        <p className="font-display mb-1 font-bold">بوت تليجرام</p>
        <p className="mb-4 text-[11px] leading-relaxed text-muted-foreground">
          يصلك كل طلب تحويل على تليجرام ببيانات الطالب وصورة الإيصال وزرَّي
          قبول ورفض — تبتّ فيه من هاتفك دون فتح اللوحة. التوكن يبقى على
          الخادم ولا يظهر هنا بعد حفظه.
        </p>

        <ol className="mb-4 grid gap-2 text-[12px] leading-relaxed text-muted-foreground">
          <li>١. افتح <b className="text-foreground">@BotFather</b> على تليجرام وأرسل <code className="rounded bg-muted px-1">/newbot</code> واتبع الخطوات.</li>
          <li>٢. الصق التوكن الذي يعطيك إياه في الحقل بالأسفل واحفظ.</li>
          <li>٣. افتح محادثة بوتك (أو أضفه لمجموعة) وأرسل <code className="rounded bg-muted px-1">/start</code> — سيردّ بمعرّف المحادثة.</li>
          <li>٤. الصق المعرّف هنا واضغط «إرسال رسالة اختبار».</li>
        </ol>

        {state?.configured && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-600">
            <ShieldCheck className="size-4" />
            البوت مربوط{state.username ? ` — @${state.username}` : ""}
            {state.webhookSetAt ? " · أزرار القبول والرفض تعمل" : " · الويبهوك غير مسجَّل بعد"}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label={state?.configured ? "توكن جديد (اتركه فارغاً للإبقاء على الحالي)" : "توكن البوت"}
            value={token}
            placeholder="123456789:AA..."
            mono
            onChange={setToken}
          />
          <Field label="معرّف المحادثة" value={chatId} placeholder="-1001234567890" mono onChange={setChatId} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy !== null || (!token && !state?.configured)}
            onClick={() => call({ action: "save", token, chatId }, "save")}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60"
          >
            {busy === "save" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            حفظ وربط الويبهوك
          </button>
          <button
            type="button"
            disabled={busy !== null || !state?.configured}
            onClick={() => call({ action: "test" }, "test")}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-border px-4 py-2.5 text-xs font-bold disabled:opacity-60"
          >
            {busy === "test" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            إرسال رسالة اختبار
          </button>
          {state?.configured && (
            <>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => call({ action: "toggle", enabled: !state.enabled }, "toggle")}
                className="rounded-2xl border border-border px-4 py-2.5 text-xs font-bold disabled:opacity-60"
              >
                {state.enabled ? "إيقاف التنبيهات" : "تشغيل التنبيهات"}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => call({ action: "disconnect" }, "off")}
                className="rounded-2xl border border-border px-4 py-2.5 text-xs font-bold text-muted-foreground transition hover:border-rose-500/50 hover:text-rose-500 disabled:opacity-60"
              >
                فصل البوت
              </button>
            </>
          )}
        </div>

        {msg && (
          <p className={`mt-3 rounded-2xl px-4 py-2.5 text-xs font-bold ${
            msg.kind === "ok" ? "bg-emerald-500/10 text-emerald-600"
              : msg.kind === "warn" ? "bg-amber-500/10 text-amber-600"
                : "bg-rose-500/10 text-rose-500"
          }`}>
            {msg.text}
          </p>
        )}

        {state?.fromEnv && (
          <p className="mt-3 text-[11px] text-muted-foreground">
            التوكن مضبوط من متغيّر بيئة على الاستضافة — لن يُغيّره الحفظ هنا.
          </p>
        )}
      </Card>

      <Card>
        <p className="font-display mb-2 font-bold">أوامر البوت</p>
        <ul className="grid gap-1.5 text-xs text-muted-foreground">
          <li><code className="rounded bg-muted px-1.5 py-0.5">/start</code> — يردّ بمعرّف المحادثة.</li>
          <li><code className="rounded bg-muted px-1.5 py-0.5">/id</code> — المعرّف نفسه.</li>
          <li><code className="rounded bg-muted px-1.5 py-0.5">/pending</code> — الطلبات المعلّقة.</li>
        </ul>
      </Card>
    </>
  );
}

/* ================================================================== */
/*  تصميم البوّابة                                                     */
/* ================================================================== */

function DesignTab({
  style, skin, cfg, setCfg,
}: {
  style: PayStyle;
  skin: ReturnType<typeof findSkin>;
  cfg: { colors?: { bg?: string; accent?: string; text?: string }; style?: string };
  setCfg: (p: Record<string, unknown>) => void;
}) {
  const colors = cfg.colors ?? {};
  const setColor = (p: Record<string, string>) => setCfg({ colors: { ...colors, ...p } });
  const isDefault = style.id === DEFAULT_PAY_STYLE && Object.values(colors).every((v) => !v);

  return (
    <>
      <Card className="mb-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display font-bold">ألوان البوّابة</p>
            <p className="text-[11px] text-muted-foreground">مستقلّة عن الثيم — الفارغ يرث لون المنصّة.</p>
          </div>
          <button
            type="button"
            disabled={isDefault}
            onClick={() => setCfg({ style: DEFAULT_PAY_STYLE, colors: {} })}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-border px-3 py-2 text-[11px] font-bold disabled:opacity-40"
          >
            <RotateCcw className="size-3.5" /> إعادة ضبط هذا القسم
          </button>
        </div>

        <div className="grid gap-3">
          {([
            { key: "bg", label: "خلفية البطاقات" },
            { key: "accent", label: "اللون المميّز" },
            { key: "text", label: "لون النصّ" },
          ] as const).map((row) => (
            <div key={row.key} className="flex flex-wrap items-center gap-2">
              <span className="w-32 shrink-0 text-xs font-semibold text-muted-foreground">{row.label}</span>
              <button type="button" onClick={() => setColor({ [row.key]: "" })}
                className={`rounded-full border px-3 py-1 text-[10px] font-bold transition ${
                  !colors[row.key] ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                }`}>
                الثيم
              </button>
              {SWATCH.map((c) => (
                <button key={c} type="button" aria-label={c} onClick={() => setColor({ [row.key]: c })}
                  className={`size-7 rounded-lg border transition ${
                    colors[row.key]?.toLowerCase() === c ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/50"
                  }`} style={{ background: c }} />
              ))}
              <label className="grid size-7 cursor-pointer place-items-center rounded-lg border border-dashed border-border"
                style={{ background: colors[row.key] || "transparent" }} title="لون مخصّص">
                <input type="color" className="size-0 opacity-0" value={colors[row.key] || "#173972"}
                  onChange={(e) => setColor({ [row.key]: e.target.value })} />
              </label>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {PAY_STYLES.map((x) => {
          const on = x.id === style.id;
          return (
            <button
              key={x.id}
              type="button"
              onClick={() => setCfg({ style: x.id })}
              className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition ${
                on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
              }`}
            >
              <PayPreview style={x} colors={colors} skin={skin} />
              <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{x.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                </div>
                {on && (
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                    <Check className="size-3.5" />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ================================================================== */
/*  عناصر صغيرة                                                        */
/* ================================================================== */

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
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-2xl border border-border bg-card/60 px-4 py-2.5 text-sm outline-none focus:border-primary/50 ${mono ? "font-mono" : ""}`}
      />
    </label>
  );
}

function Toggle({
  label, hint, on, onChange,
}: {
  label: string; hint?: string; on: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex items-center gap-3 rounded-2xl border border-border px-3 py-2 text-right transition hover:border-primary/40"
    >
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${on ? "bg-primary" : "bg-muted"}`}>
        <span className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${on ? "left-0.5" : "right-0.5"}`} />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold">{label}</span>
        {hint && <span className="block text-[10px] text-muted-foreground">{hint}</span>}
      </span>
    </button>
  );
}
