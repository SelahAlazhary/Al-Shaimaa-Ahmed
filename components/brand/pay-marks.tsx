/**
 * شعارات طرق الدفع.
 * ------------------------------------------------------------------
 * كانت الطريقة تُعرض بأوّل حرف من اسمها على مربّع ملوّن، فتتشابه الطرق
 * في نظرة سريعة — والطالب يبحث عن محفظته هو بين عدّة خيارات، فالتمييز
 * البصري هنا وظيفةٌ لا زينة.
 *
 * وهذه علاماتٌ مرسومة بأسلوب المنصّة تدلّ على الفئة وتتميّز بلونها، لا
 * نسخٌ من العلامات التجارية الرسمية — ومن أراد الشعار الرسمي رفعه من
 * اللوحة، والمرفوعُ يغلب دائماً.
 */

export type PayMarkId =
  | "vodafone" | "etisalat" | "orange" | "we"
  | "instapay" | "fawry" | "bank" | "link" | "wallet";

/** لون كل علامة — يميّزها قبل أن تُقرأ. */
export const MARK_COLOR: Record<PayMarkId, string> = {
  vodafone: "#e60000",
  etisalat: "#8dc63f",
  orange: "#ff7900",
  we: "#7b2d8b",
  instapay: "#6d3bd6",
  fawry: "#ffb600",
  bank: "#1f4e79",
  link: "#0ea5e9",
  wallet: "#173972",
};

/**
 * أيّ علامة تناسب هذه الطريقة؟
 * الاسمُ أدقّ من النوع: «فودافون كاش» و«اتصالات كاش» كلاهما محفظة،
 * والفرقُ بينهما هو ما يبحث عنه الطالب.
 */
export function markFor(kind: string, name: string): PayMarkId {
  const n = (name ?? "").trim();
  if (/فودافون|vodafone/i.test(n)) return "vodafone";
  if (/اتصالات|etisalat/i.test(n)) return "etisalat";
  if (/أورنج|اورنج|orange/i.test(n)) return "orange";
  if (/\bwe\b|وي كاش|وي باي/i.test(n)) return "we";
  if (/انستا|إنستا|instapay/i.test(n)) return "instapay";
  if (/فوري|fawry/i.test(n)) return "fawry";
  if (kind === "instapay") return "instapay";
  if (kind === "fawry") return "fawry";
  if (kind === "bank") return "bank";
  if (kind === "link") return "link";
  return "wallet";
}

/** رسم العلامة — أبيضُ فوق خلفية لونها، فيبقى واضحاً في الوضعين. */
function Glyph({ id }: { id: PayMarkId }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (id) {
    case "bank":
      /* واجهة بأعمدة — أشهر صورة للمصرف */
      return (
        <>
          <path d="M3 9.5 12 4.5l9 5" {...s} />
          <path d="M5.5 10v7M9.5 10v7M14.5 10v7M18.5 10v7" {...s} />
          <path d="M3.5 19.5h17" {...s} />
        </>
      );
    case "instapay":
      /* سهمان متعاكسان — تحويلٌ لحظي بين طرفين */
      return (
        <>
          <path d="M6 9.5h11l-3-3" {...s} />
          <path d="M18 14.5H7l3 3" {...s} />
        </>
      );
    case "fawry":
      /* إيصالٌ بخطوطه وحزٌّ سفليّ */
      return (
        <>
          <path d="M6 4.5h12v13.5l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4Z" {...s} />
          <path d="M9 8.5h6M9 12h4" {...s} />
        </>
      );
    case "link":
      return (
        <>
          <path d="M10.5 13.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.54 3.54 0 0 0-5-5L11.5 7.5" {...s} />
          <path d="M13.5 10.5a3.5 3.5 0 0 0-5 0L6 13a3.54 3.54 0 0 0 5 5l1.5-1.5" {...s} />
        </>
      );
    default:
      /* محفظة الهاتف — جهازٌ في وسطه علامة عملة */
      return (
        <>
          <rect x="7" y="3" width="10" height="18" rx="2.4" {...s} />
          <path d="M12 8.5v7M10 10.5h3a1.6 1.6 0 0 1 0 3h-2a1.6 1.6 0 0 0 0 3h3" {...s} />
        </>
      );
  }
}

/**
 * شعار طريقة الدفع.
 * الشعارُ المرفوع من اللوحة يغلب دائماً — فمن رفع علامته الرسمية رآها.
 */
export function PayMark({
  kind,
  name,
  logo,
  color,
  className = "size-9",
}: {
  kind: string;
  name: string;
  logo?: string;
  color?: string;
  className?: string;
}) {
  if (logo) {
    /*
      الشعار المرفوع يُحتوى لا يُقصّ: شعارات المحافظ عريضة غالباً،
      والقصُّ يبتر اسمَها فيصير مربّعاً ملوّناً لا يدلّ على شيء.
      وخلفيةٌ فاتحة تحته لأن أكثرها مرسومٌ ليقع على أبيض.
    */
    return (
      <span
        aria-hidden
        /* `block` شرطٌ لا زينة: الـspan افتراضياً inline فيتجاهل العرض
           والارتفاع وينهار إلى شريحة رفيعة — وهو ما أخفى مربّع الرفع. */
        className={`${className} block shrink-0 rounded-xl border border-border bg-white bg-contain bg-center bg-no-repeat`}
        style={{ backgroundImage: `url(${logo})` }}
      />
    );
  }

  const id = markFor(kind, name);
  return (
    <span
      aria-hidden
      className={`${className} grid shrink-0 place-items-center rounded-xl text-white`}
      style={{ background: color || MARK_COLOR[id] }}
    >
      <svg viewBox="0 0 24 24" className="size-[62%]" role="presentation">
        <Glyph id={id} />
      </svg>
    </span>
  );
}
