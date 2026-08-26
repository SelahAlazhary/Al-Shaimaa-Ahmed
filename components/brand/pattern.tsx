"use client";

/**
 * الطبقة الزخرفية — SVG بالكامل (بلا صور نقطية ولا هالات blur).
 * الهوية: المخطوط العربي — كوفي مربّع، وتذهيب، وشمسة، وتشكيل.
 *
 * • KuficBackdrop / GeoBackdrop : تبليط «كوفي مربّع» متاهيّ بقناع تلاشٍ.
 * • HarakatField                : حقل حركات (فتحة/ضمة/كسرة/شدّة) تطفو ببطء.
 * • Shamsa                      : شمسة مذهّبة كبيرة لخلفيات الأقسام.
 * • RuleOrnament                : فاصلة مذهّبة تحت عناوين الأقسام.
 * • CornerKnot                  : منمنمة زاوية للبطاقات.
 * • ArchTile / archPath         : لوحة (سَرلَوح) مقوّسة — إطار وبطاقات.
 *
 * كل الزخارف aria-hidden وترث اللون من الثيم عبر currentColor.
 */
import type { SVGProps } from "react";
import { useUid } from "./use-uid";

/** مسار لوحة مقوّسة داخل صندوق w×h (نسب ثابتة تُحافظ على الشكل عند أي مقاس). */
export function archPath(w: number, h: number, inset = 0): string {
  const x0 = inset;
  const x1 = w - inset;
  const y1 = h - inset;
  const shoulder = h * 0.42; // ارتفاع بداية انحناء القوس
  const apex = inset + h * 0.02;
  const cy = h * 0.16;
  return `M${x0} ${y1} V${shoulder} Q${x0} ${cy} ${w / 2} ${apex} Q${x1} ${cy} ${x1} ${shoulder} V${y1} Z`;
}

/**
 * تبليط «كوفي مربّع» — الخطّ الكوفي الهندسي الذي تُكتب به العمارة العربية.
 * المسارات متعامدة بزوايا قائمة فتُنتج متاهة متّصلة عند التكرار.
 * density = مقاس البلاطة بالبكسل. التبليط بـ userSpaceOnUse ليثبت الحجم.
 */
export function KuficBackdrop({
  density = 88,
  opacity = 0.5,
  fade = "top",
  tone = "text-primary/25",
  className = "",
}: {
  density?: number;
  opacity?: number;
  fade?: "top" | "center" | "bottom";
  tone?: string;
  className?: string;
}) {
  const uid = useUid("kufi");
  const t = density;
  const u = t / 8;
  const focus = fade === "top" ? "50% 0%" : fade === "bottom" ? "50% 100%" : "50% 50%";
  const [fx, fy] = focus.split(" ");

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={`pointer-events-none absolute inset-0 -z-10 h-full w-full ${tone} ${className}`}
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id={`${uid}-tile`} width={t} height={t} patternUnits="userSpaceOnUse">
          {/* المتاهة الكوفية: خطوط قائمة الزوايا فقط */}
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth={u * 0.62}
            strokeLinecap="square"
          >
            <path d={`M${u} ${u * 7}V${u}H${u * 5}`} />
            <path d={`M${u * 5} ${u}V${u * 4}H${u * 3}V${u * 7}H${u * 7}V${u * 3}`} />
            <path d={`M${u * 7} ${u * 7}H${u * 7}`} opacity={0.001} />
          </g>
          {/* نقاط الإعجام عند تقاطعات البلاطة */}
          <g fill="currentColor" opacity={0.55}>
            <rect x={u * 6.6} y={u * 0.6} width={u * 0.8} height={u * 0.8} />
            <rect x={u * 0.6} y={u * 6.6} width={u * 0.8} height={u * 0.8} />
          </g>
        </pattern>

        {/* قناع تلاشٍ: النمط يظهر قرب البؤرة ويختفي عند الحواف */}
        <radialGradient id={`${uid}-fade`} cx={fx} cy={fy} r="78%">
          <stop offset="0%" stopColor="#fff" stopOpacity={opacity} />
          <stop offset="55%" stopColor="#fff" stopOpacity={opacity * 0.42} />
          <stop offset="100%" stopColor="#fff" stopOpacity={0} />
        </radialGradient>
        <mask id={`${uid}-mask`} maskUnits="userSpaceOnUse">
          <rect width="100%" height="100%" fill={`url(#${uid}-fade)`} />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${uid}-tile)`} mask={`url(#${uid}-mask)`} />
    </svg>
  );
}

/** اسم متوافق مع الاستدعاءات القائمة. */
export const GeoBackdrop = KuficBackdrop;

/* ------------------------------------------------------------------ */
/*  حقل الحركات — تشكيل عربي يطفو ببطء في خلفية الأقسام                */
/* ------------------------------------------------------------------ */

/** رسوم الحركات مرسومة كمسارات (لا نصّ) فلا تعتمد على خطّ محمّل. */
const HARAKAT: Record<string, string> = {
  // فتحة: شرطة مائلة
  fatha: "M-7 3 L7 -3",
  // كسرة: شرطة مائلة معكوسة
  kasra: "M-7 -3 L7 3",
  // ضمة: واو صغيرة (حلقة بذيل)
  damma: "M-2 -4 A4 4 0 1 0 2 0 L2 6",
  // سكون: دائرة صغيرة مفتوحة
  sukun: "M0 -5 A5 5 0 1 1 -0.1 -5",
  // شدّة: رأس السين (ثلاث أسنان)
  shadda: "M-8 4 L-5 -4 L-2 4 L1 -4 L4 4 L7 -4",
  // تنوين: شرطتان
  tanween: "M-8 4 L2 -2 M-2 4 L8 -2",
};

export function HarakatField({
  count = 14,
  tone = "text-accent/40",
  className = "",
  seed = 7,
}: {
  count?: number;
  tone?: string;
  className?: string;
  seed?: number;
}) {
  const keys = Object.keys(HARAKAT);
  // توزيع ثابت مشتق من البذرة — لا عشوائية وقت التشغيل (يمنع اختلاف SSR)
  const marks = Array.from({ length: count }, (_, i) => {
    const n = (i + 1) * seed;
    return {
      x: ((n * 37) % 100) + (i % 2 ? 0.5 : 0),
      y: ((n * 61) % 100) + (i % 3 ? 0.3 : 0),
      s: 0.55 + ((n * 13) % 70) / 100,
      r: ((n * 29) % 40) - 20,
      d: ((n * 17) % 50) / 10,
      k: keys[n % keys.length],
    };
  });

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-0 -z-10 h-full w-full ${tone} ${className}`}
    >
      {marks.map((m, i) => (
        <g
          key={i}
          className="harakat"
          style={{ animationDelay: `${m.d}s`, animationDuration: `${5 + (i % 4)}s` }}
          transform={`translate(${m.x} ${m.y}) scale(${m.s * 0.16}) rotate(${m.r})`}
        >
          <path
            d={HARAKAT[m.k]}
            fill="none"
            stroke="currentColor"
            strokeWidth={3.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  الشمسة — زخرفة إشعاعية مذهّبة                                      */
/* ------------------------------------------------------------------ */

export function Shamsa({
  size = 320,
  rays = 24,
  className = "",
  spin = true,
}: {
  size?: number;
  rays?: number;
  className?: string;
  spin?: boolean;
}) {
  const uid = useUid("shamsa");
  const c = 100;
  const petals = Array.from({ length: rays }, (_, i) => {
    const a = (i / rays) * 360;
    return (
      <path
        key={i}
        d={`M${c} ${c - 62} C${c + 9} ${c - 76} ${c + 9} ${c - 86} ${c} ${c - 96} C${c - 9} ${c - 86} ${c - 9} ${c - 76} ${c} ${c - 62}Z`}
        transform={`rotate(${a} ${c} ${c})`}
      />
    );
  });

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(var(--gold-deep))" />
          <stop offset="50%" stopColor="hsl(var(--gold-light))" />
          <stop offset="100%" stopColor="hsl(var(--gold))" />
        </linearGradient>
      </defs>
      <g className={spin ? "shamsa-turn" : undefined}>
        <g fill="none" stroke={`url(#${uid}-g)`} strokeWidth="0.9" opacity="0.55">
          {petals}
        </g>
        <g fill="none" stroke={`url(#${uid}-g)`} strokeWidth="1" opacity="0.7">
          <circle cx={c} cy={c} r="62" />
          <circle cx={c} cy={c} r="48" />
          <path d="M100 38 162 100 100 162 38 100Z" />
          <path d="M56 56h88v88H56Z" />
          <circle cx={c} cy={c} r="22" />
        </g>
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  الفواصل والزوايا                                                   */
/* ------------------------------------------------------------------ */

/** فاصلة مذهّبة — تُستخدم تحت عناوين الأقسام وفي الفوتر. */
export function RuleOrnament({ width = 148, className = "" }: { width?: number; className?: string }) {
  const w = width;
  const c = w / 2;
  const arm = Math.max(10, c - 26);
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={w}
      height={16}
      viewBox={`0 0 ${w} 16`}
      fill="none"
      className={className}
    >
      <g stroke="currentColor" strokeWidth={1} strokeLinecap="round" fill="none">
        {/* الذراعان مع تموّج خفيف عند الطرف */}
        <path d={`M0 8h${arm}`} opacity={0.3} />
        <path d={`M${w} 8h-${arm}`} opacity={0.3} />
        <path d={`M${c - arm - 0} 8 q4 -5 8 0 q4 5 8 0`} opacity={0.55} />
        <path d={`M${c + arm} 8 q-4 -5 -8 0 q-4 5 -8 0`} opacity={0.55} />
        {/* الشمسة الصغيرة في المنتصف */}
        <path d={`M${c} 1 L${c + 7} 8 L${c} 15 L${c - 7} 8Z`} opacity={0.9} />
        <path d={`M${c - 4.9} 3.1 L${c + 4.9} 12.9 M${c + 4.9} 3.1 L${c - 4.9} 12.9`} opacity={0.35} />
      </g>
      <circle cx={c} cy={8} r={1.6} fill="currentColor" opacity={0.9} />
    </svg>
  );
}

/**
 * فاصل مذهّب أنيق — خطّان متلاشيان وفي وسطهما شمسة صغيرة وخرزتان.
 * يُستخدم تحت العناوين بدل أي زخرفة نصّية.
 */
export function ElegantRule({
  width = 260,
  className = "",
}: {
  width?: number;
  className?: string;
}) {
  const uid = useUid("erule");
  const w = width;
  const c = w / 2;
  const arm = Math.max(28, c - 30);
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={w}
      height={18}
      viewBox={`0 0 ${w} 18`}
      fill="none"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* الخطّ يتلاشى نحو الطرفين فلا ينتهي نهاية حادّة */}
        <linearGradient id={`${uid}-r`} x1="0" y1="0" x2={c - 22} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id={`${uid}-l`} x1={w} y1="0" x2={c + 22} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      <path d={`M${c - 22 - arm} 9h${arm}`} stroke={`url(#${uid}-r)`} strokeWidth="1.2" strokeLinecap="round" />
      <path d={`M${c + 22 + arm} 9h-${arm}`} stroke={`url(#${uid}-l)`} strokeWidth="1.2" strokeLinecap="round" />

      {/* خرزتان */}
      <circle cx={c - 20} cy="9" r="1.7" fill="currentColor" opacity="0.85" />
      <circle cx={c + 20} cy="9" r="1.7" fill="currentColor" opacity="0.85" />

      {/* شمسة المنتصف: معيّن ومربّع متشابكان */}
      <g stroke="currentColor" fill="none" strokeLinejoin="round">
        <path d={`M${c} 1 L${c + 8} 9 L${c} 17 L${c - 8} 9Z`} strokeWidth="1.2" />
        <path d={`M${c - 5.2} 3.8 h10.4 v10.4 h-10.4Z`} strokeWidth="0.9" opacity="0.5" />
      </g>
      <circle cx={c} cy="9" r="1.9" fill="currentColor" />
    </svg>
  );
}

/** منمنمة زاوية — تُوضع مطلقة داخل بطاقة نسبية. */
export function CornerKnot({ size = 56, className = "", ...rest }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      className={className}
      {...rest}
    >
      <g stroke="currentColor" fill="none" strokeWidth={1}>
        {/* ضفيرة الزاوية */}
        <path d="M56 0v14a20 20 0 0 1-20 20H18" opacity={0.5} />
        <path d="M56 8v8a28 28 0 0 1-28 28h-9" opacity={0.32} />
        {/* أسنان كوفية صغيرة */}
        <path d="M46 0v6h-6M52 0v10h-10" opacity={0.4} />
        {/* ورقة نباتية */}
        <path d="M40 12c-6 0-10 4-10 10 6 0 10-4 10-10Z" opacity={0.35} />
      </g>
      <circle cx="44" cy="16" r="1.4" fill="currentColor" opacity={0.55} />
    </svg>
  );
}

/** لوحة (سَرلَوح) مقوّسة صغيرة — خلفية لأيقونات المزايا. */
export function ArchTile({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
    >
      <path
        d={archPath(48, 48, 1)}
        fill="currentColor"
        fillOpacity={0.1}
        stroke="currentColor"
        strokeOpacity={0.35}
        strokeWidth={1}
      />
      <path
        d={archPath(48, 48, 4.5)}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.22}
        strokeWidth={0.8}
      />
    </svg>
  );
}
