"use client";

/**
 * زرّ «اللوح» — لوح مخطوط: مستطيل بأركان أربعة مقصوصة، بحدّ ذهبي
 * خارجي وخيط داخلي رفيع يتبع القصّ، ومنمنمة في كل ركن، ونقطتين عند
 * منتصف الضلعين، ولمعة تمرّ عند التمرير.
 *
 * المقاس يتبع النصّ — بلا أي قياس بالجافاسكربت:
 *   • لا عرض ولا ارتفاع مفروضان؛ الحشو وحده يحدّد المقاس.
 *   • الحشو والقصّ بوحدة `em`، فيتبعان حجم الخطّ بنسبة ثابتة.
 *   • ارتفاع سطر حقيقي (لا `leading-none`) ليتّسع الصندوق لنزول
 *     الحروف العربية ونقاطها بدل أن تلامس الحدّ.
 *
 * لماذا لا SVG للشكل؟ لأن رسم اللوح بـSVG يحتاج معرفة الأبعاد بالبكسل،
 * وكان ذلك يتمّ بـResizeObserver — وهو لا يعمل في كل البيئات، فيبقى
 * الرسم على مقاس أول قياس ولا يتحدّث أبداً مع تغيّر النصّ أو الخطّ.
 * الشكل الآن `clip-path` خالص: يتبع الصندوق مهما تغيّر، بلا حساب.
 * (المنمنمات وحدها SVG لأنها ثابتة المقاس بالنسبة للخطّ.)
 *
 * النصّ يبقى HTML فوق الرسم — حفاظاً على قارئات الشاشة والاتجاه RTL.
 */
import type { ReactNode } from "react";

type Variant = "ink" | "foil";

/** منمنمة ركن: ضلعان قصيران داخل الركن. */
function Knot({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" className={`plq-knot ${className}`}>
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M4.5 1.6h4" />
        <path d="M1.6 4.5v4" />
      </g>
    </svg>
  );
}

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
  const ink = variant === "ink";

  const body = (
    <>
      {/* طبقات اللوح — كلّها clip-path، تتبع الصندوق تلقائياً */}
      <span className="plq-layer plq-plate plq-cut" aria-hidden="true" />
      <span className="plq-layer plq-face plq-cut" aria-hidden="true" />
      <span className="plq-layer plq-rule plq-cut" aria-hidden="true" />
      <span className="plq-layer plq-inner plq-cut" aria-hidden="true">
        <span className="plq-top" />
        <span className="plq-sheen" />
      </span>

      {/* منمنمات الأركان الأربعة */}
      <Knot className="left-[var(--cut)] top-0" />
      <Knot className="right-[var(--cut)] top-0 -scale-x-100" />
      <Knot className="bottom-0 left-[var(--cut)] -scale-y-100" />
      <Knot className="bottom-0 right-[var(--cut)] -scale-100" />

      {/* نقطتان عند منتصف الضلعين القصيرين */}
      <span className="plq-dot left-[0.34em]" aria-hidden="true" />
      <span className="plq-dot right-[0.34em]" aria-hidden="true" />

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
    `plq ${ink ? "plq-ink" : "plq-foil"} group relative inline-flex select-none items-center justify-center ` +
    `transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ` +
    `focus-visible:ring-offset-2 focus-visible:ring-offset-background ` +
    `${disabled ? "pointer-events-none opacity-60" : ""} ${className}`;

  /** لا عرض ولا ارتفاع مفروضان — الحشو بوحدة em حول النصّ هو كل شيء. */
  const sized: React.CSSProperties = {
    fontSize,
    paddingInline: `${padX}em`,
    paddingBlock: `${padY}em`,
    ...style,
  };

  if (href) {
    return (
      <a href={href} aria-disabled={disabled || undefined} className={cls} style={sized}>
        {body}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls} style={sized}>
      {body}
    </button>
  );
}
