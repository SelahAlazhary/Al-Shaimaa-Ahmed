"use client";

/**
 * قسم «لماذا نحن» — بطاقات على هيئة لوحات مخطوط.
 * كل بطاقة: لوحة مقوّسة للأيقونة · رقم بالحروف الهندية داخل ميدالية مذهّبة ·
 * منمنمة زاوية · سطر خطّ عربي يظهر عند التمرير.
 */
import { motion } from "framer-motion";
import { SectionHeading, Reveal } from "@/components/ui/primitives";
import { useContent } from "@/components/content/content-provider";
import { findSectionStyle, sectionClass, sxGridClass } from "@/lib/section-styles";
import { FEATURE_ICONS, IconManuscript } from "@/components/brand/icons";
import { ArchTile, CornerKnot, KuficBackdrop } from "@/components/brand/pattern";
import { ArabicTextBackdrop } from "@/components/brand/text-backdrop";

/** رقم عربي-هندي (١٢٣) لهوية أدقّ. */
const ar = (n: number) => n.toLocaleString("ar-EG");

export function Features() {
  const { content } = useContent();
  if (content.ui?.["section.features"]?.hidden) return null;

  const subject = content.teacher?.subject || "اللغة العربية";
  const SX = findSectionStyle(content.featuresStyle);
  /*
    أصناف الهوية (glass/foil/الظلّ) تُكتب فقط في التصميم «الأصلي».
    محاولةُ إلغائها بقاعدة CSS أقوى تجعل كل سطح جديد يخوض حرب أولويات
    مع الهوية — والأنظف ألّا تُكتب أصلاً حين لا تُراد.
  */
  const brand = SX.card === "brand" ? "glass shadow-bento" : "";

  return (
    <section id="features" className={`relative py-24 ${sectionClass(SX)}`} data-section-style={SX.id}>
      <ArabicTextBackdrop count={20} seed={29} fade="center" opacity={0.38} tone="text-primary/18" />
      <KuficBackdrop density={46} opacity={0.14} fade="center" tone="text-primary/8" />

      <div className="container">
        <SectionHeading
          eyebrow="لماذا نحن"
          title={
            <>
              كل ما تحتاجه لإتقان <span className="text-gradient">{subject}</span>
            </>
          }
          desc="منهج مرتّب يبني القاعدة قبل الحفظ، وتطبيق بعد كل درس، ومتابعة حتى الإتقان."
        />

        <div className={`sx-grid grid items-stretch gap-4 ${sxGridClass(SX.grid, content.features.length)}`}>
          {content.features.map((f, i) => {
            const Icon = FEATURE_ICONS[f.icon] ?? IconManuscript;
            return (
              <Reveal key={f.title} delay={i * 0.08} className={f.span}>
                <motion.article
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`sx-card group relative h-full overflow-hidden rounded-4xl p-6 ${brand}`}
                >
                  {/* منمنمة الزاوية */}
                  <CornerKnot
                    size={64}
                    className="sx-knot pointer-events-none absolute right-0 top-0 text-accent/45 transition-opacity group-hover:opacity-90"
                  />

                  {/* ميدالية الرقم */}
                  <span className="pointer-events-none absolute left-5 top-5 grid size-9 place-items-center">
                    <svg viewBox="0 0 36 36" className="absolute inset-0 size-full text-accent/45" fill="none" aria-hidden="true">
                      <path d="M18 1.5 26 5.5 30.5 13.5 30.5 22.5 26 30.5 18 34.5 10 30.5 5.5 22.5 5.5 13.5 10 5.5Z" stroke="currentColor" strokeWidth="1" />
                      <circle cx="18" cy="18" r="11" stroke="currentColor" strokeWidth="0.8" opacity="0.55" />
                    </svg>
                    <span className="font-display relative text-sm font-bold text-accent">{ar(i + 1)}</span>
                  </span>

                  {/* لوحة الأيقونة */}
                  <span className="ic-frame relative mb-5 grid size-12 place-items-center text-primary">
                    <ArchTile size={48} className="absolute inset-0" />
                    <Icon anim="draw" className="relative size-6" />
                  </span>

                  <p className="font-kufi mb-1.5 text-[10px] tracking-[0.16em] text-accent">{f.tag}</p>
                  <h3 className="font-display text-xl font-bold leading-snug">{f.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>

                  {/* خيط مذهّب يمتدّ عند التمرير */}
                  <span className="mt-5 block h-px w-10 origin-right bg-gradient-to-l from-accent to-transparent transition-all duration-500 group-hover:w-24" />
                </motion.article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
