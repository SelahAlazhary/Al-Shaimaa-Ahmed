import type { PayMethod, PayRequest, SitePlan, Subject } from "./types";
import { planPrice } from "./plans";

/**
 * منطق بوّابة الدفع المشترك بين المتصفّح والخادم.
 * ------------------------------------------------------------------
 * كل تحقّق هنا يُستدعى مرّتين: في الواجهة ليرى الطالب خطأه فوراً، وفي
 * الخادم لأن الواجهة لا تُؤتمَن. مصدر واحد فلا تفترق القاعدتان.
 */

/** أيقونة/تسمية نوع الطريقة. */
export const KIND_LABEL: Record<string, string> = {
  wallet: "محفظة هاتف",
  bank: "حساب بنكي",
  instapay: "إنستاباي",
  fawry: "فوري",
  link: "رابط دفع",
  other: "تحويل",
};

/** اسم الحقل الذي يُحوَّل إليه — يختلف باختلاف النوع فلا يصحّ توحيده. */
export function numberLabel(kind: string): string {
  switch (kind) {
    case "bank": return "رقم الحساب / IBAN";
    case "instapay": return "عنوان إنستاباي";
    case "fawry": return "كود فوري";
    case "link": return "رابط الدفع";
    case "wallet": return "رقم المحفظة";
    default: return "بيانات التحويل";
  }
}

/** تطبيع الأرقام العربية إلى لاتينية — الطالب يكتب بلوحة عربية كثيراً. */
export function normalizeDigits(v: string): string {
  return (v ?? "").replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** الطرق المعروضة للطالب — المفعَّلة وحدها، مرتّبة. */
export function activeMethods(list: PayMethod[] | undefined): PayMethod[] {
  return (list ?? [])
    .filter((m) => m.active && (m.number ?? "").trim())
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/** سعر الخطة النهائي — البوّابة تحسبه من الخطة لا من الواجهة. */
export function planAmount(plan: SitePlan): number {
  return planPrice(plan).price;
}

/**
 * نطاق الخطة كمعرّف كورس — يطابق ما تفعله أكواد التفعيل:
 * «كل المواد» = *، «فصل دراسي» = T1/T2، وإلا معرّف الكورس.
 */
export function planTarget(plan: SitePlan, fallbackSubjectId?: string): string {
  if (plan.scope === "all") return "*";
  if (plan.scope === "term") return `T${plan.termNo ?? 1}`;
  return plan.subjectId || fallbackSubjectId || "";
}

export function targetName(target: string, subjects: Subject[]): string {
  if (target === "*") return "كل المواد";
  if (/^T[12]$/.test(target)) return `كل مواد الفصل ${target === "T2" ? "الثاني" : "الأول"}`;
  return subjects.find((s) => s.id === target)?.name ?? "كورس";
}

/** ما ينقص الطلب — نصّ عربي واحد أو null إن كان سليماً. */
export function requestProblem(
  f: { methodId?: string; senderName?: string; senderAccount?: string; receipt?: string },
  rules: { requireReceipt?: boolean; requireSender?: boolean }
): string | null {
  if (!(f.methodId ?? "").trim()) return "اختر طريقة الدفع";
  /*
    الرقم المُحوَّل منه هو ما يُطابَق به التحويل في كشف الحساب — بدونه
    تبقى المراجعة تخميناً، فهو مطلوب دائماً لا بحسب الإعداد.
  */
  if (!(f.senderAccount ?? "").trim()) {
    return "اكتب الرقم أو الحساب الذي حوّلت منه";
  }
  if (rules.requireSender !== false && !(f.senderName ?? "").trim()) {
    return "اكتب اسم من حوّل المبلغ";
  }
  if (rules.requireReceipt !== false && !(f.receipt ?? "").trim()) {
    return "أرفق صورة إيصال التحويل";
  }
  return null;
}

/** كود تفعيل جديد — نفس صيغة شاشة الأكواد فلا يختلف شكلان في المنصّة. */
export function newActivationCode(taken: Set<string>): string {
  const seg = () => Math.random().toString(36).slice(2).padEnd(4, "0").slice(0, 4).toUpperCase();
  for (let i = 0; i < 200; i++) {
    const code = `EMZ-${seg()}-${seg()}`;
    if (!taken.has(code)) return code;
  }
  return `EMZ-${Date.now().toString(36).toUpperCase().slice(-8)}`;
}

export const STATUS_LABEL: Record<PayRequest["status"], string> = {
  pending: "قيد المراجعة",
  approved: "مقبول",
  rejected: "مرفوض",
};
