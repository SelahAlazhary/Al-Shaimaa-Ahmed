import type { SitePlan, CoursePrice, CoursePriceKind, TermNo } from "./types";

/**
 * سعر الخطة بعد الخصم — مصدر واحد للحساب يستخدمه الموقع والبوابة واللوحة.
 * الخصم يسري فقط إذا كان مفعّلاً ولم تنتهِ مدّته.
 */
export type PricedPlan = {
  price: number;      // السعر المعروض (بعد الخصم)
  original: number;   // السعر قبل الخصم
  off: number;        // قيمة التوفير
  percent: number;    // نسبة التوفير ٪
  active: boolean;    // هل الخصم ساري؟
  label?: string;
  until?: string | null;
};

/**
 * هل هذه الخطة معروضة لهذا الطالب؟
 * الخطة بلا شعبة معروضة للجميع، وبشعبة تظهر لطلاب تلك الشعبة وحدهم.
 * الزائر (بلا حساب) يرى كل الخطط الظاهرة — لا شعبة تُقارَن بها بعد.
 */
export type PlanAudience = {
  stage?: string; grade?: string; system?: string;
  track?: string; branch?: string; term?: string; gender?: string;
};

/** بيانات الطالب التي تُطابَق بها فئة الخطة — أسماء التسجيل نفسها. */
export type StudentProfile = {
  stage?: string; grade?: string; eduSystem?: string;
  track?: string; branch?: string; termName?: string; gender?: string;
};

export function planForStudent(
  plan: { track?: string; audience?: PlanAudience },
  student: StudentProfile | null | undefined
): boolean {
  /* الزائر يرى كل الخطط الظاهرة — لا بيانات تسجيل تُقارَن بها بعد. */
  if (!student) return true;

  /* `track` القديم يبقى مفهوماً، والفئة الجديدة تغلب عليه إن ضُبطت. */
  const a = plan.audience ?? {};
  const pairs: [string | undefined, string | undefined][] = [
    [a.stage, student.stage],
    [a.grade, student.grade],
    [a.system, student.eduSystem],
    [a.track ?? plan.track, student.track],
    [a.branch, student.branch],
    [a.term, student.termName],
    [a.gender, student.gender],
  ];

  /* الحقل الفارغ لا يُضيّق شيئاً — الخطة العامّة تظهر للجميع بلا ضبط. */
  return pairs.every(([want, has]) => {
    const w = (want ?? "").trim();
    return !w || w === (has ?? "").trim();
  });
}

/** وصف الفئة بالعربية — يُعرض في اللوحة وفي بطاقة الخطة. */
export function audienceLabel(plan: { track?: string; audience?: PlanAudience }): string {
  const a = plan.audience ?? {};
  const parts = [a.stage, a.grade, a.system, a.track ?? plan.track, a.branch, a.term, a.gender]
    .map((v) => (v ?? "").trim())
    .filter(Boolean);
  return parts.length ? parts.join(" · ") : "كل الطلاب";
}

/**
 * رقم واتساب التفعيل لخطة بعينها.
 * لكل خطة رقم اختياري — تُوجَّه به رسائل تفعيلها إلى المسؤول عنها،
 * وإن تُرك فارغاً رجعت الخطة إلى رقم المنصّة العام.
 * يُطبَّع الرقم من الأرقام العربية والمسافات والرموز.
 */
export function planWaLink(plan: { whatsapp?: string } | null | undefined, fallback: string, text: string): string {
  const raw = (plan?.whatsapp ?? "").trim() || fallback;
  const num = raw
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[^\d]/g, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

export function planPrice(plan: SitePlan, now = Date.now()): PricedPlan {
  const original = Math.max(0, plan.price ?? 0);
  const d = plan.discount;
  const notExpired = !d?.until || new Date(d.until).getTime() > now;
  const active = Boolean(d?.active && d.value > 0 && notExpired);

  if (!active || !d) {
    return { price: original, original, off: 0, percent: 0, active: false };
  }

  const off = d.type === "percent"
    ? Math.round((original * Math.min(100, d.value)) / 100)
    : Math.min(original, Math.round(d.value));
  const price = Math.max(0, original - off);

  return {
    price,
    original,
    off,
    percent: original ? Math.round((off / original) * 100) : 0,
    active: off > 0,
    label: d.label,
    until: d.until ?? null,
  };
}

/** لون الخطة (أو لون الثيم الافتراضي). */
export function planColor(plan: SitePlan): string | undefined {
  return plan.color && /^#?[0-9a-fA-F]{3,8}$/.test(plan.color) ? plan.color : undefined;
}

/* ------------------------------------------------------------------ */
/*  خيارات سعر الكورس                                                  */
/* ------------------------------------------------------------------ */

/** مدّة كل نوع بالأيام — الترم يتبع تاريخ نهايته لا عدداً. */
const KIND_DAYS: Record<string, number | null> = {
  month: 30,
  lesson: 7,
  once: null,
  term: null,
  custom: null,
};

export const COURSE_PRICE_KINDS: { id: CoursePriceKind; label: string; hint: string }[] = [
  { id: "month", label: "شهري", hint: "يفتح الكورس ٣٠ يوماً" },
  { id: "term", label: "الترم كامل", hint: "حتى تاريخ نهاية الترم" },
  { id: "lesson", label: "حصّة واحدة", hint: "وصول قصير (٧ أيام)" },
  { id: "once", label: "مرّة واحدة", hint: "وصول دائم بلا انتهاء" },
  { id: "custom", label: "مدّة مخصّصة", hint: "تحدّد عدد الأيام بنفسك" },
];

/**
 * خيارات سعر الكورس كخطط.
 * ------------------------------------------------------------------
 * تُحوَّل إلى شكل الخطة لأن كل ما بعدها — البوّابة، الأكواد، حساب
 * السعر، مدّة الاشتراك — مبنيّ على الخطة. تحويلها هنا يعني مساراً
 * واحداً للشراء لا مسارين يفترقان في السلوك.
 *
 * المعرّف مسبوق بـ`CP:` فلا يلتبس بخطة حقيقية، ويُعاد بناؤه من الكورس
 * وقت الحاجة فلا يُخزَّن مرّتين.
 */
export function coursePricePlans(subject: {
  id: string; name: string; term?: TermNo; prices?: CoursePrice[];
}): SitePlan[] {
  return (subject.prices ?? [])
    .filter((p) => (p.label ?? "").trim())
    .map((p, i) => ({
      id: `CP:${subject.id}:${p.id}`,
      name: p.label.trim(),
      kind: p.kind === "term" ? "term" : p.kind === "custom" ? "custom" : "month",
      scope: "subject",
      subjectId: subject.id,
      termNo: subject.term,
      price: Math.max(0, p.price ?? 0),
      durationDays: p.durationDays ?? KIND_DAYS[p.kind] ?? null,
      endsAt: null,
      badge: p.badge,
      highlight: p.highlight,
      desc: p.desc,
      discount: p.discount,
      visible: true,
      order: i,
      createdAt: "",
    }));
}

/** خطة بمعرّفها — من الخطط المحفوظة أو من خيارات أسعار الكورسات. */
export function resolvePlan(
  id: string,
  plans: SitePlan[],
  subjects: { id: string; name: string; term?: TermNo; prices?: CoursePrice[] }[]
): SitePlan | undefined {
  const direct = plans.find((p) => p.id === id);
  if (direct) return direct;
  const m = id.match(/^CP:([^:]+):/);
  if (!m) return undefined;
  const subject = subjects.find((s) => s.id === m[1]);
  return subject ? coursePricePlans(subject).find((p) => p.id === id) : undefined;
}

/**
 * خطط الشراء المعروضة لهذا الطالب في هذا السياق.
 * ------------------------------------------------------------------
 * خيارات سعر الكورس أوّلاً (الأقرب إليه) ثم خطط المنصّة التي تشمله.
 * بلا كورس — كصفحة الدفع العامّة — تُعرض خطط «كل المواد» والفصول.
 *
 * مصدر واحد يستخدمه صندوق الشراء وصفحة الدفع، فلا تفترق القائمتان.
 */
export function plansFor(
  subject: { id: string; name: string; term?: TermNo; prices?: CoursePrice[] } | undefined,
  plans: SitePlan[],
  student: StudentProfile | null | undefined
): SitePlan[] {
  const own = subject ? coursePricePlans(subject) : [];
  const site = plans
    .filter((p) => {
      if (!planForStudent(p, student)) return false;
      if (!subject) return p.scope === "all" || p.scope === "term";
      return (
        p.scope === "all" ||
        (p.scope === "term" && p.termNo === (subject.term ?? 1)) ||
        p.subjectId === subject.id
      );
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.price - b.price);
  return [...own, ...site];
}
