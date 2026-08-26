"use client";

/**
 * شريط تكبير المعاينة — يُسهّل على المصمّم الضبط الدقيق.
 * ------------------------------------------------------------------
 * التكبير يُطبَّق بتوسيع صندوق المعاينة نفسه (عرض بالنسبة المئوية)
 * لا بـtransform: scale. الفرق مهمّ — السحب يقيس الموضع بـ
 * getBoundingClientRect، وهو يعكس العرض الفعلي بعد التوسيع، فتبقى
 * النِسَب صحيحة عند أي تكبير. أما scale فيغيّر الرسم دون الصندوق
 * فينحرف موضع الماوس عن موضع العنصر.
 */
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

export const ZOOM_STEPS = [1, 1.25, 1.5, 2, 2.5, 3] as const;

export function ZoomBar({
  zoom,
  onZoom,
  className = "",
}: {
  zoom: number;
  onZoom: (z: number) => void;
  className?: string;
}) {
  const i = ZOOM_STEPS.indexOf(zoom as (typeof ZOOM_STEPS)[number]);
  const idx = i === -1 ? 0 : i;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        aria-label="تصغير"
        disabled={idx === 0}
        onClick={() => onZoom(ZOOM_STEPS[Math.max(0, idx - 1)])}
        className="grid size-8 place-items-center rounded-full border border-border transition hover:border-primary hover:text-primary disabled:opacity-40"
      >
        <ZoomOut className="size-4" />
      </button>

      <span className="min-w-[3.2rem] text-center text-[11px] font-bold tabular-nums">
        {Math.round(zoom * 100).toLocaleString("ar-EG")}٪
      </span>

      <button
        type="button"
        aria-label="تكبير"
        disabled={idx === ZOOM_STEPS.length - 1}
        onClick={() => onZoom(ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, idx + 1)])}
        className="grid size-8 place-items-center rounded-full border border-border transition hover:border-primary hover:text-primary disabled:opacity-40"
      >
        <ZoomIn className="size-4" />
      </button>

      <button
        type="button"
        aria-label="إعادة المقاس"
        disabled={zoom === 1}
        onClick={() => onZoom(1)}
        className="grid size-8 place-items-center rounded-full border border-border transition hover:border-primary hover:text-primary disabled:opacity-40"
      >
        <Maximize2 className="size-4" />
      </button>
    </div>
  );
}
