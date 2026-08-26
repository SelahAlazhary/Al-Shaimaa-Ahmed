"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus, Loader2, CheckCircle2 } from "lucide-react";
import { AuthShell, inputCls } from "@/components/auth/auth-shell";
import { useContent } from "@/components/content/content-provider";
import { EGYPT_GOVERNORATES, TRACKS, STAGES, TRACK_STAGE } from "@/lib/data";

/**
 * كل حقول إنشاء الحساب إجبارية.
 * «الشعبة» وحدها مشروطة: لا تُطلب إلا في المرحلة الثانوية لأنها لا تظهر لغيرها.
 * الخادم يفرض القائمة نفسها — التحقّق في المتصفّح للراحة لا للحماية.
 */
const REQUIRED: { key: string; label: string; when?: (f: Record<string, string>) => boolean }[] = [
  { key: "name", label: "الاسم الكامل" },
  { key: "username", label: "البريد الإلكتروني" },
  { key: "password", label: "كلمة المرور" },
  { key: "phone", label: "رقم الموبايل" },
  { key: "stage", label: "المرحلة الدراسية" },
  { key: "grade", label: "الصف الدراسي" },
  { key: "track", label: "الشعبة", when: (f) => f.stage === TRACK_STAGE },
  { key: "governorate", label: "المحافظة" },
  { key: "gender", label: "النوع" },
  { key: "school", label: "اسم المدرسة" },
];

export default function RegisterPage() {
  const { db } = useContent();
  const grades = db?.grades ?? [];
  const [form, setForm] = useState({ name: "", username: "", password: "", phone: "", stage: "", grade: "", track: "", gender: "", school: "", governorate: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  /** الشعبة (علمي/أدبي) لا معنى لها إلا في المرحلة الثانوية. */
  const needsTrack = form.stage === TRACK_STAGE;

  /** تغيير المرحلة يمسح الشعبة تلقائياً حتى لا تُرسل شعبة لمرحلة لا شعب فيها. */
  const setStage = (v: string) =>
    setForm((f) => ({ ...f, stage: v, track: v === TRACK_STAGE ? f.track : "" }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const missing = REQUIRED.find(({ key, when }) => (when ? when(form) : true) && !String(form[key as keyof typeof form] ?? "").trim());
    if (missing) { setErr(`${missing.label} مطلوب`); return; }
    setBusy(true);
    const res = await fetch("/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, grade: form.grade || grades[0]?.name, track: needsTrack ? form.track : "" }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(data.error || "تعذّر إنشاء الحساب"); return; }
    setDone(true);
  };

  if (done) {
    return (
      <AuthShell title="تم إنشاء الحساب" subtitle="خطوة أخيرة قبل البدء"
        footer={<Link href="/login" className="font-bold text-primary">الذهاب لتسجيل الدخول</Link>}>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
          <CheckCircle2 className="size-12 text-emerald-500" />
          <p className="font-display text-lg font-extrabold">تم إنشاء حسابك بنجاح</p>
          <p className="text-sm text-muted-foreground">يمكنك تسجيل الدخول الآن مباشرة. لفتح أي كورس، اشترِ كوده وفعّله من داخل حسابك.</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="إنشاء حساب طالب"
      subtitle="سجّل بياناتك للبدء في دراسة اللغة العربية"
      footer={<>لديك حساب بالفعل؟ <Link href="/login" className="font-bold text-primary">تسجيل الدخول</Link></>}
    >
      <form onSubmit={submit} className="grid gap-3">
        <Field label="الاسم الكامل"><input required className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="البريد الإلكتروني"><input type="email" required dir="ltr" className={`${inputCls} text-right`} value={form.username} onChange={(e) => set("username", e.target.value)} placeholder="you@example.com" /></Field>
          <Field label="كلمة المرور"><input type="password" required className={inputCls} value={form.password} onChange={(e) => set("password", e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="رقم الموبايل"><input required inputMode="tel" className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="المرحلة الدراسية">
            <select required className={inputCls} value={form.stage} onChange={(e) => setStage(e.target.value)}>
              <option value="">اختر المرحلة…</option>
              {STAGES.map((st) => <option key={st} value={st}>{st}</option>)}
            </select>
          </Field>
        </div>
        {/* الصف — ومعه الشعبة إن كانت المرحلة ثانوية، وإلا يتمدّد الصف وحده */}
        <div className={`grid gap-3 ${needsTrack ? "grid-cols-2" : ""}`}>
          <Field label="الصف الدراسي">
            <select required className={inputCls} value={form.grade} onChange={(e) => set("grade", e.target.value)}>
              <option value="">اختر الصف الدراسي…</option>
              {grades.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}
            </select>
          </Field>
          {needsTrack && (
            <Field label="الشعبة">
              <select required className={inputCls} value={form.track} onChange={(e) => set("track", e.target.value)}>
                <option value="">اختر الشعبة…</option>
                {TRACKS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="المحافظة">
            <select required className={inputCls} value={form.governorate} onChange={(e) => set("governorate", e.target.value)}>
              <option value="">اختر المحافظة…</option>
              {EGYPT_GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="النوع">
            <select required className={inputCls} value={form.gender} onChange={(e) => set("gender", e.target.value)}>
              <option value="">اختر النوع…</option>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
          </Field>
        </div>
        <Field label="اسم المدرسة"><input required className={inputCls} value={form.school} onChange={(e) => set("school", e.target.value)} /></Field>
        <p className="text-[11px] text-muted-foreground">كل الحقول مطلوبة.</p>
        {err && <p className="rounded-2xl bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-500">{err}</p>}
        <button type="submit" disabled={busy} className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl btn-glow py-3 text-sm font-bold text-white disabled:opacity-60">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} إنشاء الحساب
        </button>
      </form>
    </AuthShell>
  );
}

/** كل الحقول إجبارية، فالنجمة تظهر على كلٍّ منها. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">
        {label} <span className="text-rose-500">*</span>
      </span>
      {children}
    </label>
  );
}
