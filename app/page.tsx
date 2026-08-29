import { Navbar } from "@/components/sections/navbar";
import { SiteBackground } from "@/components/sections/site-background";
import { Hero } from "@/components/sections/hero";
import { FreeLive } from "@/components/sections/free-live";
import { Stages } from "@/components/sections/stages";
import { Features } from "@/components/sections/features";
import { Plans } from "@/components/sections/plans";
import { Testimonials } from "@/components/sections/testimonials";
import { Faq } from "@/components/sections/faq";
import { CtaFooter } from "@/components/sections/cta-footer";
import { SectionDivider } from "@/components/sections/section-divider";
import { getPublicDB, loadDB } from "@/lib/db";
import {
  findHomeLayout, WIDTH_CLASS, DENSITY_CLASS, type HomeSection,
} from "@/lib/home-layouts";
import { findToolbar, toolbarClass, stickClass } from "@/lib/toolbar-styles";
import { findMobileHome, mobileHomeClass } from "@/lib/mobile-home";
import { findButtonStyle, buttonClass } from "@/lib/button-styles";
import { findHeroShell, heroShellClass, heroShellVars } from "@/lib/hero-shell";
import { findIconFrame, iconFrameClass, iconFrameVars } from "@/lib/icon-frames";
import { findIconMotion, iconMotionClass } from "@/lib/icon-motion";
import { MobileDock } from "@/components/sections/mobile-dock";
import { findMotion, motionClass, motionVars } from "@/lib/motion-styles";

export const dynamic = "force-dynamic";

/** كل قسم قابل للترتيب مربوط بمكوّنه — الترتيب بيانات، والرسم هنا. */
const SECTIONS: Record<HomeSection, React.ComponentType> = {
  freeLive: FreeLive,
  stages: Stages,
  features: Features,
  plans: Plans,
  testimonials: Testimonials,
  faq: Faq,
};

export default async function Home() {
  await loadDB();
  const { content } = getPublicDB();
  const L = findHomeLayout(content.homeLayout);
  /* شريط الواجهة له مفتاحه؛ وفارغاً يتبع شريط اللوحة كما كان. */
  const bar = findToolbar(content.navbarStyle || content.toolbarStyle);
  /* تنسيق الهاتف — قواعده كلّها داخل استعلام وسائط، فلا يمسّ الأوسع. */
  const MH = findMobileHome(content.mobileHome);
  const MO = findMotion(content.motionStyle);
  const SH = findHeroShell(content.heroShell);
  const IF = findIconFrame(content.iconFrame);
  const IM = findIconMotion(content.iconMotion);
  const shOpts = content.heroShellOpts;

  return (
    <main
      className={`relative min-h-screen overflow-x-hidden ${WIDTH_CLASS[L.width]} ${DENSITY_CLASS[L.density]} ${toolbarClass(bar)} ${stickClass(content.navbarStick)} ${mobileHomeClass(MH)} ${motionClass(MO)} ${content.navbarHidden ? "bar-hidden" : ""} ${buttonClass(findButtonStyle(content.buttonStyle))} ${heroShellClass(SH)} ${shOpts?.text ? "hsh-text" : ""} ${iconFrameClass(IF)} ${iconMotionClass(IM)}`}
      style={{ ...motionVars(MO), ...heroShellVars(shOpts), ...iconFrameVars(content.iconFrameColors) }}
      data-home-layout={L.id}
      data-toolbar={bar.id}
    >
      {/* خلفية الصفحة — تُضبط من «تخصيص الموقع ← الصور» */}
      <SiteBackground />
      <Navbar />
      <Hero shape={L.hero} />

      {L.order.map((id, i) => {
        const Section = SECTIONS[id];
        return (
          <div key={id}>
            {/* الفاصل بين الأقسام لا قبل أوّلها */}
            {i > 0 && <SectionDivider kind={L.divider} />}
            <Section />
          </div>
        );
      })}

      <CtaFooter />

      {/* دعوة ثابتة أسفل شاشة الهاتف — ظهورها من CSS بحسب التنسيق */}
      <MobileDock />
    </main>
  );
}
