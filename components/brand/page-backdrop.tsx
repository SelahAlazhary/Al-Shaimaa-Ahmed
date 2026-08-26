"use client";

/**
 * خلفية الصفحة الثابتة.
 * ------------------------------------------------------------
 * طبقة واحدة `fixed` تملأ الشاشة وتبقى مكانها بينما يمرّ المحتوى فوقها:
 *   حروف الهجاء الطافية · تبليط كوفي مربّع · حقل حركات · شمسة مذهّبة.
 *
 * لماذا طبقة واحدة على مستوى الصفحة بدل خلفية لكل قسم؟
 *   • القسمية كانت تُعيد رسم النمط مع كل قسم فيتقطّع عند الحدود.
 *   • `fixed` هنا تعطي إحساس العمق (المحتوى يتحرّك والخلفية ثابتة).
 *   • رسمة واحدة بدل خمس = عمل أقل على المتصفّح.
 *
 * ملاحظة: `position: fixed` تنكسر داخل أي أب عليه transform، لذلك
 * يجب أن تبقى هذه الطبقة ابناً مباشراً لجذر الصفحة لا داخل قسم متحرّك.
 */
import { KuficBackdrop, HarakatField, Shamsa } from "./pattern";
import { ArabicTextBackdrop } from "./text-backdrop";

export function PageBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* شمسة كبيرة أعلى اليسار — عمق هادئ خلف كل شيء */}
      <Shamsa
        size={720}
        rays={32}
        className="absolute -left-40 -top-52 opacity-[0.13]"
      />

      {/* تبليط كوفي خافت */}
      <KuficBackdrop
        density={44}
        opacity={0.22}
        fade="center"
        tone="text-primary/12"
      />

      {/* حروف الهجاء الطافية */}
      <ArabicTextBackdrop
        count={30}
        seed={5}
        fade="center"
        opacity={0.5}
        tone="text-primary/20"
      />

      {/* حركات التشكيل */}
      <HarakatField count={14} seed={11} tone="text-accent/28" />
    </div>
  );
}
