"use client";

/**
 * قسم «المراحل والفروع» — لوحان مخطوطان جنباً إلى جنب.
 * ------------------------------------------------------------
 * لوح للمرحلة الإعدادية وآخر للثانوية، كلٌّ بفروعه، مرسومان بـSVG:
 * إطار مذهّب مقوّس، ترويسة بعدد الفروع، وقائمة فروع بنقاط إعجام.
 *
 * المحتوى من `content.stages` إن وُجد، وإلا يسقط للقيم الافتراضية —
 * فيمكن للأدمن تعديله لاحقاً بلا لمس الكود.
 */
import { motion } from "framer-motion";
import { SectionHeading, Reveal } from "@/components/ui/primitives";
import { KuficBackdrop, ArchTile, CornerKnot } from "@/components/brand/pattern";
import { WritingLine } from "@/components/brand/calligraphy";
import { ArabicTextBackdrop } from "@/components/brand/text-backdrop";
import { useContent } from "@/components/content/content-provider";

const ar = (n: number) => n.toLocaleString("ar-EG");

type Stage = { name: string; note?: string; branches: string[] };

const FALLBACK: Stage[] = [
  {
    name: "المرحلة الإعدادية",
    note: "منهج اللغة العربية كاملاً",
    branches: ["القراءة والنصوص", "النحو", "القصة", "التعبير", "الإملاء والخطّ"],
  },
  {
    name: "المرحلة الثانوية",
    note: "الفروع الأربعة بالتفصيل",
    branches: ["النحو", "الصرف", "البلاغة", "الأدب والنصوص"],
  },
];

export function Stages() {
  const { content } = useContent();
  if (content.ui?.["section.stages"]?.hidden) return null;

  const stages = ((content as { stages?: Stage[] }).stages ?? FALLBACK).filter(
    (s) => s?.name && s.branches?.length
  );
  if (!stages.length) return null;

  return (
    <section id="stages" className="relative py-24">
      <ArabicTextBackdrop count={22} seed={13} fade="center" opacity={0.42} tone="text-accent/22" />
      <KuficBackdrop density={44} opacity={0.14} fade="center" tone="text-primary/8" />

      <div className="container">
        <SectionHeading
          eyebrow="المراحل"
          title={
            <>
              مرحلتان، وكل فرع <span className="text-gradient">بمنهجه</span>
            </>
          }
          desc="اختر مرحلتك وابدأ من أول درس — الترتيب مبنيّ على المنهج، لا على المزاج."
        />

        <div className="grid gap-5 md:grid-cols-2">
          {stages.map((s, i) => (
            <Reveal key={s.name} delay={i * 0.1}>
              <motion.article
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group glass foil relative h-full overflow-hidden rounded-4xl p-7 shadow-bento"
              >
                <CornerKnot size={72} className="pointer-events-none absolute right-0 top-0 text-accent/40" />

                {/* ترويسة اللوح */}
                <div className="relative flex items-start gap-4">
                  <span className="relative grid size-12 shrink-0 place-items-center text-primary">
                    <ArchTile size={48} className="absolute inset-0" />
                    <span className="font-display relative text-lg font-bold">{ar(i + 1)}</span>
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-xl font-bold leading-snug">{s.name}</h3>
                    {s.note && (
                      <p className="font-kufi mt-1 text-[10px] tracking-wide text-accent">{s.note}</p>
                    )}
                  </div>
                  <span className="font-kufi mr-auto shrink-0 rounded-full bg-accent/12 px-2.5 py-1 text-[10px] font-bold text-accent">
                    {ar(s.branches.length)} فروع
                  </span>
                </div>

                <WritingLine
                  width={220}
                  seed={41 + i * 7}
                  strokeWidth={2.4}
                  delay={0.15 + i * 0.1}
                  className="mt-3 text-accent/45"
                />

                {/* الفروع */}
                <ul className="mt-5 space-y-2.5">
                  {s.branches.map((b) => (
                    <li key={b} className="flex items-center gap-3 text-sm">
                      {/* نقطة إعجام مذهّبة */}
                      <svg viewBox="0 0 14 14" className="size-3.5 shrink-0 text-accent" fill="none" aria-hidden="true">
                        <path d="M7 1 12 7 7 13 2 7Z" stroke="currentColor" strokeWidth="1.2" />
                        <circle cx="7" cy="7" r="1.6" fill="currentColor" />
                      </svg>
                      <span className="font-medium">{b}</span>
                    </li>
                  ))}
                </ul>

                {/* خيط مذهّب يمتدّ عند التمرير */}
                <span className="mt-6 block h-px w-12 origin-right bg-gradient-to-l from-accent to-transparent transition-all duration-500 group-hover:w-28" />
              </motion.article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
