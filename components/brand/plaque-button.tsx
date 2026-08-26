"use client";

/**
 * زرّ «اللوح» — لوح مخطوط مرسوم بـSVG.
 * ------------------------------------------------------------------
 * مستطيل بأركان أربعة مقصوصة، بحدّ ذهبي خارجي وخيط داخلي رفيع يتبع
 * القصّ، ومنمنمة في كل ركن، ونقطتين عند منتصف الضلعين، ولمعة تمرّ
 * عند التمرير.
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
  height = 112,
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
  const cut = 14;   // طول القصّ عند كل ركن
  const ink = variant === "ink";

  // الهندسة لا تُرسم قبل معرفة العرض الحقيقي (تفادي وميض شكل خاطئ)
  const ready = w > cut * 4;

  /** مستطيل بأركان أربعة مقصوصة (لوح المخطوط). */
  const plaque = (inset: number) => {
    const x0 = inset;
    const y0 = inset;
    const x1 = w - inset;
    const y1 = h - inset;
    const c = cut - inset * 0.6;
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
  };

  const outer = ready ? plaque(0) : "";
  const rule = ready ? plaque(5) : "";

  /** منمنمة ركن: ضلعان قصيران ونقطة. */
  const knot = (x: number, y: number, sx: number, sy: number) =>
    `M${x + 11 * sx} ${y + 4 * sy} h${5 * sx} M${x + 4 * sx} ${y + 11 * sy} v${5 * sy}`;

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

          {/* حدّ ذهبي خارجي */}
          <path d={outer} stroke={`url(#${uid}-gold)`} strokeWidth={ink ? 2 : 1.7} strokeLinejoin="round" />

          {/* خيط داخلي رفيع — يتبع القصّ فيبدو إطاراً مخطوطاً لا شكلاً ثانياً */}
          <path
            d={rule}
            stroke={ink ? "hsl(var(--gold-light))" : `url(#${uid}-gold)`}
            strokeWidth="0.9"
            strokeOpacity={ink ? 0.42 : 0.3}
            strokeLinejoin="round"
          />

          {/* منمنمات الأركان الأربعة */}
          <g
            stroke={`url(#${uid}-gold)`}
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeOpacity="0.8"
            fill="none"
          >
            <path d={knot(cut, 0, 1, 1)} />
            <path d={knot(w - cut, 0, -1, 1)} />
            <path d={knot(cut, h, 1, -1)} />
            <path d={knot(w - cut, h, -1, -1)} />
          </g>

          {/* نقطتان مذهّبتان عند منتصف الضلعين القصيرين */}
          <g fill={`url(#${uid}-gold)`} opacity="0.9">
            <circle cx={cut * 0.62} cy={mid} r="2.2" />
            <circle cx={w - cut * 0.62} cy={mid} r="2.2" />
          </g>
        </svg>
      )}

      {/* النصّ فوق الرسم */}
      <span
        className={`relative z-10 inline-flex items-center gap-2.5 font-display text-[1.05rem] ${
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
    // مسافة تضمن ابتعاد النصّ عن الطرف المدبّب مهما طال
    // ثابت لا يتبع الارتفاع: زيادة الطول يجب ألا تزيد العرض
    paddingInline: 40,
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
