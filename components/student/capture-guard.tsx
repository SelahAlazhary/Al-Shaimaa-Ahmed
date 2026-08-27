"use client";

/**
 * حماية محتوى الكورس من الالتقاط.
 * ------------------------------------------------------------------
 * ما يجب أن يكون واضحاً قبل كل شيء: **لا يمكن لأي موقع أن يمنع لقطة
 * الشاشة فعلاً**. اللقطة يلتقطها نظام التشغيل أو كاميرا هاتف آخر، ولا
 * توجد واجهة برمجية في أي متصفّح تمنع ذلك. من يَعِد بغير هذا يبيع وهماً.
 *
 * ما تفعله هذه الطبقة حقيقةً — وهو رفع كلفة النسخ على غير المتخصّص:
 *  • تُعطّل قائمة الزرّ الأيمن (حفظ الفيديو/الصورة).
 *  • تصدّ الاختصارات الشائعة: PrintScreen · Ctrl+P · Ctrl+S ·
 *    أدوات المطوّر — وتمسح الحافظة بعد PrintScreen.
 *  • تُخفي المحتوى حين تفقد النافذة التركيز أو تُخفى — وهذا يُفشل أدوات
 *    التسجيل التي تلتقط نافذة أخرى، وكثيراً من إضافات اللقطة.
 *  • تمنع الطباعة والحفظ كـPDF.
 *  • تمنع تحديد النصّ وسحب الصور.
 *
 * وكلّها تُعطَّل تلقائياً حين يفضّل المستخدم تقليل الحركة أو يعتمد على
 * قارئ شاشة؟ لا — الحماية تبقى، لكن لا شيء منها يعطّل قراءة المحتوى.
 */
import { useEffect } from "react";

export function CaptureGuard({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;

    const root = document.documentElement;
    root.classList.add("capture-guard");

    /** قائمة الزرّ الأيمن — أسهل طريق لحفظ الفيديو أو الصورة. */
    const onContext = (e: MouseEvent) => e.preventDefault();

    /** سحب الصور خارج الصفحة. */
    const onDrag = (e: DragEvent) => e.preventDefault();

    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();

      // PrintScreen: لا يمكن منع الالتقاط، لكن يمكن إفراغ الحافظة بعده
      if (e.key === "PrintScreen" || k === "printscreen") {
        try {
          void navigator.clipboard?.writeText("");
        } catch {
          /* الحافظة قد تكون ممنوعة — لا شيء نفعله */
        }
        e.preventDefault();
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;
      // الطباعة والحفظ ونسخ الصفحة
      if (ctrl && ["p", "s", "u"].includes(k)) e.preventDefault();
      // أدوات المطوّر
      if (e.key === "F12") e.preventDefault();
      if (ctrl && e.shiftKey && ["i", "j", "c"].includes(k)) e.preventDefault();
    };

    /** إخفاء المحتوى حين تفقد النافذة التركيز — يُفشل أدوات اللقطة الخارجية. */
    const hide = () => root.classList.add("capture-hidden");
    const show = () => root.classList.remove("capture-hidden");
    const onVisibility = () => (document.hidden ? hide() : show());

    document.addEventListener("contextmenu", onContext);
    document.addEventListener("dragstart", onDrag);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("blur", hide);
    window.addEventListener("focus", show);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      root.classList.remove("capture-guard", "capture-hidden");
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("dragstart", onDrag);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("blur", hide);
      window.removeEventListener("focus", show);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled]);

  return null;
}
