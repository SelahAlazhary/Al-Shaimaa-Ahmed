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

  return (
    <main
      className={`relative min-h-screen overflow-x-hidden ${WIDTH_CLASS[L.width]} ${DENSITY_CLASS[L.density]}`}
      data-home-layout={L.id}
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
    </main>
  );
}
