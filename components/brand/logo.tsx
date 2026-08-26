"use client";

/**
 * علامة المنصّة — «شمسة القلم».
 * ------------------------------------------------------------
 * شمسة مخطوطة (ثماني متشابك داخل حلقة مُلَـألأة بالخرز الذهبي)
 * وفي قلبها سنّ القلم العربي المائل — رمز الكتابة والخطّ.
 * كل شيء مرسوم بمسارات دقيقة على شبكة 48، ويعمل من 20px حتى 200px.
 *
 * • الشعار المرفوع من الأدمن (إن وُجد) له الأولوية؛ وإلا تُرسم العلامة المتّجهة.
 * • النص يبقى HTML (لا SVG) حفاظاً على البحث وقارئات الشاشة والاتجاه RTL.
 */
import Image from "next/image";
import { useUid } from "./use-uid";
import { mediaSrc } from "@/lib/media";

/** خرزات الحلقة الذهبية — 16 حبّة موزّعة بالتساوي. */
function beads(cx: number, cy: number, r: number, n = 16, rr = 0.95) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return <circle key={i} cx={cx + r * Math.cos(a)} cy={cy + r * Math.sin(a)} r={rr} />;
  });
}

/**
 * العلامة المتّجهة وحدها.
 * detail=false يُسقط الخرز والنقاط الدقيقة — للمقاسات الصغيرة جداً (< 26px).
 */
export function BrandMark({
  size = 40,
  className = "",
  detail,
}: {
  size?: number;
  className?: string;
  detail?: boolean;
}) {
  const uid = useUid("mark");
  const fine = detail ?? size >= 26;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      focusable="false"
      aria-hidden="true"
      className={className}
    >
      <defs>
        {/* قرص الحبر */}
        <linearGradient id={`${uid}-ink`} x1="12" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--glow))" />
        </linearGradient>
        {/* التذهيب */}
        <linearGradient id={`${uid}-gold`} x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(var(--gold-deep))" />
          <stop offset="45%" stopColor="hsl(var(--gold-light))" />
          <stop offset="100%" stopColor="hsl(var(--gold))" />
        </linearGradient>
      </defs>

      {/* الحلقة الخارجية المُذهّبة */}
      <circle cx="24" cy="24" r="22.6" stroke={`url(#${uid}-gold)`} strokeWidth="1" opacity="0.85" />
      {fine && (
        <g fill={`url(#${uid}-gold)`} opacity="0.7">
          {beads(24, 24, 20.6)}
        </g>
      )}
      <circle cx="24" cy="24" r="18.4" stroke={`url(#${uid}-gold)`} strokeWidth="0.9" opacity="0.55" />

      {/* الشمسة: مربّع ومعيّن متشابكان بنفس نصف القطر */}
      <g
        stroke={`url(#${uid}-gold)`}
        strokeWidth="1.15"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
      >
        <path d="M11.3 11.3h25.4v25.4H11.3Z" />
        <path d="M24 6 42 24 24 42 6 24Z" />
      </g>

      {/* قرص الحبر في القلب */}
      <circle cx="24" cy="24" r="12.4" fill={`url(#${uid}-ink)`} />
      <circle cx="24" cy="24" r="12.4" stroke={`url(#${uid}-gold)`} strokeWidth="0.9" opacity="0.75" />

      {/* سنّ القلم — مائل كما يُمسك القلم عند الكتابة */}
      <g transform="rotate(-30 24 24)">
        <path
          d="M24 12.6 28.7 18.5V27.3L24 34.8 19.3 27.3V18.5Z"
          fill="#fff"
          fillOpacity="0.97"
        />
        {/* شقّ السنّ */}
        <path d="M24 23.4V34.8" stroke={`url(#${uid}-ink)`} strokeWidth="1.35" strokeLinecap="round" />
        {/* ثقب التنفّس */}
        <circle cx="24" cy="21.5" r="1.55" fill={`url(#${uid}-ink)`} />
      </g>

      {/* نقاط الإعجام الذهبية في فتحات الشمسة */}
      {fine && (
        <g fill={`url(#${uid}-gold)`}>
          <circle cx="24" cy="9.4" r="1.15" />
          <circle cx="38.6" cy="24" r="1.15" />
          <circle cx="24" cy="38.6" r="1.15" />
          <circle cx="9.4" cy="24" r="1.15" />
        </g>
      )}
    </svg>
  );
}

/**
 * كتلة الهوية الكاملة: العلامة + الاسم والوصف (نص HTML).
 * الاسم بخطّ المخطوط (display) والوصف بالكوفي مع تباعد حروف خفيف.
 */
export function BrandLockup({
  brand,
  subtitle,
  logo,
  size = 40,
  compact = false,
  className = "",
}: {
  brand: string;
  subtitle?: string;
  logo?: string;
  size?: number;
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span
        className="grid shrink-0 place-items-center overflow-hidden rounded-2xl"
        style={{ width: size, height: size }}
      >
        {logo ? (
          <Image
            src={mediaSrc(logo)}
            alt=""
            width={size}
            height={size}
            unoptimized
            referrerPolicy="no-referrer"
            className="size-full object-cover"
          />
        ) : (
          <BrandMark size={size} />
        )}
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[0.95rem] font-bold tracking-tight">{brand}</span>
          {subtitle && (
            <span className="font-kufi mt-1.5 text-[9px] tracking-[0.14em] text-muted-foreground">
              {subtitle}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
