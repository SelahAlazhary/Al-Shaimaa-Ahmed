/**
 * الوهج — خلفياتٌ وحوافُّ مضيئة لعناصر المنصّة.
 * ------------------------------------------------------------------
 * قاعدةٌ واحدة تُطبَّق على عنصرٍ أو عدّةٍ أو الكلّ، ولكلٍّ لونُه ووضعُه
 * وشدّتُه. والقواعدُ تُترجَم إلى CSS مرّةً على الخادم وتُحقن في الجذر،
 * فتعمل في الواجهة وبوابة الطالب واللوحة معاً بلا تكرار.
 *
 * **لماذا طبقتان لا ظلٌّ واحد؟** الظلُّ (`box-shadow`) لا يقبل تدرّجاً
 * ولا يدور، والحوافُّ المضيئة تحتاج تدرّجاً على الحدّ نفسِه. فطبقةٌ
 * خلف العنصر تُضبَّب فتصير هالة، وطبقةٌ على حدوده تُقنَّع فتصير حافّة
 * مضيئة — وكلتاهما تقبلان اللون الواحد والتدرّج وقوس القزح.
 */

import type { GlowMode, GlowRule, GlowTarget } from "./types";
export type { GlowMode, GlowRule, GlowTarget };

export const TARGET_LABEL: Record<GlowTarget, string> = {
  all: "كل العناصر",
  cards: "البطاقات",
  buttons: "الأزرار",
  bar: "الشريط العلوي",
  hero: "قسم الهيرو",
  plans: "بطاقات الخطط",
  sections: "بطاقات الأقسام",
  faq: "طيّات الأسئلة",
  cta: "لوح الدعوة",
  footer: "الفوتر",
  tiles: "بطاقات المؤشّرات",
  sidebar: "القائمة الجانبية",
  courses: "بطاقات الكورسات",
};

export const MODE_LABEL: Record<GlowMode, string> = {
  solid: "لون واحد",
  gradient: "تدرّج بين لونين",
  rgb: "قوس قزح متحرّك",
};

/**
 * المحدِّدات لكل هدف.
 * تُكتب هنا مرّةً واحدة، فلا تتفرّق أسماءُ الأصناف بين الملفّات.
 */
const SELECTORS: Record<GlowTarget, string[]> = {
  all: [".sx-card", ".plan-card", ".stat-tile", ".fq-item", ".ct-panel", ".site-bar", ".course-card"],
  cards: [".sx-card", ".plan-card", ".stat-tile", ".fq-item", ".course-card"],
  buttons: [".hero-actions > *", ".btn-glow"],
  bar: [".site-bar", ".app-body > header"],
  hero: ["#hero .hero-media > *"],
  plans: [".plan-card"],
  sections: ["#stages .sx-card", "#features .sx-card", "#testimonials .sx-card"],
  faq: [".fq-item"],
  cta: [".ct-panel"],
  footer: [".site-footer"],
  tiles: [".stat-tile"],
  sidebar: ["aside nav a"],
  courses: [".course-card"],
};

/** طلاءُ القاعدة — لونٌ أو تدرّجٌ أو قوس قزح. */
function paint(r: GlowRule): string {
  const c1 = r.c1 || "#7c3aed";
  const c2 = r.c2 || "#0ea5e9";
  if (r.mode === "solid") return c1;
  if (r.mode === "gradient") return `linear-gradient(120deg, ${c1}, ${c2})`;
  /* قوس قزح: تدرّجٌ مخروطي يُدار بتدوير التدرّج اللوني — لا يحتاج
     `@property` فيعمل حيث لا تُدعم الخصائص المسجَّلة. */
  return "conic-gradient(from 0deg, #ff0040, #ff8a00, #ffe600, #22dd55, #00d4ff, #7c3aed, #ff0040)";
}

/** يُنظِّف لوناً قادماً من اللوحة — لا يدخل إلى CSS ما لم يكن لوناً. */
function safeColor(v?: string): string | undefined {
  return v && /^#[0-9a-fA-F]{3,8}$/.test(v.trim()) ? v.trim() : undefined;
}

/**
 * يُترجم القواعد إلى CSS.
 * القواعدُ المطفأةُ والفارغةُ من الأهداف تُتجاهَل، فلا يُكتب ما لا يعمل.
 */
export function glowCss(rules: GlowRule[] | undefined): string {
  const on = (rules ?? []).filter((r) => r.enabled !== false && r.targets?.length && (r.bg || r.edge));
  if (on.length === 0) return "";

  const out: string[] = [
    /* دورانُ الطيف — تشترك فيه كلُّ قواعد قوس القزح. */
    "@keyframes glw-hue{to{filter:hue-rotate(360deg)}}",
  ];

  on.forEach((r, i) => {
    const clean: GlowRule = { ...r, c1: safeColor(r.c1), c2: safeColor(r.c2) };
    const sel = Array.from(
      new Set(clean.targets.flatMap((t) => SELECTORS[t] ?? []))
    ).join(",");
    if (!sel) return;

    const bgPaint = paint(clean);
    const alpha = Math.max(0, Math.min(100, clean.intensity ?? 55)) / 100;
    const spin = Math.max(2, Math.min(30, clean.speed ?? 8));
    const spinCss = clean.mode === "rgb"
      ? `animation:glw-hue ${spin}s linear infinite;`
      : "";

    /* العنصرُ يحتاج سياقَ تكديسٍ ليقع الوهجُ خلفه لا فوقه. */
    out.push(`${sel}{position:relative;isolation:isolate}`);

    if (clean.bg) {
      out.push(
        `${sel}::after{content:"";position:absolute;inset:-10px;z-index:-2;` +
        `border-radius:inherit;background:${bgPaint};filter:blur(16px);` +
        `opacity:${alpha};pointer-events:none;${spinCss}}`
      );
    }

    if (clean.edge) {
      /*
        حافّةٌ مضيئة بتدرّج: طلاءٌ كامل يُقنَّع بفارق صندوقين، فيبقى منه
        إطارٌ رفيع. الحدُّ العادي (`border`) لا يقبل تدرّجاً.
      */
      out.push(
        `${sel}::before{content:"";position:absolute;inset:0;z-index:-1;` +
        `border-radius:inherit;padding:2px;background:${bgPaint};` +
        "-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);" +
        "-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);" +
        `mask-composite:exclude;pointer-events:none;${spinCss}}`
      );
    }

    if (i > 40) return; // حدٌّ يمنع تضخّم الورقة بلا داعٍ
  });

  /* من فضّل تقليل الحركة لا تدور عنده الألوان. */
  out.push("@media (prefers-reduced-motion: reduce){[class] ::after,[class] ::before{animation:none!important}}");

  return out.join("\n");
}

/** قاعدةٌ جديدة بقيمٍ معقولة. */
export function newGlowRule(): GlowRule {
  return {
    id: `GL-${Date.now().toString(36)}`,
    targets: ["cards"],
    bg: true,
    edge: false,
    mode: "gradient",
    c1: "#7c3aed",
    c2: "#0ea5e9",
    intensity: 55,
    speed: 8,
    enabled: true,
  };
}
