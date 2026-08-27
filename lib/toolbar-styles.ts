/**
 * تصاميم شريط الأدوات العلوي (التول بار).
 * ------------------------------------------------------------------
 * الشريط يظهر في كل صفحة من لوحتَي الطالب والإدارة، فشكله بُعد مستقلّ
 * كالقوائم لا تابع للثيم.
 *
 * بيانات → أصناف على غلاف البوابة، والأنماط معرَّفة مرّة واحدة. مكوّن
 * الهيكل لا يعرف التصميم المختار.
 */

/** سطح الشريط. */
export type BarSurface =
  | "solid"     // لون السطح مصمتاً
  | "glass"     // زجاجي شفّاف بضباب
  | "outline"   // شفّاف بحدّ سفلي فقط
  | "gradient"  // تدرّج أفقي خفيف
  | "floating"  // بطاقة منفصلة عن الحوافّ
  | "ink";      // بلون الحبر — يقلب النصّ إلى فاتح

/** شكل حقل البحث. */
export type BarSearch =
  | "wide"    // حقل عريض
  | "pill"    // كبسولة مضغوطة
  | "icon"    // أيقونة تتوسّع عند التركيز
  | "none";   // بلا بحث

/** الفاصل أسفل الشريط. */
export type BarEdge = "line" | "shadow" | "gold" | "none";

/** ارتفاع الشريط. */
export type BarHeight = "compact" | "normal" | "tall";

export type ToolbarStyle = {
  id: string;
  name: string;
  hint: string;
  surface: BarSurface;
  search: BarSearch;
  edge: BarEdge;
  height: BarHeight;
  /** الأزرار في كبسولة مجمّعة بدل متفرّقة. */
  grouped: boolean;
};

function tb(
  id: string, name: string, hint: string,
  surface: BarSurface, search: BarSearch, edge: BarEdge, height: BarHeight, grouped: boolean
): ToolbarStyle {
  return { id, name, hint, surface, search, edge, height, grouped };
}

export const TOOLBAR_STYLES: ToolbarStyle[] = [
  tb("classic", "الكلاسيكي", "سطح مصمت وبحث عريض وحدّ سفلي", "solid", "wide", "line", "normal", false),
  tb("classicGold", "الكلاسيكي المذهّب", "حدّ سفلي ذهبي", "solid", "wide", "gold", "normal", false),
  tb("glassWide", "الزجاجي", "زجاج مضبّب وبحث عريض", "glass", "wide", "shadow", "normal", false),
  tb("glassPill", "الزجاجي المضغوط", "زجاج وبحث كبسولة", "glass", "pill", "none", "compact", true),
  tb("outlineWide", "المفرَّغ", "شفّاف بحدّ سفلي فقط", "outline", "wide", "line", "normal", false),
  tb("outlineIcon", "المفرَّغ المبسّط", "بحث بأيقونة تتوسّع", "outline", "icon", "line", "compact", false),
  tb("gradientWide", "المتدرّج", "تدرّج أفقي خفيف", "gradient", "wide", "gold", "normal", false),
  tb("gradientGroup", "المتدرّج المجمّع", "تدرّج وأزرار في كبسولة", "gradient", "pill", "shadow", "normal", true),
  tb("floatCard", "البطاقة العائمة", "شريط منفصل عن الحوافّ", "floating", "wide", "shadow", "normal", false),
  tb("floatPill", "البطاقة المضغوطة", "شريط عائم وبحث كبسولة", "floating", "pill", "none", "compact", true),
  tb("inkBar", "شريط الحبر", "بلون الحبر ونصّ فاتح", "ink", "wide", "none", "normal", false),
  tb("inkGold", "الحبر المذهّب", "حبر بحدّ سفلي ذهبي", "ink", "pill", "gold", "normal", true),
  tb("inkTall", "الحبر العريض", "حبر بارتفاع أكبر", "ink", "wide", "shadow", "tall", false),
  tb("tallWide", "الفسيح", "ارتفاع أكبر وبحث عريض", "solid", "wide", "line", "tall", false),
  tb("tallGlass", "الفسيح الزجاجي", "زجاج بارتفاع أكبر", "glass", "wide", "gold", "tall", false),
  tb("compactIcon", "المضغوط", "أقلّ ارتفاع وبحث بأيقونة", "solid", "icon", "line", "compact", true),
  tb("noSearch", "بلا بحث", "أزرار فقط — لمن لا يستخدم البحث", "solid", "none", "line", "normal", false),
  tb("noSearchGlass", "الزجاجي بلا بحث", "زجاج وأزرار مجمّعة", "glass", "none", "shadow", "compact", true),
  tb("minimal", "المبسّط", "بلا سطح ولا حدّ — أخفّ ما يكون", "outline", "none", "none", "compact", false),
  tb("royal", "الملكي", "تدرّج وحدّ ذهبي وارتفاع أكبر", "gradient", "wide", "gold", "tall", true),
];

export const DEFAULT_TOOLBAR = TOOLBAR_STYLES[0].id;

export function findToolbar(id?: string): ToolbarStyle {
  return TOOLBAR_STYLES.find((x) => x.id === id) ?? TOOLBAR_STYLES[0];
}

export function toolbarClass(x: ToolbarStyle): string {
  return [
    `tb-surface-${x.surface}`,
    `tb-search-${x.search}`,
    `tb-edge-${x.edge}`,
    `tb-height-${x.height}`,
    x.grouped ? "tb-grouped" : "",
  ].filter(Boolean).join(" ");
}
