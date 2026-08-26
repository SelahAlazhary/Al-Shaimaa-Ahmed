/**
 * القيم الافتراضية (Seed).
 * المنصة تبدأ فارغة من أي بيانات — لا طلاب/مواد/أكواد/اختبارات وهمية.
 * كل المحتوى الفعلي يُضاف من لوحة الأدمن، والحسابات تُنشأ من التسجيل.
 * تبقى فقط: نصوص الواجهة (قابلة للتعديل) + حساب المالك (الأدمن).
 */
import type {
  SiteContent, SitePlan, Student, Subject, GradeRow, Code, Exam, Live, Ticket,
} from "./types";

export const defaultContent: SiteContent = {
  brand: "منصّة اللغة العربية",
  platformSubtitle: "لُغَةُ الضَّاد",
  teacher: {
    name: "الأستاذة/ معلّمة اللغة العربية",
    subject: "اللغة العربية",
    headline: "أتقن",
    tagline: "النحو والصرف والبلاغة والأدب والنصوص — في منصّة واحدة",
    bio: "معلّمة اللغة العربية — النحو، والصرف، والبلاغة، والأدب، والنصوص، والتعبير؛ بشرح يبني القاعدة قبل الحفظ، مع تطبيقات وتدريبات ومتابعة مستمرة حتى الإتقان.",
    experienceYears: 15,
    avatar: "/teacher.png",
    logo: "",
    rating: 0,
    ratingCount: 0,
    topStudents: 0,
  },
  hero: { statusPill: "التسجيل مفتوح الآن — ابدأ رحلتك مع لغة الضاد", frame: 1 },
  plansSection: {
    eyebrow: "الخطط",
    title: "اختر خطة اشتراكك",
    desc: "خطط واضحة بأسعار ثابتة — فعّل خطتك بكود التفعيل وابدأ من الدرس الأول.",
    note: "حوّل قيمة الخطة على فودافون كاش أو إنستاباي، وأرسل الإيصال على واتساب ليصلك كود التفعيل.",
  },
  cta: {
    registerLabel: "سجّل الآن",
    registerUrl: "/register",
    heroPrimaryLabel: "أنشئ حساب طالب",
    secondaryLabel: "شاهد درساً مجانياً",
    videoUrl: "",
  },
  whatsapp: "201000000000",
  social: { facebook: "#", youtube: "#", telegram: "#" },
  support: { email: "", phone: "", whatsapp: "" },
  url: "",
  theme: { layout: "light", preset: "midad", customPrimary: null },
  grades: [],
  features: [
    { icon: "BookOpenCheck", tag: "القاعدة", title: "النحو بالقاعدة لا بالحفظ", desc: "كل باب يبدأ من قاعدته وعلّتها، ثم إعراب تطبيقي على نصوص حقيقية حتى تصير الملكة عندك تلقائية.", span: "lg:col-span-2" },
    { icon: "ScrollText", tag: "البلاغة", title: "ذوق أدبي وبلاغة حيّة", desc: "الصورة البيانية والمحسّن البديعي في سياقه من الشعر والنثر — لا تعريفات مجرّدة تُنسى بعد الامتحان.", span: "" },
    { icon: "ShieldCheck", tag: "الأمان", title: "حساب آمن بجهاز واحد", desc: "حسابك مرتبط بجهازك الشخصي فقط — تجربة عادلة وآمنة لكل طالب.", span: "" },
    { icon: "MessagesSquare", tag: "المتابعة", title: "تدريب وتصحيح مستمرّ", desc: "تدريبات إعراب وتعبير بعد كل درس، واختبارات تصحّح فوراً، ودعم سريع على واتساب طوال الأسبوع.", span: "lg:col-span-2" },
  ],
  curriculum: [],
  honorStudents: [],
  faqs: [
    { q: "إزاي أشترك وأفعّل الكورس؟", a: "أنشئ حسابك، اختر الخطة المناسبة، ثم حوّل قيمتها فودافون كاش أو إنستاباي وابعت صورة الإيصال على واتساب — نراجع التحويل ونرسل لك كود التفعيل." },
    { q: "الكورس بيفضل مفتوح قد إيه؟", a: "بعد التفعيل يظل الكورس مفتوحاً لك بمشاهدة غير محدودة لكل دروسه طوال مدة الخطة." },
    { q: "إيه الفروع اللي بتتشرح؟", a: "النحو، والصرف، والبلاغة، والأدب والنصوص، والقراءة، والتعبير، والإملاء — كل فرع بمنهجه وتدريباته." },
    { q: "أنا ضعيف في النحو، أبدأ منين؟", a: "من أول درس في القاعدة — الشرح مبني بالترتيب من الصفر: الكلمة وأقسامها، ثم الإعراب والبناء، ثم الأبواب واحداً واحداً، مع تدريب بعد كل درس." },
    { q: "أقدر أفتح حسابي من أكتر من جهاز؟", a: "الحساب مرتبط بجهاز واحد لضمان تجربة عادلة وآمنة. لو احتجت تغيير الجهاز تواصل مع الدعم." },
    { q: "المحاضرات مباشرة ولا مسجّلة؟", a: "الدروس مسجّلة بجودة عالية تشاهدها في أي وقت، مع حصص بث مباشر دورية للمراجعة والإجابة عن الأسئلة." },
  ],
};

/* المنصة تبدأ فارغة تماماً — كل شيء يُضاف من لوحة الأدمن. */
/** لا توجد خطط افتراضية — تُضاف كلها من «/admin/plans». */
export const defaultPlans: SitePlan[] = [];
export const defaultStudents: Student[] = [];
export const defaultSubjects: Subject[] = [];
export const defaultGrades: GradeRow[] = [];
export const defaultCodes: Code[] = [];
export const defaultExams: Exam[] = [];
export const defaultLive: Live[] = [];
export const defaultTickets: Ticket[] = [];
export const defaultNotifications: import("./types").Notification[] = [];

/**
 * حساب المالك (الأدمن) فقط — الدخول بالبريد الإلكتروني وكلمة المرور.
 * القيم الافتراضية قابلة للتغيير عبر متغيّري البيئة ADMIN_EMAIL و ADMIN_PASSWORD.
 */
export const seedUsers = [
  {
    name: "مدير المنصّة",
    role: "admin" as const,
    username: process.env.ADMIN_EMAIL || "admin@example.com",
    password: process.env.ADMIN_PASSWORD || "ChangeMe@2026",
    active: true,
  },
];
