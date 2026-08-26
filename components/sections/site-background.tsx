"use client";

/**
 * خلفية الصفحة الرئيسية.
 * ------------------------------------------------------------------
 * صورة يضبطها الأدمن تُرسم خلف كل الأقسام، مع خيارين:
 *
 * • «ثابتة»: الطبقة `position: fixed` فتبقى في مكانها والمحتوى يمرّ
 *   فوقها. لم نستخدم `background-attachment: fixed` لأنها معطّلة على
 *   iOS ومكلفة في الرسم على الجوّال — والطبقة الثابتة تعطي الأثر نفسه
 *   في كل المتصفّحات.
 * • «تتحرّك مع الصفحة»: الطبقة مطلقة داخل الصفحة فتمرّ معها.
 *
 * فوق الصورة حجاب من لون الخلفية يضمن بقاء النصوص مقروءة مهما كانت
 * الصورة، ويشتدّ في الوضع الداكن.
 */
import { useContent } from "@/components/content/content-provider";
import { mediaSrc } from "@/lib/media";

export function SiteBackground() {
  const { content } = useContent();
  const bg = content.background;
  if (!bg?.image) return null;

  const opacity = Math.max(0, Math.min(100, bg.opacity ?? 35)) / 100;
  const blur = Math.max(0, Math.min(20, bg.blur ?? 0));

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none ${bg.fixed ? "fixed" : "absolute"} inset-0 -z-20 overflow-hidden`}
    >
      <div
        className="size-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${mediaSrc(bg.image)})`,
          opacity,
          filter: blur ? `blur(${blur}px)` : undefined,
          // التكبير الطفيف يخفي حواف الضباب الشفّافة
          transform: blur ? "scale(1.06)" : undefined,
        }}
      />
      {/* حجاب يضمن التباين مع النصوص */}
      <div className="absolute inset-0 bg-background/45" />
    </div>
  );
}
