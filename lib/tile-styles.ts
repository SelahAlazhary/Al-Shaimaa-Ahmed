/**
 * تصاميم بطاقات المؤشّرات — مستقلّة عن الثيم.
 * ------------------------------------------------------------------
 * البطاقات كانت تتبع الثيم والهيئة معاً، فلم يكن تغيير لونها ممكناً
 * إلا بتغيير هوية المنصّة كلّها. هذا القسم يفصلها: شكلها ولونها
 * وتنسيقها الداخلي بيدك وحدها، والثيم يبقى كما هو.
 *
 * كل حقل لوني اختياري — الفارغ لا يُكتب متغيّراً فترث البطاقة لون
 * الثيم، فلا يجبرك ضبطُ لون على ضبط البقية.
 */

/** شكل سطح البطاقة. */
export type TileSurface =
  | "glass"    // زجاجي شفّاف (الافتراضي فوق لوح الحبر)
  | "solid"    // مصمت بلون البطاقة
  | "outline"  // مفرَّغ بحدّ فقط
  | "gradient" // تدرّج بين لونين
  | "flat";    // بلا حدّ ولا ظلّ

/** ترتيب محتوى البطاقة. */
export type TileLayout =
  | "stacked"  // أيقونة فوق ورقم تحتها (الافتراضي)
  | "inline"   // أيقونة يمين والرقم يسارها
  | "centered" // كل شيء متمركز
  | "minimal"; // رقم وعنوان فقط بلا أيقونة

/** شكل شارة الأيقونة. */
export type TileIcon = "rounded" | "circle" | "square" | "medallion" | "none";

export type TileStyle = {
  id: string;
  name: string;
  hint: string;
  surface: TileSurface;
  layout: TileLayout;
  icon: TileIcon;
};

function t(
  id: string, name: string, hint: string,
  surface: TileSurface, layout: TileLayout, icon: TileIcon
): TileStyle {
  return { id, name, hint, surface, layout, icon };
}

export const TILE_STYLES: TileStyle[] = [
  t("glassStack", "الزجاجي", "شفّاف وأيقونة فوق الرقم", "glass", "stacked", "rounded"),
  t("glassInline", "الزجاجي الأفقي", "أيقونة بجانب الرقم", "glass", "inline", "circle"),
  t("solidStack", "المصمت", "لون كامل وأيقونة فوق", "solid", "stacked", "rounded"),
  t("solidCenter", "المصمت المتمركز", "كل شيء في الوسط", "solid", "centered", "circle"),
  t("outlineStack", "المفرَّغ", "حدّ فقط بلا تعبئة", "outline", "stacked", "square"),
  t("outlineMin", "المفرَّغ المبسّط", "بلا أيقونة — رقم وعنوان", "outline", "minimal", "none"),
  t("gradStack", "المتدرّج", "تدرّج بين لونين", "gradient", "stacked", "rounded"),
  t("gradCenter", "المتدرّج المتمركز", "تدرّج وكل شيء في الوسط", "gradient", "centered", "medallion"),
  t("flatInline", "المسطّح", "بلا حدّ ولا ظلّ", "flat", "inline", "none"),
  t("medalStack", "الميدالية", "أيقونة في ميدالية مثمّنة", "glass", "stacked", "medallion"),
  t("squareInline", "المربّع", "شارة مربّعة بجانب الرقم", "solid", "inline", "square"),
  t("minimalCenter", "المجرّد", "رقم كبير في الوسط بلا شيء", "flat", "centered", "none"),
];

export const DEFAULT_TILE = TILE_STYLES[0].id;

export function findTile(id?: string): TileStyle {
  return TILE_STYLES.find((x) => x.id === id) ?? TILE_STYLES[0];
}

export function tileClass(x: TileStyle): string {
  return `tl-surface-${x.surface} tl-layout-${x.layout} tl-icon-${x.icon}`;
}

/** ألوان البطاقة — كلّها اختيارية. */
export type TileColors = {
  /** خلفية البطاقة. */
  bg?: string;
  /** اللون الثاني للتدرّج. */
  bg2?: string;
  /** لون الرقم والعنوان. */
  text?: string;
  /** لون شارة الأيقونة. */
  icon?: string;
  /** لون الحدّ والحلقة. */
  accent?: string;
};

/** الفارغ لا يُكتب — فترث البطاقة لون الثيم بدل أن يُفرض عليها لون. */
export function tileColorVars(c: TileColors | undefined): React.CSSProperties {
  const v: Record<string, string> = {};
  if (c?.bg) v["--tile-bg"] = c.bg;
  if (c?.bg2) v["--tile-bg2"] = c.bg2;
  if (c?.text) v["--tile-text"] = c.text;
  if (c?.icon) v["--tile-icon"] = c.icon;
  if (c?.accent) v["--tile-accent"] = c.accent;
  return v as React.CSSProperties;
}
