"use client";

/**
 * مظهر بوابة الطالب — اختيار الثيم والتخطيط.
 * ------------------------------------------------------------------
 * كل بطاقة معاينة مرسومة SVG بألوان الثيم نفسه وزخرفته، فما يراه
 * الأدمن هنا هو ما سيراه الطالب فعلاً — لا مربّعات ألوان مجرّدة.
 * الاختيار يُحفظ فوراً ويسري على كل الطلاب.
 */
import { useState } from "react";
import { Check, Loader2, Palette, LayoutGrid, Home, Smartphone, Shapes, RotateCcw, PanelRight, Menu, LayoutPanelTop, PanelTop, Wallet, Sparkles } from "lucide-react";
import { PageHeader, Card } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";
import {
  STUDENT_SKINS, STUDENT_LAYOUTS, MOBILE_LAYOUTS, findSkin, findLayout, findMobile,
  DEFAULT_SKIN, DEFAULT_LAYOUT, DEFAULT_MOBILE,
  type StudentSkin, type StudentLayout, type MobileLayout,
} from "@/lib/skins";
import {
  SkinPreview, LayoutPreview, HomeLayoutPreview, MobilePreview, DesignPreview,
  SideNavPreview, DockPreview, FramePreview, TilePreview, ToolbarPreview, PlansPreview,
  HeroStylePreview,
} from "@/components/admin/skin-preview";
import { HERO_STYLES, findHeroStyle, DEFAULT_HERO_STYLE, type HeroStyle } from "@/lib/hero-styles";
import { PLANS_STYLES, findPlansStyle, DEFAULT_PLANS_STYLE, type PlansStyle } from "@/lib/plans-styles";
import { TOOLBAR_STYLES, findToolbar, DEFAULT_TOOLBAR, type ToolbarStyle } from "@/lib/toolbar-styles";
import { TILE_STYLES, findTile, DEFAULT_TILE, type TileStyle } from "@/lib/tile-styles";
import { DEFAULT_FRAME } from "@/lib/frame-shapes";
import {
  SIDE_NAV_STYLES, DOCK_STYLES, findSideNav, findDock,
  DEFAULT_SIDE_NAV, DEFAULT_DOCK, ICON_SETS, DEFAULT_ICON_SET,
  type SideNavStyle, type DockStyle,
} from "@/lib/nav-styles";
import { STUDENT_DESIGNS, findDesign, DEFAULT_DESIGN, type StudentDesign } from "@/lib/designs";
import { HOME_LAYOUTS, findHomeLayout, DEFAULT_HOME_LAYOUT, type HomeLayout } from "@/lib/home-layouts";

/** ألوان جاهزة تُستخدم في أكثر من منتقٍ. */
const SWATCH = ["#233b8b", "#095e86", "#245c4b", "#87263a", "#8a6212", "#4a3570", "#1f5a5e", "#2b3140"];

type Tab = "skin" | "design" | "tiles" | "layout" | "side" | "bar" | "dock" | "mobile" | "home" | "plans" | "hero";

export default function AppearancePage() {
  const { content, saveContent } = useContent();
  const [tab, setTab] = useState<Tab>("skin");
  const [busy, setBusy] = useState<string | null>(null);

  const skin = findSkin(content.studentSkin);
  const layout = findLayout(content.studentLayout);
  const home = findHomeLayout(content.homeLayout);
  const mobile = findMobile(content.studentMobile);
  const design = findDesign(content.studentDesign);
  const tile = findTile(content.tileStyle);
  const bar = findToolbar(content.toolbarStyle);
  const plansStyle = findPlansStyle(content.plansStyle);
  const heroStyle = findHeroStyle(content.heroStyle);
  const tileColors = content.tileColors ?? {};
  const side = findSideNav(content.sideNav);
  const dock = findDock(content.dockStyle);
  const iconSet = content.navIcons ?? DEFAULT_ICON_SET;
  const navColors = content.navColors ?? {};

  const pickSkin = async (s: StudentSkin) => {
    setBusy(s.id);
    await saveContent({ studentSkin: s.id });
    setBusy(null);
  };

  const pickLayout = async (l: StudentLayout) => {
    setBusy(l.id);
    await saveContent({ studentLayout: l.id });
    setBusy(null);
  };

  /** يعيد المظهر كلّه إلى ما تبدأ به المنصّة — الخمسة معاً لا واحداً. */
  /**
   * إعادة الضبط لكل قسم على حدة.
   * الزرّ يعيد القسم المفتوح وحده لا كل المظهر: من يضبط عشرة أقسام ثم
   * يريد التراجع عن واحد منها لا يصحّ أن يفقد التسعة الباقية.
   */
  const SECTIONS: Record<
    Tab,
    { label: string; isDefault: boolean; patch: () => Record<string, unknown> }
  > = {
    skin: {
      label: "الثيم",
      isDefault: skin.id === DEFAULT_SKIN,
      patch: () => ({ studentSkin: DEFAULT_SKIN }),
    },
    tiles: {
      label: "بطاقات المؤشّرات",
      isDefault: tile.id === DEFAULT_TILE && Object.values(tileColors).every((v) => !v),
      patch: () => ({ tileStyle: DEFAULT_TILE, tileColors: {} }),
    },
    design: {
      label: "الهيئة",
      isDefault: design.id === DEFAULT_DESIGN,
      patch: () => ({ studentDesign: DEFAULT_DESIGN }),
    },
    layout: {
      label: "التخطيط",
      isDefault: layout.id === DEFAULT_LAYOUT,
      patch: () => ({ studentLayout: DEFAULT_LAYOUT }),
    },
    side: {
      label: "القائمة الجانبية",
      /* القسم يشمل التصميم والأيقونات والألوان معاً — فإعادته تعيدها كلّها. */
      isDefault:
        side.id === DEFAULT_SIDE_NAV &&
        iconSet === DEFAULT_ICON_SET &&
        Object.values(navColors).every((v) => !v),
      patch: () => ({ sideNav: DEFAULT_SIDE_NAV, navIcons: DEFAULT_ICON_SET, navColors: {} }),
    },
    bar: {
      label: "شريط الأدوات",
      isDefault: bar.id === DEFAULT_TOOLBAR,
      patch: () => ({ toolbarStyle: DEFAULT_TOOLBAR }),
    },
    dock: {
      label: "القائمة السفلية",
      isDefault: dock.id === DEFAULT_DOCK,
      patch: () => ({ dockStyle: DEFAULT_DOCK }),
    },
    mobile: {
      label: "تنسيق الهاتف",
      isDefault: mobile.id === DEFAULT_MOBILE,
      patch: () => ({ studentMobile: DEFAULT_MOBILE }),
    },
    hero: {
      label: "قسم الهيرو",
      isDefault: heroStyle.id === DEFAULT_HERO_STYLE,
      patch: () => ({ heroStyle: DEFAULT_HERO_STYLE }),
    },
    plans: {
      label: "قسم الخطط",
      isDefault: plansStyle.id === DEFAULT_PLANS_STYLE,
      patch: () => ({ plansStyle: DEFAULT_PLANS_STYLE }),
    },
    home: {
      label: "الواجهة الرئيسية",
      isDefault: home.id === DEFAULT_HOME_LAYOUT,
      patch: () => ({ homeLayout: DEFAULT_HOME_LAYOUT }),
    },
  };

  const section = SECTIONS[tab];

  const resetSection = async () => {
    if (section.isDefault) return;
    if (!confirm(`إعادة «${section.label}» إلى التصميم الأصلي؟`)) return;
    setBusy("reset");
    await saveContent(section.patch());
    setBusy(null);
  };

  /** إعادة كل الأقسام — فعل منفصل بتأكيده الخاص. */
  const resetAll = async () => {
    if (!confirm("إعادة كل أقسام المظهر إلى التصميم الأصلي؟")) return;
    setBusy("resetAll");
    await saveContent(
      (Object.values(SECTIONS) as { patch: () => Record<string, unknown> }[]).reduce(
        (acc, x) => ({ ...acc, ...x.patch() }),
        {} as Record<string, unknown>
      )
    );
    setBusy(null);
  };

  const allDefault = Object.values(SECTIONS).every((x) => x.isDefault);

  /** ألوان القائمة تُدمج فلا يمحو ضبطُ لونٍ لونًا آخر. */
  const setNavColor = (patch: Record<string, string>) =>
    saveContent({ navColors: { ...navColors, ...patch } });

  const pickSide = async (x: SideNavStyle) => {
    setBusy(x.id);
    await saveContent({ sideNav: x.id });
    setBusy(null);
  };

  const pickDock = async (x: DockStyle) => {
    setBusy(x.id);
    await saveContent({ dockStyle: x.id });
    setBusy(null);
  };

  const pickHero = async (x: HeroStyle) => {
    setBusy(x.id);
    await saveContent({ heroStyle: x.id });
    setBusy(null);
  };

  const pickPlans = async (x: PlansStyle) => {
    setBusy(x.id);
    await saveContent({ plansStyle: x.id });
    setBusy(null);
  };

  const pickBar = async (x: ToolbarStyle) => {
    setBusy(x.id);
    await saveContent({ toolbarStyle: x.id });
    setBusy(null);
  };

  const pickTile = async (x: TileStyle) => {
    setBusy(x.id);
    await saveContent({ tileStyle: x.id });
    setBusy(null);
  };

  /** ألوان البطاقة تُدمج فلا يمحو ضبطُ لونٍ لونًا آخر. */
  const setTileColor = (patch: Record<string, string>) =>
    saveContent({ tileColors: { ...tileColors, ...patch } });

  const pickDesign = async (x: StudentDesign) => {
    setBusy(x.id);
    await saveContent({ studentDesign: x.id });
    setBusy(null);
  };

  const pickMobile = async (x: MobileLayout) => {
    setBusy(x.id);
    await saveContent({ studentMobile: x.id });
    setBusy(null);
  };

  const pickHome = async (l: HomeLayout) => {
    setBusy(l.id);
    await saveContent({ homeLayout: l.id });
    setBusy(null);
  };

  return (
    <>
      <PageHeader
        title="مظهر المنصّة"
        subtitle={`الثيم: ${skin.name} · الهيئة: ${design.name} · القائمة: ${side.name} · السفلية: ${dock.name} · الرئيسية: ${home.name}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={resetSection}
              disabled={busy !== null || section.isDefault}
              title={section.isDefault ? `«${section.label}» على الأصل بالفعل` : `إعادة «${section.label}» وحده`}
              className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/5 px-4 py-2.5 text-xs font-bold text-primary transition hover:bg-primary/10 disabled:opacity-45"
            >
              {busy === "reset" ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
              إعادة ضبط «{section.label}»
            </button>
            <button
              type="button"
              onClick={resetAll}
              disabled={busy !== null || allDefault}
              title={allDefault ? "كل الأقسام على الأصل بالفعل" : "إعادة كل الأقسام"}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-xs font-bold transition hover:border-rose-500 hover:text-rose-500 disabled:opacity-45"
            >
              {busy === "resetAll" ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
              الكل
            </button>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <TabBtn active={tab === "skin"} onClick={() => setTab("skin")} icon={<Palette className="size-4" />}>
          الثيم واللون ({STUDENT_SKINS.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "design"} onClick={() => setTab("design")} icon={<Shapes className="size-4" />}>
          الهيئة والشكل ({STUDENT_DESIGNS.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "tiles"} onClick={() => setTab("tiles")} icon={<LayoutPanelTop className="size-4" />}>
          بطاقات المؤشّرات ({TILE_STYLES.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "layout"} onClick={() => setTab("layout")} icon={<LayoutGrid className="size-4" />}>
          تخطيط بوابة الطالب ({STUDENT_LAYOUTS.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "side"} onClick={() => setTab("side")} icon={<PanelRight className="size-4" />}>
          القائمة الجانبية ({SIDE_NAV_STYLES.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "bar"} onClick={() => setTab("bar")} icon={<PanelTop className="size-4" />}>
          شريط الأدوات ({TOOLBAR_STYLES.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "dock"} onClick={() => setTab("dock")} icon={<Menu className="size-4" />}>
          القائمة السفلية ({DOCK_STYLES.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "mobile"} onClick={() => setTab("mobile")} icon={<Smartphone className="size-4" />}>
          تنسيق الهاتف ({MOBILE_LAYOUTS.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "hero"} onClick={() => setTab("hero")} icon={<Sparkles className="size-4" />}>
          قسم الهيرو ({HERO_STYLES.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "plans"} onClick={() => setTab("plans")} icon={<Wallet className="size-4" />}>
          قسم الخطط ({PLANS_STYLES.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "home"} onClick={() => setTab("home")} icon={<Home className="size-4" />}>
          تخطيط الواجهة الرئيسية ({HOME_LAYOUTS.length.toLocaleString("ar-EG")})
        </TabBtn>
      </div>

      {tab === "skin" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {STUDENT_SKINS.map((s) => {
            const on = s.id === skin.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => pickSkin(s)}
                disabled={busy !== null}
                className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                  on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                }`}
              >
                <SkinPreview skin={s} />
                <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{s.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{s.hint}</p>
                  </div>
                  {busy === s.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : on ? (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === "design" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {STUDENT_DESIGNS.map((x) => {
            const on = x.id === design.id;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => pickDesign(x)}
                disabled={busy !== null}
                className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                  on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                }`}
              >
                <DesignPreview design={x} skin={skin} />
                <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{x.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                  </div>
                  {busy === x.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : on ? (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === "tiles" && (
        <>
          <Card className="mb-5">
            <p className="font-display mb-1 font-bold">ألوان البطاقات</p>
            <p className="mb-4 text-[11px] leading-relaxed text-muted-foreground">
              مستقلّة عن الثيم تماماً — تغيّر لون البطاقات وحدها دون أن تمسّ هوية المنصّة.
              اللون الفارغ يرث لون الثيم.
            </p>
            <div className="grid gap-3">
              {([
                { key: "bg", label: "خلفية البطاقة" },
                { key: "bg2", label: "اللون الثاني (للتدرّج)" },
                { key: "text", label: "الرقم والعنوان" },
                { key: "icon", label: "شارة الأيقونة" },
                { key: "accent", label: "الحدّ والحلقة" },
              ] as const).map((row) => (
                <div key={row.key} className="flex flex-wrap items-center gap-2">
                  <span className="w-40 shrink-0 text-xs font-semibold text-muted-foreground">{row.label}</span>
                  <button
                    type="button"
                    onClick={() => void setTileColor({ [row.key]: "" })}
                    className={`rounded-full border px-3 py-1 text-[10px] font-bold transition ${
                      !tileColors[row.key] ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                    }`}
                  >
                    الثيم
                  </button>
                  {SWATCH.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={c}
                      onClick={() => void setTileColor({ [row.key]: c })}
                      className={`size-7 rounded-lg border transition ${
                        tileColors[row.key]?.toLowerCase() === c ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/50"
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                  <label
                    className="grid size-7 cursor-pointer place-items-center rounded-lg border border-dashed border-border"
                    style={{ background: tileColors[row.key] || "transparent" }}
                    title="لون مخصّص"
                  >
                    <input
                      type="color"
                      className="size-0 opacity-0"
                      value={tileColors[row.key] || "#233b8b"}
                      onChange={(e) => void setTileColor({ [row.key]: e.target.value })}
                    />
                  </label>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {TILE_STYLES.map((x) => {
              const on = x.id === tile.id;
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => pickTile(x)}
                  disabled={busy !== null}
                  className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                    on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                  }`}
                >
                  <TilePreview tile={x} colors={tileColors} skin={skin} />
                  <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{x.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                    </div>
                    {busy === x.id ? (
                      <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                    ) : on ? (
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                        <Check className="size-3.5" />
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {tab === "layout" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {STUDENT_LAYOUTS.map((l) => {
            const on = l.id === layout.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => pickLayout(l)}
                disabled={busy !== null}
                className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                  on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                }`}
              >
                {/* المعاينة بألوان الثيم المختار حالياً — فيرى الأدمن التركيبة الحقيقية */}
                <LayoutPreview layout={l} skin={skin} />
                <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{l.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{l.hint}</p>
                  </div>
                  {busy === l.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : on ? (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === "side" && (
        <div className="mb-5 grid gap-4 lg:grid-cols-2">
          <Card>
            <p className="font-display mb-1 font-bold">أسلوب الأيقونات</p>
            <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
              أسلوب واحد لكل القائمة — خلط الأساليب في شريط واحد أكثر ما يُفسد اتّساق الواجهة.
            </p>
            <div className="flex flex-wrap gap-2">
              {ICON_SETS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => void saveContent({ navIcons: o.id })}
                  title={o.hint}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                    iconSet === o.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                  }`}
                >
                  {o.name}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <p className="font-display mb-3 font-bold">ألوان القائمة</p>
            <div className="grid gap-3">
              {([
                { key: "panel", label: "خلفية اللوح" },
                { key: "icon", label: "الأيقونات" },
                { key: "text", label: "نصّ العناوين" },
                { key: "active", label: "العنصر النشط" },
              ] as const).map((row) => (
                <div key={row.key} className="flex flex-wrap items-center gap-2">
                  <span className="w-32 shrink-0 text-xs font-semibold text-muted-foreground">{row.label}</span>
                  <button
                    type="button"
                    onClick={() => void setNavColor({ [row.key]: "" })}
                    className={`rounded-full border px-3 py-1 text-[10px] font-bold transition ${
                      !navColors[row.key] ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                    }`}
                  >
                    الثيم
                  </button>
                  {SWATCH.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={c}
                      onClick={() => void setNavColor({ [row.key]: c })}
                      className={`size-7 rounded-lg border transition ${
                        navColors[row.key]?.toLowerCase() === c ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/50"
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                  <label
                    className="grid size-7 cursor-pointer place-items-center rounded-lg border border-dashed border-border"
                    style={{ background: navColors[row.key] || "transparent" }}
                    title="لون مخصّص"
                  >
                    <input
                      type="color"
                      className="size-0 opacity-0"
                      value={navColors[row.key] || "#233b8b"}
                      onChange={(e) => void setNavColor({ [row.key]: e.target.value })}
                    />
                  </label>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "side" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SIDE_NAV_STYLES.map((x) => {
            const on = x.id === side.id;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => pickSide(x)}
                disabled={busy !== null}
                className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                  on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                }`}
              >
                <SideNavPreview nav={x} skin={skin} />
                <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{x.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                  </div>
                  {busy === x.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : on ? (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === "bar" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {TOOLBAR_STYLES.map((x) => {
            const on = x.id === bar.id;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => pickBar(x)}
                disabled={busy !== null}
                className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                  on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                }`}
              >
                <ToolbarPreview bar={x} skin={skin} />
                <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{x.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                  </div>
                  {busy === x.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : on ? (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === "dock" && (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {DOCK_STYLES.map((x) => {
            const on = x.id === dock.id;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => pickDock(x)}
                disabled={busy !== null}
                className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                  on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                }`}
              >
                <DockPreview dock={x} skin={skin} />
                <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{x.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                  </div>
                  {busy === x.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : on ? (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === "mobile" && (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {MOBILE_LAYOUTS.map((x) => {
            const on = x.id === mobile.id;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => pickMobile(x)}
                disabled={busy !== null}
                className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                  on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                }`}
              >
                <MobilePreview mobile={x} skin={skin} />
                <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{x.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                  </div>
                  {busy === x.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : on ? (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === "hero" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {HERO_STYLES.map((x) => {
            const on = x.id === heroStyle.id;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => pickHero(x)}
                disabled={busy !== null}
                className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                  on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                }`}
              >
                <HeroStylePreview style={x} skin={skin} />
                <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{x.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                  </div>
                  {busy === x.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : on ? (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === "plans" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {PLANS_STYLES.map((x) => {
            const on = x.id === plansStyle.id;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => pickPlans(x)}
                disabled={busy !== null}
                className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                  on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                }`}
              >
                <PlansPreview style={x} skin={skin} />
                <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{x.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                  </div>
                  {busy === x.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : on ? (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === "home" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {HOME_LAYOUTS.map((l) => {
            const on = l.id === home.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => pickHome(l)}
                disabled={busy !== null}
                className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                  on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                }`}
              >
                <HomeLayoutPreview layout={l} />
                <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{l.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{l.hint}</p>
                  </div>
                  {busy === l.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : on ? (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Card className="mt-6">
        <p className="text-xs leading-relaxed text-muted-foreground">
          الثيم يحدّد الألوان، والهيئة تحدّد الشكل (حوافّ اللوح والبطاقات وزخرفة الحافّة)، والتخطيط يحدّد ترتيب لوح الترحيب
          والمؤشّرات وبطاقات الكورسات، وتخطيط الواجهة الرئيسية يحدّد شكل الهيرو وترتيب الأقسام
          وعرض الحاوية وكثافة التباعد والفاصل بينها. الثلاثة مستقلّة — أي تركيبة تعمل.
        </p>
      </Card>
    </>
  );
}

function TabBtn({
  active, onClick, icon, children,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition ${
        active ? "btn-glow text-white" : "border border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
