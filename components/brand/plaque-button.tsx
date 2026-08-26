"use client";

/**
 * زرّ «اللوح» — خرطوش مخطوط مرسوم بـSVG.
 * ------------------------------------------------------------------
 * الشكل سداسي بطرفين مدبّبين (كخرطوش المخطوطات) بحدّ ذهبي مزدوج
 * ووردتين عند الطرفين ولمعة تمرّ عند التمرير.
 *
 * لماذا نقيس العرض بـResizeObserver بدل preserveAspectRatio="none"؟
 * لأن التمديد يشوّه زوايا الطرفين المدبّبين ويجعل الحدّ غير متساوي
 * السُمك. بقياس العرض الفعلي نرسم الهندسة بالبكسل الحقيقي فتبقى
 * الزوايا كما صُمّمت مهما طال النصّ أو تغيّر الخطّ.
 *
 * النصّ يبقى HTML فوق الرسم — حفاظاً على قارئات الشاشة والاتجاه RTL.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useUid } from "./use-uid";

type Variant = "ink" | "foil";

export function PlaqueButton({
  children,
  href,
  onClick,
  disabled,
  variant = "ink",
  height = 54,
  className = "",
  style,
  type = "button",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: Variant;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  type?: "button" | "submit";
}) {
  const uid = useUid("plq");
  const ref = useRef<HTMLElement | null>(null);
  const [w, setW] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    setW(Math.round(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);

  const h = height;
  const mid = h / 2;
  const notch = Math.round(h * 0.3); // عمق تدبيب الطرف
  const ink = variant === "ink";

  // الهندسة لا تُرسم قبل معرفة العرض الحقيقي (تفادي وميض شكل خاطئ)
  const ready = w > notch * 2 + 8;
  const outer = ready
    ? `M${notch} 0 H${w - notch} L${w} ${mid} L${w - notch} ${h} H${notch} L0 ${mid} Z`
    : "";
  const i = 5;
  const inner = ready
    ? `M${notch + i * 0.8} ${i} H${w - notch - i * 0.8} L${w - i * 0.6} ${mid} L${w - notch - i * 0.8} ${h - i} H${notch + i * 0.8} L${i * 0.6} ${mid} Z`
    : "";

  const body = (
    <>
      {/* الرسم */}
      {ready && (
        <svg
          aria-hidden="true"
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          fill="none"
          className="pointer-events-none absolute inset-0"
        >
          <defs>
            <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2={w} y2={h} gradientUnits="userSpaceOnUse">
              {ink ? (
                <>
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="62%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--glow))" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="hsl(var(--card))" />
                  <stop offset="100%" stopColor="hsl(var(--muted))" />
                </>
              )}
            </linearGradient>

            <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2={w} y2={h} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="hsl(var(--gold-deep))" />
              <stop offset="45%" stopColor="hsl(var(--gold-light))" />
              <stop offset="100%" stopColor="hsl(var(--gold))" />
            </linearGradient>

            {/* لمعة تمرّ داخل حدود اللوح عند التمرير */}
            <linearGradient id={`${uid}-sheen`} x1="0" y1="0" x2={h * 2} y2={h} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fff" stopOpacity="0" />
              <stop offset="50%" stopColor="#fff" stopOpacity={ink ? 0.3 : 0.55} />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>

            <clipPath id={`${uid}-clip`}>
              <path d={outer} />
            </clipPath>
          </defs>

          {/* الجسم */}
          <path d={outer} fill={`url(#${uid}-fill)`} />

          {/* لمعة علوية خفيفة تعطي بروزاً */}
          <g clipPath={`url(#${uid}-clip)`}>
            <path d={`M0 0 H${w} V${mid * 0.72} H0 Z`} fill="#fff" fillOpacity={ink ? 0.1 : 0.5} />
            <rect
              className="plq-sheen"
              x={-h * 2}
              y="0"
              width={h * 2}
              height={h}
              fill={`url(#${uid}-sheen)`}
            />
          </g>

          {/* الحدّ الذهبي المزدوج */}
          <path d={outer} stroke={`url(#${uid}-gold)`} strokeWidth={ink ? 1.6 : 1.4} />
          <path d={inner} stroke={`url(#${uid}-gold)`} strokeWidth="0.9" strokeOpacity="0.45" />

          {/* وردتان عند الطرفين المدبّبين */}
          <g fill={`url(#${uid}-gold)`}>
            <path d={`M${notch * 0.62} ${mid} l3.4 -3.4 3.4 3.4 -3.4 3.4Z`} />
            <path d={`M${w - notch * 0.62} ${mid} l3.4 -3.4 3.4 3.4 -3.4 3.4Z`} />
          </g>
        </svg>
      )}

      {/* النصّ فوق الرسم */}
      <span
        className={`relative z-10 inline-flex items-center gap-2 font-display text-[0.95rem] ${
          ink ? "text-white" : "text-primary"
        }`}
      >
        {children}
      </span>
    </>
  );

  const cls =
    `plq group relative inline-flex select-none items-center justify-center transition ` +
    `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ` +
    `focus-visible:ring-offset-background ${disabled ? "pointer-events-none opacity-60" : ""} ${className}`;

  const sized: React.CSSProperties = {
    height: h,
    paddingInline: Math.round(h * 0.85),
    // مسافة عبور اللمعة = العرض + عرض اللمعة نفسها
    ["--sweep" as string]: `${w + h * 2}px`,
    ...style,
  };

  if (href) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={cls}
        style={sized}
      >
        {body}
      </a>
    );
  }
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cls}
      style={sized}
    >
      {body}
    </button>
  );
}
