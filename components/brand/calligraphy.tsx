"use client";

/**
 * طبقة الخطّ العربي — قلب هوية المنصّة.
 * ------------------------------------------------------------
 * كلّها SVG مرسوم بمسارات (لا صور، ولا خطوط محمّلة، ولا نصّ داخل SVG)
 * فتظهر كما هي على أي جهاز، وتتلوّن من الثيم، وتتحرّك كأنها تُكتب الآن.
 *
 * • WritingLine  : سطر كتابة عربي مجرّد (أسنان وكؤوس وحلقات ونقاط وألفات).
 * • WritingBlock : صفحة مخطوط — عدّة أسطر متفاوتة تُكتب بالتتابع.
 * • DaadGlyph    : حرف الضاد — علامة «لغة الضاد».
 * • Qalam        : قلم القصب المبريّ.
 * • Inkwell      : محبرة بغطاء ونقطة حبر.
 *
 * ملاحظة: كل التوزيعات مشتقّة من «بذرة» رقمية ثابتة — لا Math.random —
 * حتى يتطابق ما يرسمه الخادم مع ما يرسمه المتصفّح (بلا تحذير hydration).
 */
import { useUid } from "./use-uid";

/* ------------------------------------------------------------------ */
/*  مولّد عشوائية ثابت (مشتق من بذرة)                                  */
/* ------------------------------------------------------------------ */

function makeRng(seed: number) {
  let s = (seed * 2654435761) % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ------------------------------------------------------------------ */
/*  سطر الكتابة                                                        */
/* ------------------------------------------------------------------ */

/** أشكال الوحدات الخطّية — كلّها تبدأ وتنتهي على السطر (baseline). */
type Unit = "tooth" | "bowl" | "loop" | "flat" | "rise";

const UNIT_D: Record<Unit, { d: string; dx: number }> = {
  // سِنّ (كحرف الباء والسين) — نتوء صغير فوق السطر
  tooth: { d: "c -1.6 -8 -6.4 -8 -8 0", dx: -8 },
  // كأس (كالنون والياء) — انخفاض تحت السطر
  bowl: { d: "c -2.5 10 -13.5 10 -16 0", dx: -16 },
  // حلقة (كالميم والهاء) — عين صغيرة
  loop: { d: "c -3 -6.5 -11 -5.5 -11 0.8 c 0 5.4 7.4 6 9.2 0.6", dx: -11 },
  // وصلة مستقيمة
  flat: { d: "l -7 0", dx: -7 },
  // ارتفاع قصير (كالطاء والكاف)
  rise: { d: "c -1 -14 -6 -14 -7 0", dx: -7 },
};

const UNIT_ORDER: Unit[] = ["tooth", "bowl", "loop", "flat", "rise", "tooth", "flat", "bowl"];

export function WritingLine({
  width = 320,
  seed = 3,
  strokeWidth = 3.2,
  className = "",
  animate = true,
  delay = 0,
  duration = 2.4,
  opacity = 1,
}: {
  width?: number;
  seed?: number;
  strokeWidth?: number;
  className?: string;
  animate?: boolean;
  delay?: number;
  duration?: number;
  opacity?: number;
}) {
  const rnd = makeRng(seed);
  const H = 46;
  const base = 28; // ارتفاع السطر داخل الصندوق
  let x = width - 4;

  let d = `M${x} ${base}`;
  const dots: { x: number; y: number; n: number }[] = [];
  const alifs: { x: number; h: number }[] = [];
  let guard = 0;

  while (x > 10 && guard++ < 120) {
    const u = UNIT_ORDER[Math.floor(rnd() * UNIT_ORDER.length)];
    const { d: seg, dx } = UNIT_D[u];
    if (x + dx < 8) break;
    d += ` ${seg}`;
    const mid = x + dx / 2;
    x += dx;

    // نقاط الإعجام فوق الأسنان وتحت الكؤوس
    const r = rnd();
    if (u === "tooth" && r > 0.45) dots.push({ x: mid, y: base - 13, n: r > 0.82 ? 2 : 1 });
    else if (u === "bowl" && r > 0.62) dots.push({ x: mid, y: base + 16, n: r > 0.88 ? 2 : 1 });

    // ألف/لام قائمة بين الحين والآخر — تُرسم منفصلة عن السطر
    if (rnd() > 0.78) {
      alifs.push({ x: x - 2, h: 17 + Math.floor(rnd() * 8) });
      x -= 7;
      d += ` M${x} ${base}`;
    }

    // فراغ بين الكلمات
    if (rnd() > 0.84) {
      x -= 9;
      d += ` M${x} ${base}`;
    }
  }

  const anim = animate ? "qalam-write" : "";
  const style = animate
    ? ({ "--dash": `${width * 2.4}`, "--dur": `${duration}s`, "--delay": `${delay}s` } as React.CSSProperties)
    : undefined;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${width} ${H}`}
      width={width}
      height={H}
      fill="none"
      className={className}
      style={{ opacity }}
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d={d} strokeWidth={strokeWidth} className={anim} style={style} />
        {alifs.map((a, i) => (
          <path
            key={`a${i}`}
            d={`M${a.x} ${base} V${base - a.h}`}
            strokeWidth={strokeWidth * 0.92}
            className={anim}
            style={
              animate
                ? ({ "--dash": "40", "--dur": "0.5s", "--delay": `${delay + 0.25 + i * 0.09}s` } as React.CSSProperties)
                : undefined
            }
          />
        ))}
      </g>
      <g fill="currentColor">
        {dots.map((p, i) =>
          Array.from({ length: p.n }, (_, k) => (
            <circle
              key={`d${i}-${k}`}
              cx={p.x + (p.n === 2 ? (k === 0 ? -2.6 : 2.6) : 0)}
              cy={p.y}
              r={strokeWidth * 0.55}
              opacity={0}
              style={{
                animation: animate
                  ? `ico-pop 0.32s ease-out ${delay + 0.5 + i * 0.06}s forwards`
                  : undefined,
                ...(animate ? {} : { opacity: 1 }),
              }}
            />
          ))
        )}
      </g>
    </svg>
  );
}

/** صفحة مخطوط — أسطر متفاوتة الطول تُكتب بالتتابع. */
export function WritingBlock({
  lines = 4,
  width = 320,
  seed = 5,
  className = "",
  animate = true,
  strokeWidth = 3,
}: {
  lines?: number;
  width?: number;
  seed?: number;
  className?: string;
  animate?: boolean;
  strokeWidth?: number;
}) {
  const rnd = makeRng(seed);
  const rows = Array.from({ length: lines }, (_, i) => ({
    w: Math.round(width * (0.72 + rnd() * 0.28)),
    s: seed + i * 13,
    o: 1 - i * 0.12,
  }));
  return (
    <div className={`flex flex-col items-end gap-1 ${className}`}>
      {rows.map((r, i) => (
        <WritingLine
          key={i}
          width={r.w}
          seed={r.s}
          strokeWidth={strokeWidth}
          animate={animate}
          delay={i * 0.42}
          duration={2 + (r.w / width) * 0.8}
          opacity={Math.max(0.32, r.o)}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  حرف الضاد — علامة «لغة الضاد»                                      */
/* ------------------------------------------------------------------ */

export function DaadGlyph({
  size = 160,
  className = "",
  animate = true,
  strokeWidth = 9,
  gold = false,
}: {
  size?: number;
  className?: string;
  animate?: boolean;
  strokeWidth?: number;
  gold?: boolean;
}) {
  const uid = useUid("daad");
  const paint = `url(#${uid}-g)`;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient id={`${uid}-g`} x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          {gold ? (
            <>
              <stop offset="0%" stopColor="hsl(var(--gold-deep))" />
              <stop offset="50%" stopColor="hsl(var(--gold-light))" />
              <stop offset="100%" stopColor="hsl(var(--gold))" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--glow))" />
            </>
          )}
        </linearGradient>
      </defs>

      {/* جسم الحرف: الرأس ثم البدن ثم الكأس */}
      <path
        d="M86 44 C86 32 77 26 68 28 C59 30 56 40 63 46 H40 C24 46 14 56 16 66 C18 77 32 82 48 82 C66 82 80 73 84 60"
        stroke={paint}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animate ? "qalam-write" : undefined}
        style={animate ? ({ "--dash": "300", "--dur": "2.6s" } as React.CSSProperties) : undefined}
      />
      {/* نقطة الإعجام */}
      <circle
        cx="74"
        cy="14"
        r={strokeWidth * 0.62}
        fill={paint}
        opacity={animate ? 0 : 1}
        style={animate ? { animation: "ico-pop 0.4s ease-out 2.5s forwards" } : undefined}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  أدوات الكتابة                                                      */
/* ------------------------------------------------------------------ */

/** قلم القصب المبريّ — مائل كما يُمسك عند الكتابة. */
export function Qalam({
  size = 120,
  className = "",
  tilt = -34,
}: {
  size?: number;
  className?: string;
  tilt?: number;
}) {
  const uid = useUid("qalam");
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient id={`${uid}-reed`} x1="40" y1="10" x2="80" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(var(--gold-light))" />
          <stop offset="55%" stopColor="hsl(var(--gold))" />
          <stop offset="100%" stopColor="hsl(var(--gold-deep))" />
        </linearGradient>
      </defs>
      <g transform={`rotate(${tilt} 60 60)`}>
        {/* بدن القصبة */}
        <path
          d="M53 8 h14 a3 3 0 0 1 3 3 v62 h-20 v-62 a3 3 0 0 1 3 -3Z"
          fill={`url(#${uid}-reed)`}
        />
        {/* عُقَد القصب */}
        <g stroke="hsl(var(--gold-deep))" strokeWidth="1.1" opacity="0.55">
          <path d="M50 26h20M50 44h20M50 60h20" />
        </g>
        {/* البَرْية: السنّ المشحوذ */}
        <path d="M50 73h20l-4 22-6 9-6-9Z" fill={`url(#${uid}-reed)`} />
        <path d="M50 73h20l-4 22-6 9-6-9Z" stroke="hsl(var(--gold-deep))" strokeWidth="1" opacity="0.6" />
        {/* شقّ السنّ */}
        <path d="M60 84v20" stroke="hsl(var(--primary))" strokeWidth="1.6" strokeLinecap="round" />
        {/* لمعة */}
        <path d="M55 12v58" stroke="#fff" strokeWidth="2" strokeOpacity="0.34" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** محبرة — بغطاء مذهّب ونقطة حبر. */
export function Inkwell({ size = 120, className = "" }: { size?: number; className?: string }) {
  const uid = useUid("ink");
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient id={`${uid}-body`} x1="30" y1="40" x2="90" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--glow))" />
        </linearGradient>
        <linearGradient id={`${uid}-gold`} x1="30" y1="30" x2="90" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(var(--gold-deep))" />
          <stop offset="50%" stopColor="hsl(var(--gold-light))" />
          <stop offset="100%" stopColor="hsl(var(--gold))" />
        </linearGradient>
      </defs>
      {/* الحوض */}
      <path d="M34 56h52l-6 46a8 8 0 0 1-8 7H48a8 8 0 0 1-8-7Z" fill={`url(#${uid}-body)`} />
      {/* سطح الحبر */}
      <ellipse cx="60" cy="56" rx="26" ry="7" fill="hsl(var(--primary))" opacity="0.9" />
      <ellipse cx="60" cy="56" rx="26" ry="7" stroke={`url(#${uid}-gold)`} strokeWidth="1.6" />
      {/* طوق مذهّب */}
      <path d="M36 68h48" stroke={`url(#${uid}-gold)`} strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
      <path d="M40 82h40" stroke={`url(#${uid}-gold)`} strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
      {/* نقطة حبر ساقطة */}
      <path
        d="M60 30c0 0-7 9-7 14a7 7 0 0 0 14 0c0-5-7-14-7-14Z"
        fill="hsl(var(--primary))"
        className="ico-bob"
      />
      <circle cx="57" cy="42" r="1.8" fill="#fff" opacity="0.45" />
    </svg>
  );
}
