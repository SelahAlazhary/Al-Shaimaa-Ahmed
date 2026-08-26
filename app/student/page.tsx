"use client";

/**
 * بوابة الطالب — الصفحة الرئيسية.
 * ------------------------------------------------------------
 * التنسيق أُعيد بناؤه على هوية المخطوط:
 *   • لوح ترحيب من الحبر بتبليط كوفي وشمسة وسطر يُخطّ حياً.
 *   • شريط مؤشّرات (كورسات · متوسّط التقدّم · اشتراكات سارية).
 *   • بطاقات الاشتراكات والتنبيهات، ثم قائمة الكورسات.
 * كل الأرقام مشتقّة من بيانات الطالب الفعلية — لا قيم تجميلية.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import {
  IconPlay, IconClipboardCheck, IconRadio, IconArrowLeft, IconClock,
  IconCalendar, IconLayers, IconBook, IconChart,
} from "@/components/brand/icons";
import { KuficBackdrop, CornerKnot, Shamsa, ElegantRule } from "@/components/brand/pattern";
import { ArabicTextBackdrop } from "@/components/brand/text-backdrop";
import { CourseArt } from "@/components/brand/course-art";
import { StatTile } from "@/components/brand/stat-tile";
import { EmptyCourses } from "@/components/brand/illustrations";
import { InstallApp } from "@/components/pwa/install-app";
import { EnableNotifications } from "@/components/pwa/enable-notifications";
import { Card, Progress, StatusBadge, Medallion, GoldRule } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";
import { subjectActive, activeSubs, daysLeft } from "@/lib/access";

const ar = (n: number) => n.toLocaleString("ar-EG");

export default function StudentHome() {
  const { db, session } = useContent();
  const me = db?.users.find((u) => u.id === session?.uid);
  const subjects = (db?.subjects ?? []).filter((s) => s.status === "منشورة");
  const live = db?.live ?? [];
  const exams = db?.exams ?? [];

  const fem = me?.gender === "female";
  const y = (v: string) => `${v}${fem ? "ي" : ""}`; // صيغة الأمر: أكمل/أكملي
  const owns = (s: { id: string; term?: 1 | 2 }) => subjectActive(me, s);
  const subs = activeSubs(me);
  const courses = subjects
    .filter((s) => owns(s))
    .map((s) => ({ ...s, progress: me?.progress?.[s.id] ?? 0 }));
  const liveNow = live.find((l) => l.status === "مباشر");
  // اختبار متاح فعلاً للطالب (الأسئلة تصل فارغة لمن لا يحقّ له)
  const nextExam = exams.find((e) => e.status === "منشور" && e.questions.length > 0);
  const avg = courses.length ? Math.round(courses.reduce((a, c) => a + c.progress, 0) / courses.length) : 0;
  // أقرب اشتراك ينتهي — منه تُشتقّ الأيام المتبقّية المعروضة
  const expiring = subs
    .map((sb) => ({ sb, left: daysLeft(sb.expiresAt) }))
    .filter((x) => x.left !== null)
    .sort((a, b) => (a.left as number) - (b.left as number))[0];
  const permanent = subs.some((sb) => daysLeft(sb.expiresAt) === null);

  return (
    <>
      {/* ---------------- لوح الترحيب ---------------- */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="btn-glow relative mb-6 overflow-hidden rounded-[1.75rem] p-6 text-white sm:p-8"
      >
        <ArabicTextBackdrop count={20} seed={17} fade="center" opacity={0.5} tone="text-white/30" className="!z-0" />
        <KuficBackdrop density={38} opacity={0.28} fade="center" tone="text-white/30" className="!z-0" />
        <Shamsa
          size={340}
          rays={24}
          className="pointer-events-none absolute -left-16 -top-20 z-0 opacity-25"
        />

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <p className="font-kufi text-base font-bold tracking-[0.04em] text-white/90 drop-shadow-sm sm:text-lg">
              أهلاً {fem ? "بكِ" : "بك"}
            </p>
            <h1 className="font-display mt-2 truncate text-3xl font-bold tracking-tight drop-shadow-sm sm:text-4xl">
              {session?.name}
            </h1>
            <ElegantRule width={220} className="mt-2.5 text-white/70" />
            {me?.grade && (
              <p className="font-kufi mt-1.5 text-xs font-semibold text-white/80">{me.grade}</p>
            )}
          </div>

        </div>

        {/* شريط المؤشّرات — ألواح SVG، وأرقام حقيقية فقط */}
        {/* المؤشّرات — ثلاث بطاقات: التقدّم · الكورسات · الاشتراك الساري */}
        <div className="relative mt-7 grid gap-3 sm:grid-cols-3 sm:gap-4">
          <StatTile index={0} ring={avg} label="متوسّط تقدّمك" icon={<IconChart className="size-5" />} />
          <StatTile
            index={1}
            value={ar(courses.length)}
            unit={courses.length === 1 ? "كورس" : "كورسات"}
            label="كورساتك"
            icon={<IconBook className="size-5" />}
          />
          {/* الاشتراك الساري — يعرض ما تبقّى حتى الانتهاء */}
          <StatTile
            index={2}
            icon={<IconLayers className="size-5" />}
            badge={subs.length > 1 ? `${ar(subs.length)} اشتراكات` : undefined}
            value={
              subs.length === 0 ? "—" : permanent && !expiring ? "دائم" : ar(expiring?.left ?? 0)
            }
            unit={
              subs.length === 0 || (permanent && !expiring)
                ? undefined
                : (expiring?.left ?? 0) === 1
                  ? "يوم متبقٍّ"
                  : "يوماً متبقّياً"
            }
            label={subs.length === 0 ? "لا يوجد اشتراك ساري" : "اشتراك ساري"}
            /* الشريط يقيس ما تبقّى من ٣٠ يوماً — يقصر كلما اقترب الانتهاء */
            bar={
              subs.length === 0 ? 0 : permanent && !expiring ? 100 : Math.min(100, ((expiring?.left ?? 0) / 30) * 100)
            }
          />
        </div>
      </motion.div>

      {/* ---------------- الاشتراكات السارية ---------------- */}
      {subs.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {subs.map((sb) => {
            const left = daysLeft(sb.expiresAt);
            const all = sb.subjectId === "*";
            const soon = left !== null && left <= 7;
            return (
              <Card key={sb.id} className="flex items-center gap-3 !p-4">
                <Medallion size={44} className="text-accent">
                  {all ? <IconLayers className="size-5" /> : <IconPlay className="size-5" />}
                </Medallion>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">
                    {sb.planName ?? (all ? "الترم الكامل" : "اشتراك كورس")}
                  </p>
                  <p className="font-kufi mt-0.5 text-[10px] text-muted-foreground">
                    {all ? "كل المواد المتاحة لصفّك" : subjects.find((s) => s.id === sb.subjectId)?.name ?? "كورس"}
                  </p>
                </div>
                <span
                  className={`font-kufi inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    soon ? "bg-amber-500/15 text-amber-600" : "bg-emerald-500/14 text-emerald-600"
                  }`}
                >
                  <IconCalendar className="size-3" />
                  {left !== null ? `متبقٍ ${ar(left)} يوم` : "بلا انتهاء"}
                </span>
              </Card>
            );
          })}
        </div>
      )}

      <InstallApp className="mb-4" />
      <EnableNotifications className="mb-6" />

      {/* ---------------- تنبيهات: بث واختبار ---------------- */}
      {(liveNow || nextExam) && (
        <div className="mb-7 grid gap-4 sm:grid-cols-2">
          {liveNow && (
            <Card className="flex items-center gap-4 !p-4">
              <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-rose-500/12 text-rose-500">
                <IconRadio anim="pulse" className="size-6" />
                <span className="absolute inset-0 animate-pulse-ring rounded-2xl bg-rose-500/40" />
              </span>
              <div className="min-w-0 flex-1">
                <StatusBadge status="مباشر" />
                <p className="mt-1 truncate font-bold">{liveNow.title}</p>
              </div>
              <Link href="/student/live" className="btn-glow rounded-full px-4 py-2.5 text-xs font-bold text-white">
                دخول
              </Link>
            </Card>
          )}
          {nextExam && (
            <Card className="flex items-center gap-4 !p-4">
              <Medallion size={48} className="text-primary">
                <IconClipboardCheck className="size-6" />
              </Medallion>
              <div className="min-w-0 flex-1">
                <p className="font-kufi text-[10px] tracking-wide text-accent">اختبار متاح</p>
                <p className="mt-0.5 truncate font-bold">{nextExam.title}</p>
              </div>
              <Link
                href={`/student/exams/${nextExam.id}`}
                className="btn-foil rounded-full px-4 py-2.5 text-xs font-bold transition hover:text-primary"
              >
                {y("ابدأ")}
              </Link>
            </Card>
          )}
        </div>
      )}

      {/* ---------------- الكورسات ---------------- */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-lg font-bold">{y("أكمل")} المذاكرة</p>
          <Link
            href="/student/subjects"
            className="font-kufi group -my-2 inline-flex items-center gap-1 py-2 text-[11px] font-bold text-primary"
          >
            كل الكورسات <IconArrowLeft className="ico-slide size-4" />
          </Link>
        </div>
        <div className="mt-3 max-w-[14rem] text-accent">
          <GoldRule />
        </div>
      </div>

      {courses.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <EmptyCourses className="text-accent" width={168} />
          <p className="font-display text-lg font-bold">لم {y("تفعّل")} أي كورس بعد</p>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            {y("تصفّح")} الكورسات المتاحة {y("واشتر")} ما يناسبك، ثم {y("فعّل")}ه بكود التفعيل.
          </p>
          <Link href="/student/subjects" className="btn-glow mt-2 rounded-full px-7 py-3 text-sm font-bold text-white">
            {y("تصفّح")} الكورسات
          </Link>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {courses.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Link href={`/student/course/${c.id}`} className="group block">
              <Card className="relative flex gap-4 overflow-hidden !p-4 transition hover:border-accent/50">
                <CornerKnot size={52} className="pointer-events-none absolute left-0 top-0 -scale-x-100 text-accent/35" />
                {/* لوحة مصغّرة من نفس نظام أغلفة الكورسات */}
                <span className="relative w-28 shrink-0 overflow-hidden rounded-2xl sm:w-32">
                  <CourseArt
                    seed={c.id}
                    title={c.name}
                    cover={c.cover}
                    coverFit={c.coverFit}
                    coverRatio={c.coverRatio}
                    coverColor={c.coverColor}
                    progress={c.progress}
                    className="h-full transition-opacity duration-300 group-hover:opacity-95"
                  />
                </span>
                <span className="relative flex min-w-0 flex-1 flex-col justify-center">
                  <p className="font-display truncate font-bold">{c.name}</p>
                  <p className="font-kufi mt-0.5 text-[10px] text-muted-foreground">{c.teacher}</p>

                  <span className="mt-3 block">
                    <Progress value={c.progress} />
                  </span>

                  <span className="font-kufi mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <IconClock className="size-3.5" /> {ar(c.lessons)} درس
                    </span>
                    <span>{ar(c.progress)}٪</span>
                  </span>

                  <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                    {y("أكمل")} من حيث توقّفت <IconArrowLeft className="ico-slide size-3.5" />
                  </span>
                </span>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </>
  );
}
