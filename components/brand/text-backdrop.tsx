"use client";

/**
 * خلفية النصوص العربية.
 * ------------------------------------------------------------
 * كلمات ومصطلحات اللغة العربية تُرسم كنصّ حقيقي بخطّ الهوية،
 * بأحجام وزوايا وشفافيات متفاوتة، خلف المحتوى وبقناع تلاشٍ
 * فلا تزاحم القراءة.
 *
 * • النصّ داخل <svg><text> ليأخذ قناع التلاشي وينضبط مع أي مقاس.
 * • aria-hidden تماماً — زخرفة بحتة لا يقرؤها قارئ الشاشة.
 * • التوزيع مشتقّ من «بذرة» ثابتة (لا Math.random) فيتطابق
 *   ما يرسمه الخادم مع ما يرسمه المتصفّح بلا تحذير hydration.
 */
import { useUid } from "./use-uid";

/** حروف الهجاء العربية — المجموعة الافتراضية للخلفية. */
export const ARABIC_LETTERS = [
  "ا", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر",
  "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف",
  "ق", "ك", "ل", "م", "ن", "ه", "و", "ي",
];

/** مصطلحات اللغة العربية — للاستخدام في الشريط المتحرّك أو عند الطلب. */
export const ARABIC_TERMS = [
  "النَّحو",
  "الصَّرف",
  "البَلاغة",
  "الأدب",
  "النُّصوص",
  "الإعراب",
  "البَيان",
  "البَديع",
  "المَعاني",
  "التَّشبيه",
  "الاستعارة",
  "الكِناية",
  "الفاعل",
  "المفعول",
  "المُبتدأ",
  "الخَبر",
  "الحال",
  "التَّمييز",
  "الفصاحة",
  "لُغة الضَّاد",
];

function makeRng(seed: number) {
  let s = (seed * 2654435761) % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function ArabicTextBackdrop({
  letters = ARABIC_LETTERS,
  count = 26,
  seed = 5,
  tone = "text-primary/20",
  fade = "center",
  opacity = 0.55,
  className = "",
}: {
  /** الحروف (أو الكلمات) المعروضة — يمكن تمرير أي قائمة. */
  letters?: string[];
  /** عدد العناصر المرسومة. */
  count?: number;
  seed?: number;
  tone?: string;
  fade?: "top" | "center" | "bottom";
  /** شدّة الظهور الكلية (٠–١). */
  opacity?: number;
  className?: string;
}) {
  const uid = useUid("txtbg");
  const rnd = makeRng(seed);
  const list = letters.length ? letters : ARABIC_LETTERS;

  // شبكة صفوف/أعمدة مع إزاحة ثابتة — توزيع منتظم بلا تكدّس
  const cols = 5;
  const rows = Math.ceil(count / cols);
  const items = Array.from({ length: count }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      ch: list[i % list.length],
      x: ((col + 0.5) / cols) * 100 + (rnd() * 10 - 5),
      y: ((row + 0.5) / rows) * 100 + (rnd() * 10 - 5),
      size: 5 + rnd() * 7, // الحروف المفردة تحتمل حجماً أكبر من الكلمات
      rot: rnd() * 26 - 13,
      op: 0.35 + rnd() * 0.65,
      amp: -(0.8 + rnd() * 1.8),      // مدى الطفو بوحدات اللوحة
      tilt: rnd() * 6 - 3,            // ميل خفيف مع الطفو
      dur: 6 + rnd() * 6,             // مدة مختلفة لكل حرف فلا تتزامن
      delay: rnd() * 5,
    };
  });

  const focus = fade === "top" ? ["50%", "0%"] : fade === "bottom" ? ["50%", "100%"] : ["50%", "50%"];

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 100 100"
      /* slice لا none: يحافظ على نسبة الحروف فلا تتمطّط */
      preserveAspectRatio="xMidYMid slice"
      className={`pointer-events-none absolute inset-0 -z-10 h-full w-full select-none ${tone} ${className}`}
    >
      <defs>
        <radialGradient id={`${uid}-fade`} cx={focus[0]} cy={focus[1]} r="76%">
          <stop offset="0%" stopColor="#fff" stopOpacity={opacity} />
          <stop offset="58%" stopColor="#fff" stopOpacity={opacity * 0.5} />
          <stop offset="100%" stopColor="#fff" stopOpacity={0} />
        </radialGradient>
        <mask id={`${uid}-mask`}>
          <rect width="100" height="100" fill={`url(#${uid}-fade)`} />
        </mask>
      </defs>

      <g mask={`url(#${uid}-mask)`} fill="currentColor">
        {items.map((it, i) => (
          /* المجموعة تحمل الموضع والميل، والحرف داخلها يطفو بحركة CSS
             (لو وُضعت الحركة على العنصر نفسه لألغت خاصية transform) */
          <g key={i} transform={`translate(${it.x} ${it.y}) rotate(${it.rot})`}>
            <text
              x={0}
              y={0}
              fontSize={it.size}
              fillOpacity={it.op}
              textAnchor="middle"
              dominantBaseline="middle"
              className="letter-float"
              style={
                {
                  fontFamily: "var(--font-display)",
                  "--amp": `${it.amp}px`,
                  "--tilt": `${it.tilt}deg`,
                  "--dur": `${it.dur}s`,
                  "--delay": `${it.delay}s`,
                } as React.CSSProperties
              }
            >
              {it.ch}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

/**
 * شريط نصّي متحرّك — سطر واحد من المصطلحات يمرّ ببطء أفقياً.
 * يُستخدم كفاصل بين الأقسام. النصّ HTML (لا SVG) فلا يتشوّه.
 */
export function ArabicTextMarquee({
  words = ARABIC_LETTERS,
  className = "",
  duration = 60,
}: {
  words?: string[];
  className?: string;
  duration?: number;
}) {
  const list = words.length ? words : ARABIC_LETTERS;
  const line = [...list, ...list];

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none relative w-full select-none overflow-hidden ${className}`}
    >
      {/* تلاشٍ عند الطرفين */}
      <div className="absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
      <div className="absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
      <div
        className="flex w-max items-center gap-8 whitespace-nowrap [animation:marquee_var(--dur)_linear_infinite] motion-reduce:[animation:none]"
        style={{ ["--dur" as string]: `${duration}s` }}
      >
        {line.map((w, i) => (
          <span key={i} className="font-display flex items-center gap-8 text-2xl text-primary/15">
            {w}
            <svg viewBox="0 0 14 14" className="size-2.5 shrink-0 text-accent/40" fill="none">
              <path d="M7 1 12 7 7 13 2 7Z" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </span>
        ))}
      </div>
    </div>
  );
}
