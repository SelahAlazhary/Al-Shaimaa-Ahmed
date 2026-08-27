"use client";

/**
 * صفحة الدفع — بوّابة الاشتراك كاملةً.
 * ------------------------------------------------------------------
 * كانت البوّابة تُفتح في قائمة عائمة فوق الكورسات: مساحةٌ ضيّقة تُمرَّر
 * فيها بيانات التحويل ورفعُ الإيصال، وتُغلق بضغطة خارجها فيضيع ما كُتب.
 * الدفعُ خطوةٌ تستحقّ صفحتها.
 *
 * ولا تُفتح إلا من داخل كورس: السياق يأتي من `?subject=`. صفحةُ دفعٍ
 * عامّة تسأل «ادفع» قبل أن يختار الطالب ما يدفع مقابله.
 */

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IconKey, IconSpinner, IconCheckCircle, IconArrowLeft,
} from "@/components/brand/icons";
import { PageHeader, Card } from "@/components/dashboard/ui";
import { StudentHomeSkeleton } from "@/components/ui/skeleton";
import { useContent } from "@/components/content/content-provider";
import { PayGate } from "@/components/student/pay-gate";
import { cleanPrefix, gatewayOn } from "@/lib/payments";
import { plansFor } from "@/lib/plans";

export default function PayPage() {
  return (
    <Suspense fallback={<StudentHomeSkeleton header statsInHeader cards={2} />}>
      <PayInner />
    </Suspense>
  );
}

function PayInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { db, content, session, loading, refresh } = useContent();

  const subjectId = params.get("subject") ?? "";
  const me = db?.users?.find((u) => u.id === session?.uid);
  const subject = db?.subjects?.find((s) => s.id === subjectId);
  const plans = plansFor(subject, db?.plans ?? [], me);
  const fem = me?.gender === "female";
  const y = (v: string) => `${v}${fem ? "ي" : ""}`;
  const codePrefix = cleanPrefix(content.codePrefix);

  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  /*
    البوّابة لا تُفتح إلا من داخل كورس.
    ------------------------------------------------------------------
    صفحةُ دفعٍ عامّة تسأل «ادفع» قبل أن يختار الطالب ما يدفع مقابله —
    فالسياق شرطٌ لا زينة. وبلا كورسٍ صالح يُعاد إلى قائمة الكورسات.
  */
  const noSubject = !loading && Boolean(db) && !subject;
  useEffect(() => {
    if (noSubject) router.replace("/student/subjects");
  }, [noSubject, router]);

  if (loading || !db) return <StudentHomeSkeleton header statsInHeader cards={2} />;

  if (!subject) {
    return (
      <Card className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="font-display text-lg font-extrabold">اختر الكورس أوّلاً</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          الاشتراك يبدأ من داخل الكورس الذي تريده — جارٍ تحويلك إلى قائمة الكورسات.
        </p>
        <Link href="/student/subjects" className="btn-glow rounded-2xl px-5 py-2.5 text-sm font-bold text-white">
          الكورسات
        </Link>
      </Card>
    );
  }

  const activate = async () => {
    setErr(null);
    if (!code.trim()) { setErr(`${y("أدخل")} كود التفعيل`); return; }
    setBusy(true);
    const res = await fetch("/api/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, subjectId: subject.id }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(data.error || "تعذّر التفعيل"); return; }
    setDone(true);
    await refresh();
    setTimeout(() => router.push(`/student/course/${subject.id}`), 1400);
  };

  return (
    <>
      <PageHeader
        title={`الاشتراك في «${subject.name}»`}
        subtitle={`${subject.teacher} · ${subject.grade}`}
      />

      <Link
        href={`/student/course/${subject.id}`}
        className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-bold text-muted-foreground transition hover:text-foreground"
      >
        <IconArrowLeft className="size-3.5 rotate-180" />
        رجوع للكورس
      </Link>

      {done ? (
        <Card className="flex flex-col items-center gap-3 py-14 text-center">
          <IconCheckCircle className="size-14 text-emerald-500" />
          <p className="font-display text-xl font-extrabold">تم التفعيل 🎉</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            يمكنك الآن مشاهدة كل دروس «{subject.name}».
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr,20rem] lg:items-start">
          {/* البوّابة أو مسار واتساب */}
          <Card>
            {gatewayOn(content.payments) ? (
              <PayGate
                plans={plans}
                subject={subject}
                onDone={() => router.push(`/student/course/${subject.id}`)}
              />
            ) : (
              <div className="py-10 text-center">
                <p className="font-display text-lg font-extrabold">الدفع عبر واتساب</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  بوّابة الدفع داخل المنصّة غير مفعّلة حالياً. {y("تواصل")} مع الدعم على واتساب
                  {y("لتحويل")} قيمة الخطة واستلام كود التفعيل، ثم {y("أدخل")}ه بالجانب.
                </p>
                <Link
                  href="/student/help"
                  className="btn-glow mt-5 inline-flex rounded-2xl px-6 py-2.5 text-sm font-bold text-white"
                >
                  صفحة المساعدة والتواصل
                </Link>
              </div>
            )}
          </Card>

          {/* كود التفعيل — يبقى ظاهراً مهما كان مسار الشراء */}
          <Card className="lg:sticky lg:top-24">
            <p className="font-display mb-1 font-bold">عندك كود تفعيل؟</p>
            <p className="mb-4 text-[11px] leading-relaxed text-muted-foreground">
              {y("أدخل")} الكود الذي وصلك بعد مراجعة التحويل ليُفتح اشتراكك فوراً.
            </p>

            <div className="relative">
              <IconKey className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && activate()}
                placeholder={`${codePrefix}-XXXX-XXXX`}
                className="w-full rounded-2xl border border-border bg-card/60 py-3 pl-3 pr-10 text-center font-mono text-sm tracking-wider outline-none focus:border-primary/60"
              />
            </div>

            <button
              onClick={activate}
              disabled={busy}
              className="btn-glow mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy ? <IconSpinner className="size-4 animate-spin" /> : <IconCheckCircle className="size-4" />}
              تفعيل
            </button>

            {err && (
              <p className="mt-3 rounded-2xl bg-rose-500/10 px-3 py-2 text-center text-xs font-bold text-rose-500">{err}</p>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
