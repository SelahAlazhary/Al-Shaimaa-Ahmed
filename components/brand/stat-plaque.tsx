"use client";

/**
 * لوح المؤشّر — بطاقة رقم مرسومة بالكامل بـSVG.
 * ------------------------------------------------------------------
 * البنية: لوح بأركان مقصوصة · خيط ذهبي داخلي · منمنمات في الأركان ·
 * ميدالية مثمّنة تركب حافة اللوح العليا وتحتضن الأيقونة · وفي الجسم
 * إمّا رقم كبير وإمّا حلقة نسبة مرسومة تُملأ عند الظهور.
 *
 * لماذا viewBox ثابت؟ لأن اللوح يُرسم داخل صندوق بنسبة أبعاد ثابتة
 * (aspect-ratio) و`preserveAspectRatio` الافتراضي — فلا يُمدّ الشكل ولا
 * تتشوّه الزوايا ولا يتفاوت سُمك الحدّ، بلا حاجة لقياس بالجافاسكربت.
 *
 * الأرقام والعناوين تبقى HTML فوق الرسم — حفاظاً على قارئات الشاشة
 * والاتجاه RTL وإمكانية تحديد النصّ.
 */
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useUid } from "./use-uid";

const W = 100;
const H = 106;
const TOP = 15; // ارتفاع مركز الميدالية — اللوح يبدأ تحته بقليل
const CUT = 11;

/** لوح بأركان أربعة مقصوصة داخل الصندوق. */
function plaquePath(inset: number): string {
  const x0 = 2 + inset;
  const y0 = TOP - 3 + inset;
  const x1 = W - 2 - inset;
  const y1 = H - 2 - inset;
  const c = Math.max(3, CUT - inset * 0.7);
  return [
    `M${x0 + c} ${y0}`,
    `H${x1 - c}`,
    `L${x1} ${y0 + c}`,
    `V${y1 - c}`,
    `L${x1 - c} ${y1}`,
    `H${x0 + c}`,
    `L${x0} ${y1 - c}`,
    `V${y0 + c}`,
    "Z",
  ].join(" ");
}

/** منمنمة ركن: ضلعان قصيران. */
function knot(x: number, y: number, sx: number, sy: number) {
  return `M${x + 6 * sx} ${y + 2.6 * sy} h${3.4 * sx} M${x + 2.6 * sx} ${y + 6 * sy} v${3.4 * sy}`;
}

export function StatPlaque({
  value,
  label,
  icon,
  /** عند تمريرها يُرسم قرص نسبة بدل الرقم (٠..١٠٠). */
  ring,
  /** onInk: فوق لوح الحبر الداكن · onPaper: فوق الورق الفاتح. */
  tone = "onInk",
  index = 0,
  className = "",
}: {
  value?: ReactNode;
  label: string;
  icon?: ReactNode;
  ring?: number;
  tone?: "onInk" | "onPaper";
  index?: number;
  className?: string;
}) {
  const uid = useUid("stat");
  const ink = tone === "onInk";

  // على الحبر: تذهيب فاتح ونصّ أبيض. على الورق: تذهيب الثيم ونصّ الحبر.
  const gold = ink ? "hsl(44 88% 72%)" : "hsl(var(--gold))";
  const goldSoft = ink ? "hsl(44 88% 72% / 0.5)" : "hsl(var(--gold) / 0.45)";
  const face = ink ? "hsl(0 0% 100% / 0.09)" : "hsl(var(--card))";
  const medalFace = ink ? "hsl(226 52% 22%)" : "hsl(var(--card))";

  const pct = Math.max(0, Math.min(100, ring ?? 0));
  const r = 21;
  const circ = 2 * Math.PI * r;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.45 }}
      className={`relative ${className}`}
      style={{ aspectRatio: `${W} / ${H}` }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} fill="none" aria-hidden="true" className="absolute inset-0 size-full">
        <defs>
          <linearGradient id={`${uid}-g`} x1="0" y1="0" x2={W} y2={H} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={ink ? "hsl(38 70% 58%)" : "hsl(var(--gold-deep))"} />
            <stop offset="45%" stopColor={ink ? "hsl(46 94% 80%)" : "hsl(var(--gold-light))"} />
            <stop offset="100%" stopColor={gold} />
          </linearGradient>
        </defs>

        {/* جسم اللوح */}
        <path d={plaquePath(0)} fill={face} />
        <path d={plaquePath(0)} stroke={`url(#${uid}-g)`} strokeWidth="1.1" strokeLinejoin="round" />
        {/* خيط ذهبي داخلي */}
        <path d={plaquePath(3.6)} stroke={goldSoft} strokeWidth="0.6" strokeLinejoin="round" />

        {/* منمنمات الأركان الأربعة */}
        <g stroke={`url(#${uid}-g)`} strokeWidth="0.9" strokeLinecap="round" opacity="0.8">
          <path d={knot(2 + CUT, TOP - 3, 1, 1)} />
          <path d={knot(W - 2 - CUT, TOP - 3, -1, 1)} />
          <path d={knot(2 + CUT, H - 2, 1, -1)} />
          <path d={knot(W - 2 - CUT, H - 2, -1, -1)} />
        </g>

        {/* حلقة النسبة — تُملأ عند الظهور */}
        {ring !== undefined && (
          <g transform={`translate(${W / 2} 62)`}>
            <circle r={r} stroke={ink ? "hsl(0 0% 100% / 0.2)" : "hsl(var(--muted))"} strokeWidth="6" />
            <motion.circle
              r={r}
              stroke={`url(#${uid}-g)`}
              strokeWidth="6"
              strokeLinecap="round"
              transform="rotate(-90)"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
              transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 + index * 0.07 }}
            />
          </g>
        )}

        {/* الميدالية المثمّنة راكبة على الحافة العليا */}
        <g transform={`translate(${W / 2} ${TOP})`}>
          <path
            d="M0 -13 5.1 -10.9 9.2 -6.8 11.3 0 9.2 6.8 5.1 10.9 0 13 -5.1 10.9 -9.2 6.8 -11.3 0 -9.2 -6.8 -5.1 -10.9Z"
            fill={medalFace}
          />
          <path
            d="M0 -13 5.1 -10.9 9.2 -6.8 11.3 0 9.2 6.8 5.1 10.9 0 13 -5.1 10.9 -9.2 6.8 -11.3 0 -9.2 -6.8 -5.1 -10.9Z"
            stroke={`url(#${uid}-g)`}
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
          <circle r="7.6" stroke={goldSoft} strokeWidth="0.55" />
        </g>
      </svg>

      {/* ---- النصّ فوق الرسم ---- */}
      {/* الأيقونة داخل الميدالية */}
      {icon && (
        <span
          className={`pointer-events-none absolute left-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center ${
            ink ? "text-[hsl(46_94%_80%)]" : "text-accent"
          }`}
          style={{ top: `${(TOP / H) * 100}%` }}
        >
          {icon}
        </span>
      )}

      {/* الرقم أو النسبة */}
      <span
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
        style={{ top: `${(62 / H) * 100}%` }}
      >
        <span
          className={`font-display block font-bold leading-none ${
            ring !== undefined ? "text-[1.4rem]" : "text-[2.15rem]"
          } ${ink ? "text-white" : "text-foreground"}`}
        >
          {ring !== undefined ? `${pct.toLocaleString("ar-EG")}٪` : value}
        </span>
      </span>

      {/* العنوان */}
      <span
        className={`font-kufi pointer-events-none absolute inset-x-2 bottom-[6%] text-center text-[0.74rem] font-bold leading-tight tracking-[0.02em] ${
          ink ? "text-white/85" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </motion.div>
  );
}
