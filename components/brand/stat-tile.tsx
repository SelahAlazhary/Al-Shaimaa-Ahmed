"use client";

/**
 * بطاقة مؤشّر — تصميم عصري خفيف.
 * ------------------------------------------------------------------
 * بديل «لوح المؤشّر» المزخرف: بطاقة زجاجية بحواف طرية، شارة أيقونة
 * متدرّجة، رقم كبير بارز، وشريط رفيع يوضّح النسبة. الزخرفة الوحيدة
 * وهج متدرّج خفيف في الركن — يعطي إحساساً شاباً بلا ثقل.
 *
 * الحلقة (حين تُطلب) مرسومة SVG بحدّ سميك وطرف مدوّر وتدرّج، وتُملأ
 * عند الظهور.
 *
 * الأرقام والعناوين HTML — لقارئات الشاشة والاتجاه RTL.
 */
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useUid } from "./use-uid";

export function StatTile({
  value,
  unit,
  label,
  icon,
  /** ٠..١٠٠ — يرسم حلقة بدل الرقم الكبير. */
  ring,
  /** ٠..١٠٠ — شريط رفيع أسفل البطاقة. */
  bar,
  /** نصّ صغير يظهر كشارة أعلى اليسار. */
  badge,
  index = 0,
  className = "",
}: {
  value?: ReactNode;
  unit?: string;
  label: string;
  icon?: ReactNode;
  ring?: number;
  bar?: number;
  badge?: string;
  index?: number;
  className?: string;
}) {
  const uid = useUid("tile");
  const pct = Math.max(0, Math.min(100, ring ?? 0));
  const r = 26;
  const circ = 2 * Math.PI * r;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className={`group relative overflow-hidden rounded-[1.4rem] bg-white/[0.07] p-4 ring-1 ring-white/15 backdrop-blur-sm transition-shadow hover:ring-white/30 sm:p-5 ${className}`}
    >
      {/* وهج متدرّج في الركن — يضيء قليلاً عند المرور */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-8 -top-10 size-28 rounded-full opacity-40 blur-2xl transition-opacity duration-500 group-hover:opacity-70"
        style={{ background: "radial-gradient(circle, hsl(var(--gold-light)) 0%, transparent 70%)" }}
      />

      <div className="relative flex items-start justify-between gap-2">
        {icon && (
          <span
            className="grid size-10 place-items-center rounded-2xl text-[hsl(226_52%_18%)] shadow-sm"
            style={{ background: "linear-gradient(135deg, hsl(var(--gold-light)), hsl(var(--gold)))" }}
          >
            {icon}
          </span>
        )}
        {badge && (
          <span className="font-kufi rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold text-white/90">
            {badge}
          </span>
        )}
      </div>

      {/* الجسم: حلقة أو رقم */}
      {ring !== undefined ? (
        <div className="relative mt-3 flex items-center gap-3">
          <span className="relative grid size-[4.5rem] shrink-0 place-items-center">
            <svg viewBox="0 0 64 64" className="size-full -rotate-90" fill="none" aria-hidden="true">
              <defs>
                <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="hsl(var(--gold-light))" />
                  <stop offset="100%" stopColor="hsl(var(--gold))" />
                </linearGradient>
              </defs>
              <circle cx="32" cy="32" r={r} stroke="hsl(0 0% 100% / 0.16)" strokeWidth="7" />
              <motion.circle
                cx="32"
                cy="32"
                r={r}
                stroke={`url(#${uid}-g)`}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
                transition={{ duration: 1.1, ease: "easeOut", delay: 0.25 + index * 0.08 }}
              />
            </svg>
            <span className="font-display absolute text-base font-bold text-white">
              {pct.toLocaleString("ar-EG")}٪
            </span>
          </span>
          <span className="font-kufi min-w-0 text-[0.78rem] font-bold leading-snug text-white/80">
            {label}
          </span>
        </div>
      ) : (
        <div className="relative mt-4">
          <p className="font-display flex items-baseline gap-1.5 leading-none text-white">
            <span className="text-[2.35rem] font-bold tracking-tight">{value}</span>
            {unit && <span className="font-kufi text-sm font-bold text-white/70">{unit}</span>}
          </p>
          <p className="font-kufi mt-2 text-[0.78rem] font-bold text-white/75">{label}</p>
        </div>
      )}

      {/* شريط النسبة */}
      {bar !== undefined && (
        <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/15">
          <motion.span
            className="block h-full rounded-full"
            style={{ background: "linear-gradient(90deg, hsl(var(--gold)), hsl(var(--gold-light)))" }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(100, bar))}%` }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 + index * 0.08 }}
          />
        </div>
      )}
    </motion.div>
  );
}
