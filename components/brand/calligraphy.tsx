"use client";

/**
 * طبقة الخطّ العربي — قلب هوية المنصّة.
 * ------------------------------------------------------------
 * كلّها SVG مرسوم بمسارات (لا صور، ولا خطوط محمّلة، ولا نصّ داخل SVG)
 * فتظهر كما هي على أي جهاز، وتتلوّن من الثيم، وتتحرّك كأنها تُكتب الآن.
 *
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
