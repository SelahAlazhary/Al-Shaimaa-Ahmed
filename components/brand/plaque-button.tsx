"use client";

/**
 * زرّ «اللوح» — لوح مخطوط مرسوم بـSVG.
 * ------------------------------------------------------------------
 * مستطيل بأركان أربعة مقصوصة، بحدّ ذهبي خارجي وخيط داخلي رفيع يتبع
 * القصّ، ومنمنمة في كل ركن، ونقطتين عند منتصف الضلعين، ولمعة تمرّ
 * عند التمرير.
 *
 * المقاس يتبع النصّ — ثلاث قواعد:
 *   ١) لا عرض ولا ارتفاع مفروضان. الحشو وحده يحدّد المقاس.
 *   ٢) الحشو بوحدة `em`، فيكبر ويصغر مع حجم الخطّ تلقائياً — لو غيّرت
 *      حجم النصّ تغيّر الزرّ معه بنفس النسبة.
 *   ٣) ارتفاع السطر حقيقي (لا `leading-none`) حتى يتّسع الصندوق
 *      لنزول الحروف العربية ونقاطها بدل أن تلامس الحدّ.
 *
 * ثم يُقاس **الصندوق الخارجي** (border-box) بـResizeObserver وتُرسم
 * الهندسة بالبكسل الحقيقي — لا تمديد viewBox، فلا تشوّه في الزوايا ولا
 * تفاوت في سُمك الحدّ.
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
  /** الحشو الأفقي بوحدة em — يتبع حجم الخطّ. */
  padX = 1.75,
  /** الحشو الرأسي بوحدة em — يتبع حجم الخطّ. */
  padY = 0.72,
  /** حجم نصّ الزرّ. غيّره ليكبر الزرّ كلّه بنفس النسبة. */
  fontSize = "1.05rem",
  className = "",
  style,
  type = "button",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: Variant;
  padX?: number;
  padY?: number;
  fontSize?: string;
  className?: string;
  style?: React.CSSProperties;
  type?: "button" | "submit";
}) {
  const uid = useUid("plq");
  const ref = useRef<HTMLElement | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    /**
     * نقيس الصندوق الخارجي دائماً — هو ما يشغله الزرّ فعلاً على الصفحة.
     * (contentRect يستبعد الحشو، فلو استُخدم لرُسم اللوح أصغر من الزرّ
     *  بمقدار الحشو كلّه وخرج النصّ خارج الإطار.)
     */
    const measure = () => {
      const r = el.getBoundingClientRect();
      setBox((prev) => {
        const w = Math.round(r.width);
        const h = Math.round(r.height);
        return prev.w === w && prev.h === h ? prev : { w, h };
      });
    };

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();

    // الخطوط العربية تُحمّل بعد أول رسم، فيتغيّر عرض النصّ — نعيد القياس
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    fonts?.ready.then(measure).catch(() => {});

    return () => ro.disconnect();
  }, []);

  const { w, h } = box;
  const ink = variant === "ink";
  const ready = w > 0 && h > 0;

  // القصّ يتناسب مع الارتفاع والعرض معاً — يبقى متناسقاً في أي مقاس
  const cut = Math.max(5, Math.round(Math.min(h * 0.28, w * 0.14)));
  const mid = h / 2;

  /** مستطيل بأركان أربعة مقصوصة (لوح المخطوط). */
  const plaque = (inset: number) => {
    const x0 = inset;
    const y0 = inset;
    const x1 = w - inset;
    const y1 = h - inset;
    const c = Math.max(3, cut - inset * 0.6);
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
  const rule = ready ? plaque(4.5) : "";

  /** منمنمة ركن: ضلعان قصيران داخل الركن — بنِسَب القصّ نفسه. */
  const knot = (x: number, y: number, sx: number, sy: number) => {
    const a = cut * 0.56; // بُعد البداية عن الركن
    const b = cut * 0.22; // إزاحة الضلع الموازي
    const l = cut * 0.28; // طول الضلع
    return `M${x + a * sx} ${y + b * sy} h${l * sx} M${x + b * sx} ${y + a * sy} v${l * sy}`;
  };

  const dotR = Math.max(1.4, Math.round(h * 0.045 * 10) / 10);

  const body = (
    <>
      {ready && (
        <svg
          aria-hidden="true"
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          fill="none"
          className="pointer-events-none absolute left-0 top-0"
        >
          <defs>
            <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2={w} y2={h} gradientUnits="userSpaceOnUse">
              {ink ? (
                <>
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="65%" stopColor="hsl(var(--primary))" />
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

            <linearGradient id={`${uid}-sheen`} x1="0" y1="0" x2={h * 2} y2={h} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fff" stopOpacity="0" />
              <stop offset="50%" stopColor="#fff" stopOpacity={ink ? 0.28 : 0.5} />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>

            <clipPath id={`${uid}-clip`}>
              <path d={outer} />
            </clipPath>
          </defs>

          <path d={outer} fill={`url(#${uid}-fill)`} />

          <g clipPath={`url(#${uid}-clip)`}>
            <path d={`M0 0 H${w} V${mid * 0.7} H0 Z`} fill="#fff" fillOpacity={ink ? 0.09 : 0.45} />
            <rect className="plq-sheen" x={-h * 2} y="0" width={h * 2} height={h} fill={`url(#${uid}-sheen)`} />
          </g>

          {/* حدّ ذهبي خارجي — مرسوم داخل الحدّ حتى لا يُقصّ نصفه */}
          <path
            d={plaque(ink ? 0.9 : 0.75)}
            stroke={`url(#${uid}-gold)`}
            strokeWidth={ink ? 1.8 : 1.5}
            strokeLinejoin="round"
          />

          {/* خيط داخلي يتبع القصّ */}
          <path
            d={rule}
            stroke={ink ? "hsl(var(--gold-light))" : `url(#${uid}-gold)`}
            strokeWidth="0.85"
            strokeOpacity={ink ? 0.4 : 0.28}
            strokeLinejoin="round"
          />

          {/* منمنمات الأركان الأربعة */}
          <g stroke={`url(#${uid}-gold)`} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.8" fill="none">
            <path d={knot(cut, 0, 1, 1)} />
            <path d={knot(w - cut, 0, -1, 1)} />
            <path d={knot(cut, h, 1, -1)} />
            <path d={knot(w - cut, h, -1, -1)} />
          </g>

          {/* نقطتان عند منتصف الضلعين القصيرين */}
          <g fill={`url(#${uid}-gold)`} opacity="0.9">
            <circle cx={Math.max(4, cut * 0.5)} cy={mid} r={dotR} />
            <circle cx={w - Math.max(4, cut * 0.5)} cy={mid} r={dotR} />
          </g>
        </svg>
      )}

      {/* ارتفاع سطر حقيقي: يتّسع لنزول الحروف العربية ونقاطها */}
      <span
        className={`relative z-10 inline-flex items-center gap-2.5 font-display leading-[1.4] ${
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

  /**
   * لا عرض ولا ارتفاع مفروضان — الحشو بوحدة em حول النصّ هو كل شيء،
   * فيصير المقاس مشتقّاً من النصّ نفسه ومن حجم خطّه.
   */
  const sized: React.CSSProperties = {
    fontSize,
    paddingInline: `${padX}em`,
    paddingBlock: `${padY}em`,
    ["--sweep" as string]: `${w + h * 2}px`,
    ...style,
  };

  if (href) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        aria-disabled={disabled || undefined}
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
