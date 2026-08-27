"use client";

/**
 * مظهر بوابة الطالب — اختيار الثيم والتخطيط.
 * ------------------------------------------------------------------
 * كل بطاقة معاينة مرسومة SVG بألوان الثيم نفسه وزخرفته، فما يراه
 * الأدمن هنا هو ما سيراه الطالب فعلاً — لا مربّعات ألوان مجرّدة.
 * الاختيار يُحفظ فوراً ويسري على كل الطلاب.
 */
import { useState } from "react";
import { Check, Loader2, Palette, LayoutGrid, Home, Smartphone, Shapes, RotateCcw, PanelRight, Menu, Frame } from "lucide-react";
import { PageHeader, Card } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";
import {
  STUDENT_SKINS, STUDENT_LAYOUTS, MOBILE_LAYOUTS, findSkin, findLayout, findMobile,
  DEFAULT_SKIN, DEFAULT_LAYOUT, DEFAULT_MOBILE,
  type StudentSkin, type StudentLayout, type MobileLayout,
} from "@/lib/skins";
import {
  SkinPreview, LayoutPreview, HomeLayoutPreview, MobilePreview, DesignPreview,
  SideNavPreview, DockPreview, FramePreview,
} from "@/components/admin/skin-preview";
import { FRAME_SHAPES, findFrame, DEFAULT_FRAME } from "@/lib/frame-shapes";
import {
  SIDE_NAV_STYLES, DOCK_STYLES, findSideNav, findDock,
  DEFAULT_SIDE_NAV, DEFAULT_DOCK, ICON_SETS, DEFAULT_ICON_SET,
  type SideNavStyle, type DockStyle,
} from "@/lib/nav-styles";
import { STUDENT_DESIGNS, findDesign, DEFAULT_DESIGN, type StudentDesign } from "@/lib/designs";
import { HOME_LAYOUTS, findHomeLayout, DEFAULT_HOME_LAYOUT, type HomeLayout } from "@/lib/home-layouts";

/** ألوان جاهزة تُستخدم في أكثر من منتقٍ. */
const SWATCH = ["#233b8b", "#095e86", "#245c4b", "#87263a", "#8a6212", "#4a3570", "#1f5a5e", "#2b3140"];

type Tab = "skin" | "design" | "layout" | "side" | "dock" | "frame" | "mobile" | "home";

export default function AppearancePage() {
  const { content, saveContent } = useContent();
  const [tab, setTab] = useState<Tab>("skin");
  const [busy, setBusy] = useState<string | null>(null);

  const skin = findSkin(content.studentSkin);
  const layout = findLayout(content.studentLayout);
  const home = findHomeLayout(content.homeLayout);
  const mobile = findMobile(content.studentMobile);
  const design = findDesign(content.studentDesign);
  const side = findSideNav(content.sideNav);
  const dock = findDock(content.dockStyle);
  const iconSet = content.navIcons ?? DEFAULT_ICON_SET;
  const navColors = content.navColors ?? {};
  const frameShape = findFrame(content.hero?.frameShape ?? content.hero?.frame ?? 1);
  const frameColor = content.hero?.frameColor ?? "";
  const frameScale = content.hero?.frameScale ?? 100;

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
  const resetAll = async () => {
    if (!confirm("إعادة كل إعدادات المظهر إلى التصميم الأصلي؟")) return;
    setBusy("reset");
    await saveContent({
      studentSkin: DEFAULT_SKIN,
      studentDesign: DEFAULT_DESIGN,
      studentLayout: DEFAULT_LAYOUT,
      studentMobile: DEFAULT_MOBILE,
      sideNav: DEFAULT_SIDE_NAV,
      dockStyle: DEFAULT_DOCK,
      navIcons: DEFAULT_ICON_SET,
      navColors: {},
      hero: { ...content.hero, frameShape: DEFAULT_FRAME, frameColor: "", frameScale: 100 },
      homeLayout: DEFAULT_HOME_LAYOUT,
    });
    setBusy(null);
  };

  /** هل كل شيء على الأصل بالفعل؟ عندها لا معنى لزرّ الإعادة. */
  const isDefault =
    skin.id === DEFAULT_SKIN &&
    design.id === DEFAULT_DESIGN &&
    layout.id === DEFAULT_LAYOUT &&
    mobile.id === DEFAULT_MOBILE &&
    side.id === DEFAULT_SIDE_NAV &&
    dock.id === DEFAULT_DOCK &&
    home.id === DEFAULT_HOME_LAYOUT;

  /** إعدادات الإطار تعيش داخل hero، فتُدمج معه لا تستبدله. */
  const setHero = (patch: Record<string, unknown>) =>
    saveContent({ hero: { ...content.hero, ...patch } });

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
          <button
            type="button"
            onClick={resetAll}
            disabled={busy !== null || isDefault}
            title={isDefault ? "كل شيء على التصميم الأصلي بالفعل" : "إعادة كل إعدادات المظهر إلى الأصل"}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-xs font-bold transition hover:border-primary hover:text-primary disabled:opacity-45"
          >
            {busy === "reset" ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
            إعادة الضبط للتصميم الأصلي
          </button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <TabBtn active={tab === "skin"} onClick={() => setTab("skin")} icon={<Palette className="size-4" />}>
          الثيم واللون ({STUDENT_SKINS.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "design"} onClick={() => setTab("design")} icon={<Shapes className="size-4" />}>
          الهيئة والشكل ({STUDENT_DESIGNS.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "layout"} onClick={() => setTab("layout")} icon={<LayoutGrid className="size-4" />}>
          تخطيط بوابة الطالب ({STUDENT_LAYOUTS.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "side"} onClick={() => setTab("side")} icon={<PanelRight className="size-4" />}>
          القائمة الجانبية ({SIDE_NAV_STYLES.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "dock"} onClick={() => setTab("dock")} icon={<Menu className="size-4" />}>
          القائمة السفلية ({DOCK_STYLES.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "frame"} onClick={() => setTab("frame")} icon={<Frame className="size-4" />}>
          إطار الصورة ({FRAME_SHAPES.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "mobile"} onClick={() => setTab("mobile")} icon={<Smartphone className="size-4" />}>
          تنسيق الهاتف ({MOBILE_LAYOUTS.length.toLocaleString("ar-EG")})
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
                { key: "icon", label: "الأيقونات والعناوين" },
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

      {tab === "frame" && (
        <>
          <div className="mb-5 grid gap-4 lg:grid-cols-2">
            <Card>
              <p className="font-display mb-3 font-bold">لون الإطار</p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void setHero({ frameColor: "" })}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                    !frameColor ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                  }`}
                >
                  لون الثيم
                </button>
                {["#233b8b", "#095e86", "#245c4b", "#87263a", "#8a6212", "#4a3570", "#1f5a5e", "#6b3a1e"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => void setHero({ frameColor: c })}
                    aria-label={c}
                    className={`size-8 rounded-xl border transition ${
                      frameColor.toLowerCase() === c ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/50"
                    }`}
                    style={{ background: c }}
                  />
                ))}
                <label
                  className="grid size-8 cursor-pointer place-items-center rounded-xl border border-dashed border-border"
                  style={{ background: frameColor || "transparent" }}
                  title="لون مخصّص"
                >
                  <input
                    type="color"
                    className="size-0 opacity-0"
                    value={frameColor || "#233b8b"}
                    onChange={(e) => void setHero({ frameColor: e.target.value })}
                  />
                </label>
              </div>
            </Card>

            <Card>
              <label className="block">
                <span className="mb-1 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>حجم الإطار</span>
                  <span className="font-bold text-foreground">{frameScale.toLocaleString("ar-EG")}٪</span>
                </span>
                <input
                  type="range"
                  min={60}
                  max={140}
                  step={1}
                  value={frameScale}
                  onChange={(e) => void setHero({ frameScale: Number(e.target.value) })}
                  className="w-full accent-[hsl(var(--primary))]"
                />
              </label>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                يكبّر الإطار أو يصغّره داخل عموده بلا تغيير نسبة أبعاده — فلا تتشوّه الصورة.
              </p>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {FRAME_SHAPES.map((x) => {
              const on = x.id === frameShape.id;
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => void setHero({ frameShape: x.id })}
                  disabled={busy !== null}
                  className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-center transition disabled:opacity-60 ${
                    on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                  }`}
                >
                  <FramePreview shape={x} color={frameColor || undefined} skin={skin} />
                  <p className="mt-2 truncate text-xs font-bold">{x.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                  {on && (
                    <span className="absolute left-2 top-2 grid size-5 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
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
