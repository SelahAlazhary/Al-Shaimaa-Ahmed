/**
 * هيئات التصميم — شكل الأسطح لا ألوانها.
 * ------------------------------------------------------------------
 * الثيم يحدّد الألوان؛ الهيئة تحدّد الشكل: حوافّ اللوح والبطاقة، وزخرفة
 * الحافّة، ونمط الحدّ. الاثنان مستقلّان تماماً — أي هيئة مع أي ثيم.
 *
 * لماذا clip-path لا SVG ممدود؟ لأن رسم الشكل بـSVG يحتاج معرفة الأبعاد
 * بالبكسل (قياس بالجافاسكربت، وهو غير موثوق)، أو تمديد viewBox — وهو
 * يشوّه الأركان ويجعل سُمك الحدّ غير متساوٍ. صيغة `polygon()` بـ`calc()`
 * تتبع الصندوق مهما تغيّر بلا قياس ولا تشويه.
 *
 * الحوافّ المنحنية (موج، فصوص، قبّة) تُرسم SVG فوق الحافّة وحدها، حيث
 * التمدّد الأفقي طبيعي لا تشويه.
 */

/** زخرفة الحافّة المرسومة SVG. */
export type EdgeArt = "none" | "wave" | "scallop" | "dome" | "zigzag" | "beads" | "arch" | "teeth";

/** نمط الحدّ. */
export type BorderStyle = "single" | "double" | "beaded" | "dashed" | "none";

export type DesignShape = {
  /** صيغة clip-path — أو null لصندوق بحوافّ دائرية عادية. */
  clip: string | null;
  /** انحناء الحوافّ حين لا يوجد قصّ. */
  radius: string;
};

export type StudentDesign = {
  id: string;
  name: string;
  hint: string;
  /** شكل لوح الترحيب. */
  panel: DesignShape;
  /** شكل بطاقات المؤشّرات والكورسات. */
  tile: DesignShape;
  edge: EdgeArt;
  border: BorderStyle;
};

/* ------------------------------------------------------------------ */
/*  مولّدات الأشكال — كلّها نسبية فتتبع الصندوق                        */
/* ------------------------------------------------------------------ */

/** مستطيل بأركان أربعة مقصوصة. */
const cut = (c: string): string =>
  `polygon(${c} 0, calc(100% - ${c}) 0, 100% ${c}, 100% calc(100% - ${c}), calc(100% - ${c}) 100%, ${c} 100%, 0 calc(100% - ${c}), 0 ${c})`;

/** الركن العلوي الأيمن مطويّ (أذن الكتاب). */
const fold = (c: string): string =>
  `polygon(0 0, calc(100% - ${c}) 0, 100% ${c}, 100% 100%, 0 100%)`;

/** بطاقة تعريف: طرف مدبّب من الجهة اليمنى. */
const tag = (c: string): string =>
  `polygon(0 0, calc(100% - ${c}) 0, 100% 50%, calc(100% - ${c}) 100%, 0 100%)`;

/** شريط بطرفين مشقوقين. */
const ribbon = (c: string): string =>
  `polygon(0 0, 100% 0, calc(100% - ${c}) 50%, 100% 100%, 0 100%, ${c} 50%)`;

/** ضلعان مائلان (متوازي أضلاع). */
const slant = (c: string): string =>
  `polygon(${c} 0, 100% 0, calc(100% - ${c}) 100%, 0 100%)`;

/** سهم متتابع (شيفرون). */
const chevron = (c: string): string =>
  `polygon(0 0, calc(100% - ${c}) 0, 100% 50%, calc(100% - ${c}) 100%, 0 100%, ${c} 50%)`;

/** سداسي — ضلعان مائلان في الطرفين. */
const hex = (c: string): string =>
  `polygon(${c} 0, calc(100% - ${c}) 0, 100% 50%, calc(100% - ${c}) 100%, ${c} 100%, 0 50%)`;

/** درجات في الركنين العلويين. */
const step = (c: string): string =>
  `polygon(0 ${c}, ${c} ${c}, ${c} 0, calc(100% - ${c}) 0, calc(100% - ${c}) ${c}, 100% ${c}, 100% 100%, 0 100%)`;

/** حزّ في منتصف الحافّة العليا. */
const notch = (c: string): string =>
  `polygon(0 0, calc(50% - ${c}) 0, 50% ${c}, calc(50% + ${c}) 0, 100% 0, 100% 100%, 0 100%)`;

/** ركنان سفليّان مقصوصان فقط. */
const cutBottom = (c: string): string =>
  `polygon(0 0, 100% 0, 100% calc(100% - ${c}), calc(100% - ${c}) 100%, ${c} 100%, 0 calc(100% - ${c}))`;

/** ركنان علويّان مقصوصان فقط. */
const cutTop = (c: string): string =>
  `polygon(${c} 0, calc(100% - ${c}) 0, 100% ${c}, 100% 100%, 0 100%, 0 ${c})`;

/** ركنان متقابلان مقصوصان (قطري). */
const diagonal = (c: string): string =>
  `polygon(${c} 0, 100% 0, 100% calc(100% - ${c}), calc(100% - ${c}) 100%, 0 100%, 0 ${c})`;

/**
 * حافّة معرّجة — أسنان متتابعة على الحافّتين العليا والسفلى.
 * تُبنى كمضلّع بنقاط كثيرة بالنسبة المئوية، فتتبع أي عرض بلا قياس.
 */
function jagged(teeth: number, depth: string): string {
  const step = 100 / teeth;
  const pts: string[] = [];
  // الحافّة العليا: قمّة ثم قاع بالتناوب
  for (let i = 0; i <= teeth; i++) {
    const x = (i * step).toFixed(2);
    pts.push(`${x}% ${i % 2 === 0 ? "0%" : depth}`);
  }
  // النزول على الحافّة اليمنى ثم الحافّة السفلى بالعكس
  for (let i = teeth; i >= 0; i--) {
    const x = (i * step).toFixed(2);
    pts.push(`${x}% ${i % 2 === 0 ? "100%" : `calc(100% - ${depth})`}`);
  }
  return `polygon(${pts.join(", ")})`;
}

/**
 * حافّة غير منتظمة — كورقة ممزّقة.
 * الانحرافات مشتقّة من متتالية ثابتة لا من عشوائية وقت التشغيل: لو
 * تغيّر الشكل بين رسم الخادم ورسم المتصفّح لظهر اختلاف محسوس، ولاختلف
 * شكل البطاقة عن نفسها بين تحميل وآخر.
 */
function torn(points: number, maxDepth: number): string {
  const step = 100 / points;
  // متتالية زائفة ثابتة: تنويع كافٍ بلا عشوائية
  const jitter = (i: number) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
  const pts: string[] = [];
  for (let i = 0; i <= points; i++) {
    const x = (i * step).toFixed(2);
    const d = (jitter(i) * maxDepth).toFixed(2);
    pts.push(`${x}% ${d}px`);
  }
  for (let i = points; i >= 0; i--) {
    const x = (i * step).toFixed(2);
    const d = (jitter(i + 100) * maxDepth).toFixed(2);
    pts.push(`${x}% calc(100% - ${d}px)`);
  }
  return `polygon(${pts.join(", ")})`;
}

const box = (radius: string): DesignShape => ({ clip: null, radius });
const shape = (clip: string, radius = "0px"): DesignShape => ({ clip, radius });

/* ------------------------------------------------------------------ */
/*  عشرون هيئة                                                         */
/* ------------------------------------------------------------------ */

function d(
  id: string, name: string, hint: string,
  panel: DesignShape, tile: DesignShape, edge: EdgeArt, border: BorderStyle
): StudentDesign {
  return { id, name, hint, panel, tile, edge, border };
}

export const STUDENT_DESIGNS: StudentDesign[] = [
  d("soft", "الناعم", "حوافّ دائرية بلا زخرفة — الأبسط", box("1.75rem"), box("1.4rem"), "none", "single"),
  d("plaque", "اللوح", "أركان أربعة مقصوصة كلوح المخطوط", shape(cut("1.1rem")), shape(cut("0.8rem")), "none", "double"),
  d("plaqueGold", "اللوح المذهّب", "لوح بحدّ مزدوج وخرز ذهبي", shape(cut("1.2rem")), shape(cut("0.85rem")), "beads", "beaded"),
  d("arch", "المحراب", "قمّة مقوّسة مرسومة فوق اللوح", box("1.5rem"), box("1.2rem"), "arch", "single"),
  d("dome", "القبّة", "قبّة دائرية تعلو اللوح", box("1.5rem"), box("1.2rem"), "dome", "single"),
  d("scallop", "المفصّص", "حافّة عليا بفصوص متتابعة", box("1.4rem"), box("1.1rem"), "scallop", "single"),
  d("wave", "الموج", "حافّة سفلى موجيّة", box("1.4rem"), box("1.1rem"), "wave", "single"),
  d("zigzag", "المسنّن", "حافّة بأسنان حادّة", shape(cutBottom("1rem")), box("1rem"), "zigzag", "single"),
  d("teeth", "الشُّرَف", "شُرَف معمارية على الحافّة", shape(cutTop("1rem")), shape(cutTop("0.7rem")), "teeth", "double"),
  d("fold", "المطويّ", "ركن علويّ مطويّ كأذن الكتاب", shape(fold("1.6rem")), shape(fold("1rem")), "none", "single"),
  d("tag", "البطاقة", "طرف مدبّب كبطاقة تعريف", shape(tag("1.4rem")), shape(tag("0.9rem")), "none", "single"),
  d("ribbon", "الشريط", "طرفان مشقوقان كشريط", shape(ribbon("1.2rem")), shape(ribbon("0.8rem")), "none", "double"),
  d("chevron", "السهم", "طرفان مدبّبان في اتجاه واحد", shape(chevron("1.1rem")), shape(chevron("0.7rem")), "none", "single"),
  d("hex", "المسدّس", "ضلعان مائلان في الطرفين", shape(hex("1.3rem")), shape(hex("0.8rem")), "none", "double"),
  d("slant", "المائل", "ضلعان مائلان — إحساس بالحركة", shape(slant("1.2rem")), shape(slant("0.7rem")), "none", "single"),
  d("step", "المدرّج", "درجات في الركنين العلويين", shape(step("0.9rem")), shape(step("0.6rem")), "none", "single"),
  d("notch", "المحزّز", "حزّ في منتصف الحافّة العليا", shape(notch("1.1rem")), shape(notch("0.7rem")), "none", "single"),
  d("diagonal", "القطريّ", "ركنان متقابلان مقصوصان", shape(diagonal("1.4rem")), shape(diagonal("0.9rem")), "none", "single"),
  d("outline", "المفرَّغ", "حدّ رفيع بلا تعبئة — أخفّ ما يكون", box("1.5rem"), box("1.2rem"), "none", "dashed"),
  d("bare", "المجرَّد", "بلا حدّ ولا زخرفة — المحتوى وحده", box("1.6rem"), box("1.3rem"), "none", "none"),
  d("jagged", "المعرَّج", "حافّتان بأسنان متتابعة كطابع البريد",
    shape(jagged(28, "10px")), shape(jagged(16, "7px")), "none", "single"),
  d("torn", "الممزَّق", "حوافّ غير منتظمة كورقة ممزّقة",
    shape(torn(22, 12)), shape(torn(14, 8)), "none", "none"),
];

export const DEFAULT_DESIGN = STUDENT_DESIGNS[0].id;

export function findDesign(id?: string): StudentDesign {
  return STUDENT_DESIGNS.find((x) => x.id === id) ?? STUDENT_DESIGNS[0];
}

/** أنماط الحدّ كأصناف — في مكان واحد فلا تتفرّق القيم. */
export const BORDER_CLASS: Record<BorderStyle, string> = {
  single: "ring-1 ring-inset ring-[hsl(var(--gold)/0.4)]",
  double: "ring-1 ring-inset ring-[hsl(var(--gold)/0.55)] shadow-[inset_0_0_0_4px_hsl(var(--card)),inset_0_0_0_5px_hsl(var(--gold)/0.3)]",
  beaded: "ring-1 ring-inset ring-[hsl(var(--gold)/0.5)]",
  dashed: "ring-1 ring-inset ring-[hsl(var(--gold)/0.45)] [border-style:dashed]",
  none: "",
};

/** يبني نمط الشكل لعنصر — قصّ أو انحناء. */
export function shapeStyle(s: DesignShape): React.CSSProperties {
  return s.clip ? { clipPath: s.clip } : { borderRadius: s.radius };
}
