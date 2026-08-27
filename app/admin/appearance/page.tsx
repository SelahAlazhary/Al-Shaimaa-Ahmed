"use client";

/**
 * مظهر بوابة الطالب — اختيار الثيم والتخطيط.
 * ------------------------------------------------------------------
 * كل بطاقة معاينة مرسومة SVG بألوان الثيم نفسه وزخرفته، فما يراه
 * الأدمن هنا هو ما سيراه الطالب فعلاً — لا مربّعات ألوان مجرّدة.
 * الاختيار يُحفظ فوراً ويسري على كل الطلاب.
 */
import { useState } from "react";
import { Check, Loader2, Palette, LayoutGrid, Home, Smartphone, Shapes, RotateCcw, PanelRight, Menu } from "lucide-react";
import { PageHeader, Card } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";
import {
  STUDENT_SKINS, STUDENT_LAYOUTS, MOBILE_LAYOUTS, findSkin, findLayout, findMobile,
  DEFAULT_SKIN, DEFAULT_LAYOUT, DEFAULT_MOBILE,
  type StudentSkin, type StudentLayout, type MobileLayout,
} from "@/lib/skins";
import {
  SkinPreview, LayoutPreview, HomeLayoutPreview, MobilePreview, DesignPreview,
  SideNavPreview, DockPreview,
} from "@/components/admin/skin-preview";
import {
  SIDE_NAV_STYLES, DOCK_STYLES, findSideNav, findDock,
  DEFAULT_SIDE_NAV, DEFAULT_DOCK, type SideNavStyle, type DockStyle,
} from "@/lib/nav-styles";
import { STUDENT_DESIGNS, findDesign, DEFAULT_DESIGN, type StudentDesign } from "@/lib/designs";
import { HOME_LAYOUTS, findHomeLayout, DEFAULT_HOME_LAYOUT, type HomeLayout } from "@/lib/home-layouts";

type Tab = "skin" | "design" | "layout" | "side" | "dock" | "mobile" | "home";

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
