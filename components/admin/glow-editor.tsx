"use client";

/**
 * محرّر الوهج.
 * ------------------------------------------------------------------
 * قاعدةٌ واحدة تحمل: أيّ العناصر تُضاء، وهل الإضاءةُ خلفيةٌ أم حافّةٌ
 * أم كلاهما، وبأيّ لونٍ أو تدرّجٍ أو قوس قزح، وبأيّ شدّة.
 *
 * والمعاينةُ هنا **حيّة بالقيم نفسِها** — لا رسمٌ يصف الوهج بل وهجٌ
 * يقع أمام العين، فما تراه هو ما سيقع في الموقع.
 */

import { Plus, Trash2, Sparkles } from "lucide-react";
import {
  TARGET_LABEL, MODE_LABEL, newGlowRule,
  type GlowRule, type GlowMode, type GlowTarget,
} from "@/lib/glow";

const SWATCH = ["#7c3aed", "#0ea5e9", "#12b981", "#e11d48", "#f59e0b", "#c9a227", "#173972", "#ff0080"];

const TARGETS = Object.keys(TARGET_LABEL) as GlowTarget[];

export function GlowEditor({
  rules,
  onChange,
}: {
  rules: GlowRule[];
  onChange: (next: GlowRule[]) => void;
}) {
  const patch = (id: string, p: Partial<GlowRule>) =>
    onChange(rules.map((r) => (r.id === id ? { ...r, ...p } : r)));

  const toggleTarget = (r: GlowRule, t: GlowTarget) => {
    /* «الكل» يُلغي ما عداه — وإلا كُتبت القاعدةُ مرّتين على العنصر. */
    if (t === "all") {
      patch(r.id, { targets: r.targets.includes("all") ? [] : ["all"] });
      return;
    }
    const next = r.targets.includes(t)
      ? r.targets.filter((x) => x !== t)
      : [...r.targets.filter((x) => x !== "all"), t];
    patch(r.id, { targets: next });
  };

  return (
    <div className="grid gap-4">
      {rules.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center">
          <p className="font-display text-base font-extrabold">لا وهج بعد</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
            أضف قاعدةً واختر ما تُضيئه: بطاقات · أزرار · شريط · أو كل شيء — بلونٍ واحد أو
            تدرّجٍ أو قوس قزح يدور.
          </p>
        </div>
      )}

      {rules.map((r) => {
        const paint =
          r.mode === "solid" ? (r.c1 || "#7c3aed")
            : r.mode === "gradient" ? `linear-gradient(120deg, ${r.c1 || "#7c3aed"}, ${r.c2 || "#0ea5e9"})`
              : "conic-gradient(from 0deg,#ff0040,#ff8a00,#ffe600,#22dd55,#00d4ff,#7c3aed,#ff0040)";

        return (
          <div key={r.id} className="grid gap-4 rounded-2xl border border-border p-4">
            {/* ---------- المعاينة الحيّة ---------- */}
            <div className="flex flex-wrap items-center gap-5">
              <div className="grid place-items-center rounded-2xl bg-muted/60 p-6">
                <span className="relative grid h-16 w-32 place-items-center rounded-2xl bg-card text-xs font-bold">
                  {r.bg && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute rounded-2xl"
                      style={{
                        inset: -10,
                        background: paint,
                        filter: "blur(16px)",
                        opacity: (r.intensity ?? 55) / 100,
                        animation: r.mode === "rgb" ? `glw-hue ${r.speed ?? 8}s linear infinite` : undefined,
                      }}
                    />
                  )}
                  {r.edge && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-2xl"
                      style={{
                        padding: 2,
                        background: paint,
                        WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                        WebkitMaskComposite: "xor",
                        mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                        maskComposite: "exclude",
                        animation: r.mode === "rgb" ? `glw-hue ${r.speed ?? 8}s linear infinite` : undefined,
                      }}
                    />
                  )}
                  <span className="relative">معاينة حيّة</span>
                </span>
              </div>

              <div className="grid gap-2">
                <label className="flex items-center gap-2 text-xs font-bold">
                  <input type="checkbox" checked={r.bg} onChange={(e) => patch(r.id, { bg: e.target.checked })} />
                  خلفية مضيئة (هالة خلف العنصر)
                </label>
                <label className="flex items-center gap-2 text-xs font-bold">
                  <input type="checkbox" checked={r.edge} onChange={(e) => patch(r.id, { edge: e.target.checked })} />
                  حواف مضيئة (إطار متدرّج)
                </label>
                <label className="flex items-center gap-2 text-xs font-bold">
                  <input type="checkbox" checked={r.enabled !== false} onChange={(e) => patch(r.id, { enabled: e.target.checked })} />
                  القاعدة مفعّلة
                </label>
              </div>

              <button
                type="button"
                onClick={() => onChange(rules.filter((x) => x.id !== r.id))}
                className="mr-auto self-start rounded-xl border border-border p-2 text-muted-foreground transition hover:border-rose-500/50 hover:text-rose-500"
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            {/* ---------- الوضع واللون ---------- */}
            <div className="flex flex-wrap items-center gap-2">
              {(Object.keys(MODE_LABEL) as GlowMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => patch(r.id, { mode: m })}
                  className={`rounded-2xl border px-4 py-2 text-xs font-bold transition ${
                    r.mode === m ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {MODE_LABEL[m]}
                </button>
              ))}
            </div>

            {r.mode !== "rgb" && (
              <div className="grid gap-2">
                {(r.mode === "gradient" ? (["c1", "c2"] as const) : (["c1"] as const)).map((k, i) => (
                  <div key={k} className="flex flex-wrap items-center gap-2">
                    <span className="w-24 shrink-0 text-xs font-semibold text-muted-foreground">
                      {r.mode === "gradient" ? (i === 0 ? "اللون الأول" : "اللون الثاني") : "اللون"}
                    </span>
                    {SWATCH.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={c}
                        onClick={() => patch(r.id, { [k]: c })}
                        className={`size-7 rounded-lg border transition ${
                          (r[k] || "").toLowerCase() === c ? "border-primary ring-2 ring-primary/40" : "border-border"
                        }`}
                        style={{ background: c }}
                      />
                    ))}
                    <label className="grid size-7 cursor-pointer place-items-center rounded-lg border border-dashed border-border"
                      style={{ background: r[k] || "transparent" }}>
                      <input type="color" className="size-0 opacity-0" value={r[k] || "#7c3aed"}
                        onChange={(e) => patch(r.id, { [k]: e.target.value })} />
                    </label>
                  </div>
                ))}
              </div>
            )}

            {/* ---------- الشدّة والسرعة ---------- */}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs font-semibold text-muted-foreground">
                  الشدّة ({(r.intensity ?? 55).toLocaleString("ar-EG")}٪)
                </span>
                <input type="range" min={5} max={100} value={r.intensity ?? 55}
                  onChange={(e) => patch(r.id, { intensity: Number(e.target.value) })}
                  className="h-1.5 flex-1 accent-primary" />
              </label>
              {r.mode === "rgb" && (
                <label className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs font-semibold text-muted-foreground">
                    الدوران ({(r.speed ?? 8).toLocaleString("ar-EG")} ث)
                  </span>
                  <input type="range" min={2} max={30} value={r.speed ?? 8}
                    onChange={(e) => patch(r.id, { speed: Number(e.target.value) })}
                    className="h-1.5 flex-1 accent-primary" />
                </label>
              )}
            </div>

            {/* ---------- العناصر ---------- */}
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                على أيّ العناصر؟ (واحد أو أكثر أو الكل)
              </p>
              <div className="flex flex-wrap gap-2">
                {TARGETS.map((t) => {
                  const on = r.targets.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTarget(r, t)}
                      className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                        on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {TARGET_LABEL[t]}
                    </button>
                  );
                })}
              </div>
              {r.targets.length === 0 && (
                <p className="mt-2 text-[11px] font-bold text-amber-600">
                  بلا عنصر مختار لا تظهر القاعدة إطلاقاً.
                </p>
              )}
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => onChange([...rules, newGlowRule()])}
        className="inline-flex w-fit items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-xs font-bold text-white"
      >
        <Plus className="size-4" /> قاعدة وهج جديدة
      </button>

      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
        من ضبط جهازه على «تقليل الحركة» تتوقّف عنده دورةُ الألوان — يبقى الوهج ولا يدور.
      </p>
    </div>
  );
}
