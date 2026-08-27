"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, Plus, Trash2, X } from "lucide-react";
import { PageHeader, Card } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/primitives";
import { useContent } from "@/components/content/content-provider";
import type { GradeRow, TermRow } from "@/lib/types";
import { STAGES } from "@/lib/data";

const SWATCHES = ["#12b981", "#2b8bf6", "#7c3aed", "#e11d48", "#f59e0b", "#0ea5e9"];

export default function GradesPage() {
  const { db, save, content, saveContent } = useContent();
  const grades = db?.grades ?? [];
  const terms = content.terms ?? [];
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(SWATCHES[0]);

  const add = async () => {
    if (!name.trim()) return;
    const g: GradeRow = { id: `G-${Date.now()}`, name: name.trim(), students: 0, subjects: 0, color };
    await save({ grades: [...grades, g] });
    setName(""); setAdding(false);
  };
  const remove = (id: string) => save({ grades: grades.filter((g) => g.id !== id) });

  /* الفصول تُحفظ داخل المحتوى لا في جدول مستقلّ: عددها قليل وتُقرأ مع
     كل صفحة، فإبقاؤها مع بقية إعدادات المنصّة أبسط وأسرع. */
  const addTerm = async (name: string, stage: string) => {
    const t: TermRow = {
      id: `T-${Date.now()}`,
      name: name.trim(),
      stage: stage || undefined,
      order: terms.length,
    };
    await saveContent({ terms: [...terms, t] });
  };
  const removeTerm = (id: string) => saveContent({ terms: terms.filter((t) => t.id !== id) });

  return (
    <>
      <PageHeader title="الصفوف والفصول" subtitle="الصفوف الدراسية والفصول — تظهر في نموذج التسجيل مباشرة"
        action={<Button className="px-5 py-2.5" onClick={() => setAdding((v) => !v)}><Plus className="size-4" /> إضافة صف</Button>} />

      {adding && (
        <Card className="mb-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex-1"><span className="mb-1 block text-xs font-semibold text-muted-foreground">اسم الصف</span>
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
                placeholder="مثال: الصف الأول الثانوي" className="w-full rounded-2xl border border-border bg-card/60 px-4 py-2.5 text-sm outline-none focus:border-primary/50" />
            </label>
            <div>
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">اللون</span>
              <div className="flex gap-1.5">
                {SWATCHES.map((c) => (
                  <button key={c} onClick={() => setColor(c)} className={`size-8 rounded-lg ring-2 transition ${color === c ? "ring-primary" : "ring-transparent"}`} style={{ background: c }} />
                ))}
              </div>
            </div>
            <Button className="px-5 py-2.5" onClick={add}>حفظ</Button>
            <button onClick={() => setAdding(false)} className="grid size-10 place-items-center rounded-full border border-border"><X className="size-4" /></button>
          </div>
        </Card>
      )}

      {grades.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">لا توجد صفوف دراسية. أضِف أول صف ليظهر على الموقع.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {grades.map((g, i) => (
            <motion.div key={g.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="group relative overflow-hidden">
                <span className="pointer-events-none absolute -left-6 -top-6 size-24 rounded-full opacity-20 blur-2xl transition group-hover:opacity-40" style={{ background: g.color }} />
                <div className="flex items-start justify-between">
                  <span className="mb-4 grid size-12 place-items-center rounded-2xl text-white" style={{ background: g.color }}><BookOpen className="size-6" /></span>
                  <button onClick={() => remove(g.id)} title="حذف" className="grid size-8 place-items-center rounded-full border border-border text-rose-500 transition hover:border-rose-500"><Trash2 className="size-4" /></button>
                </div>
                <h3 className="font-display text-lg font-extrabold">{g.name}</h3>
                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Users className="size-4" /> {g.students.toLocaleString("ar-EG")} طالب</span>
                  <span className="inline-flex items-center gap-1"><BookOpen className="size-4" /> {g.subjects} مواد</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* ---------------- الفصول الدراسية ---------------- */}
      <TermsCard terms={terms} onAdd={addTerm} onRemove={removeTerm} />
    </>
  );
}

/**
 * الفصول الدراسية.
 * الفصل يمكن ربطه بمرحلة، فيظهر لطلابها وحدهم عند التسجيل؛ والفصل بلا
 * مرحلة يظهر لكل المراحل — فلا يُجبَر صاحب المنصّة على تكرار الفصل
 * نفسه لكل مرحلة إن كان مشتركاً بينها.
 */
function TermsCard({
  terms,
  onAdd,
  onRemove,
}: {
  terms: TermRow[];
  onAdd: (name: string, stage: string) => Promise<void>;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [stage, setStage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    await onAdd(name, stage);
    setBusy(false);
    setName("");
    setStage("");
    setOpen(false);
  };

  return (
    <Card className="mt-8">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-extrabold">الفصول الدراسية</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            <b className="text-foreground">الفصلان مبنيّان في المنصّة</b> — «الأول» و«الثاني»
            يظهران للطالب عند التسجيل بلا أي إضافة منك. أضف هنا فقط إن أردت أسماءً أخرى
            أو فصولاً تخصّ مرحلةً بعينها، فتحلّ محلّ المبنيَّين.
          </p>
        </div>
        <Button className="px-4 py-2" onClick={() => setOpen((v) => !v)}>
          <Plus className="size-4" /> إضافة فصل
        </Button>
      </div>

      {open && (
        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-border p-4">
          <label className="min-w-[12rem] flex-1">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">اسم الفصل</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="مثال: الفصل الدراسي الأول"
              className="w-full rounded-2xl border border-border bg-card/60 px-4 py-2.5 text-sm outline-none focus:border-primary/50"
            />
          </label>
          <label className="min-w-[10rem]">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">المرحلة</span>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full rounded-2xl border border-border bg-card/60 px-4 py-2.5 text-sm outline-none focus:border-primary/50"
            >
              <option value="">كل المراحل</option>
              {STAGES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </label>
          <Button className="px-5 py-2.5" onClick={submit} disabled={busy}>حفظ</Button>
          <button
            onClick={() => setOpen(false)}
            className="grid size-10 place-items-center rounded-full border border-border"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {terms.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          لا توجد فصول بعد — أضِف أول فصل ليظهر في نموذج التسجيل.
        </p>
      ) : (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {terms.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{t.name}</p>
                <p className="font-kufi mt-0.5 text-[10px] text-muted-foreground">
                  {t.stage ? t.stage : "كل المراحل"}
                </p>
              </div>
              <button
                onClick={() => onRemove(t.id)}
                aria-label="حذف الفصل"
                className="grid size-8 shrink-0 place-items-center rounded-full border border-border text-rose-500 transition hover:border-rose-500"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
