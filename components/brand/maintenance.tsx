"use client";

/**
 * لوحُ الصيانة.
 * ------------------------------------------------------------------
 * شاشةٌ للمنصّة كلِّها، ولوحٌ صغيرٌ يحلّ محلَّ قسمٍ واحد — بالمكوّن نفسِه
 * بحجمين، فلا يفترق الشكلُ بين الحالتين ولا تُكتب الرسالةُ مرّتين.
 */

import { Wrench, Clock } from "lucide-react";

export function MaintenancePanel({
  title,
  message,
  until,
  full = false,
}: {
  title: string;
  message: string;
  until?: string;
  /** شاشةٌ كاملة بدل لوحٍ داخل الصفحة. */
  full?: boolean;
}) {
  const body = (
    <div
      className={`mx-auto grid max-w-lg place-items-center gap-4 rounded-3xl border border-border bg-card/70 p-8 text-center shadow-bento ${
        full ? "" : "my-10"
      }`}
    >
      <span className="grid size-16 place-items-center rounded-3xl bg-primary/10 text-primary">
        <Wrench className="size-8" />
      </span>
      <h2 className="font-display text-2xl font-extrabold leading-snug">{title}</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">{message}</p>
      {until && (
        <p className="inline-flex items-center gap-1.5 rounded-full bg-muted px-4 py-2 text-xs font-bold text-muted-foreground">
          <Clock className="size-3.5" /> العودة المتوقّعة: {until}
        </p>
      )}
    </div>
  );

  if (!full) return body;

  return (
    <main className="grid min-h-screen place-items-center px-5 py-16">{body}</main>
  );
}

/**
 * شريطُ تنبيه الأدمن.
 * الأدمن يمرّ من الصيانة، فلولا هذا الشريط لظنّ المنصّة تعمل — وبقيت
 * مغلقةً على الطلاب أسبوعاً بلا أن يدري أحد.
 */
export function MaintenanceBar({ what }: { what: string }) {
  return (
    <div className="sticky top-0 z-[70] flex flex-wrap items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-[11px] font-bold text-amber-950">
      <Wrench className="size-3.5" />
      وضع الصيانة مفعّل: {what} — أنت ترى المنصّة لأنّك مشرف، والطلاب لا يرونها.
    </div>
  );
}
