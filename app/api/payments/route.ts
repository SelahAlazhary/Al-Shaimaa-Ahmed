import { NextResponse } from "next/server";
import { loadDB, getDB, saveDB, flushDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { recordEvent, bannedUntil } from "@/lib/security";
import { clientIp, limit } from "@/lib/guard";
import { can } from "@/lib/perms";
import { sendToUsers } from "@/lib/push";
import { planPrice, planForStudent, resolvePlan } from "@/lib/plans";
import {
  activeMethods, planTarget, targetName, requestProblem, newActivationCode, normalizeDigits,
} from "@/lib/payments";
import {
  tgReady, tgSend, tgSendPhoto, payRequestText, payVerdictText, siteUrl, absolute,
} from "@/lib/telegram";
import type { DB, PayRequest, PayRequestStatus, Code, Notification } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_TEXT = 120;
const MAX_NOTE = 400;

function now() {
  return new Date().toISOString();
}

function clip(v: unknown, max: number): string {
  return String(v ?? "").trim().slice(0, max);
}

/* ------------------------------------------------------------------ */
/*  POST — الطالب يقدّم طلب دفع                                        */
/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "سجّل الدخول كطالب أولاً" }, { status: 401 });
  }

  const ip = await clientIp();
  if (bannedUntil(ip)) {
    return NextResponse.json({ error: "تم إيقاف المحاولات مؤقّتاً" }, { status: 429 });
  }
  /* طلبات الدفع تُراجَع يدوياً، فالإغراق بها إغراقٌ لصندوق المشرفة. */
  const gate = limit(`pay:${session.uid}`, 6, 10 * 60_000, 20 * 60_000);
  if (!gate.ok) {
    await recordEvent("rate_limited", "تجاوز حدّ طلبات الدفع", { userId: session.uid });
    return NextResponse.json({ error: "طلبات كثيرة — انتظر قليلاً ثم أعد المحاولة" }, { status: 429 });
  }

  const db = getDB();
  const me = db.users.find((u) => u.id === session.uid);
  if (!me || !me.active) {
    return NextResponse.json({ error: "الحساب غير متاح" }, { status: 403 });
  }

  const cfg = db.content.payments;
  if (!cfg?.enabled) {
    return NextResponse.json({ error: "بوّابة الدفع غير مفعّلة حالياً" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  /* الخطة قد تكون خيار سعر داخل الكورس — المصدر واحد للاثنين. */
  const plan = resolvePlan(String(body.planId ?? ""), db.plans, db.subjects);
  if (!plan) return NextResponse.json({ error: "الخطة غير موجودة" }, { status: 400 });
  /* فئة الخطة تُفحص هنا أيضاً: إخفاؤها في الواجهة ليس منعاً. */
  if (!planForStudent(plan, me)) {
    return NextResponse.json({ error: "هذه الخطة غير متاحة لبياناتك" }, { status: 403 });
  }

  const method = activeMethods(cfg.methods).find((m) => m.id === String(body.methodId ?? ""));
  if (!method) return NextResponse.json({ error: "طريقة الدفع غير متاحة" }, { status: 400 });

  const senderName = clip(body.senderName, MAX_TEXT);
  const senderAccount = clip(body.senderAccount, MAX_TEXT);
  const senderRef = clip(body.senderRef, MAX_TEXT);
  const receipt = clip(body.receipt, 600);
  const note = clip(body.note, MAX_NOTE);

  const problem = requestProblem(
    { methodId: method.id, senderName, senderAccount, receipt },
    { requireReceipt: cfg.requireReceipt, requireSender: cfg.requireSender }
  );
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  /* طلب معلّق لنفس الخطة: لا يُكرَّر — الازدواج يربك المراجعة لا أكثر. */
  db.payments = db.payments ?? [];
  if (db.payments.some((p) => p.userId === me.id && p.planId === plan.id && p.status === "pending")) {
    return NextResponse.json({ error: "لديك طلب قيد المراجعة لهذه الخطة بالفعل" }, { status: 409 });
  }

  /* السعر يُحسب من الخطة على الخادم — لا يُقبل رقم من الواجهة إطلاقاً. */
  const amount = planPrice(plan).price;
  const target = planTarget(plan, clip(body.subjectId, 80));

  const request: PayRequest = {
    id: `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    at: now(),
    userId: me.id,
    student: me.name,
    phone: me.phone,
    grade: me.grade,
    track: me.track,
    planId: plan.id,
    planName: plan.name,
    subjectId: target || undefined,
    subjectName: target ? targetName(target, db.subjects) : undefined,
    amount,
    methodId: method.id,
    methodName: method.name,
    senderName: senderName ? normalizeDigits(senderName) : undefined,
    senderAccount: senderAccount ? normalizeDigits(senderAccount) : undefined,
    senderRef: senderRef ? normalizeDigits(senderRef) : undefined,
    receipt: receipt || undefined,
    note: note || undefined,
    status: "pending",
    readByAdmin: false,
  };

  /* تليجرام تنبيهٌ لا شرطٌ: فشلُه يُسجَّل في الطلب ولا يُسقط التقديم. */
  request.telegram = await notifyTelegram(request, req);

  db.payments = [request, ...db.payments].slice(0, 4000);
  saveDB(db);
  await flushDB();

  return NextResponse.json({ ok: true, request });
}

/** يرسل الطلب لبوت تليجرام بزرّي قبول ورفض. */
async function notifyTelegram(r: PayRequest, req: Request): Promise<PayRequest["telegram"]> {
  if (!tgReady()) return "off";
  const url = siteUrl(req);
  const text = payRequestText(r, url);
  const buttons = [[
    { text: "✅ قبول", callback_data: `pay:ok:${r.id}` },
    { text: "❌ رفض", callback_data: `pay:no:${r.id}` },
  ]];
  /* الإيصال صورة: تُرسل صورةً ليراها المشرف في تليجرام بلا فتح رابط. */
  const res = r.receipt && url
    ? await tgSendPhoto(absolute(r.receipt, url), text, { buttons })
    : await tgSend(text, { buttons });
  return res.ok ? "sent" : "failed";
}

/* ------------------------------------------------------------------ */
/*  PATCH — المشرف يبتّ في الطلب                                       */
/* ------------------------------------------------------------------ */

export async function PATCH(req: Request) {
  await loadDB();
  const session = await getSession();
  const db = getDB();
  const me = db.users.find((u) => u.id === session?.uid);
  if (!session || session.role !== "admin" || !can(me, "payments")) {
    await recordEvent("unauthorized_admin", "/api/payments");
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? "");
  const action = String(body.action ?? "");
  const r = (db.payments ?? []).find((x) => x.id === id);
  if (!r) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

  if (action === "read") {
    r.readByAdmin = true;
    saveDB(db);
    await flushDB();
    return NextResponse.json({ ok: true, request: r });
  }

  if (r.status !== "pending") {
    return NextResponse.json({ error: "بُتَّ في هذا الطلب بالفعل" }, { status: 409 });
  }

  const verdict = decide(r, action, body, me?.name ?? "مشرف");
  if ("error" in verdict) return NextResponse.json({ error: verdict.error }, { status: 400 });

  saveDB(db);
  await flushDB();

  if (tgReady()) void tgSend(payVerdictText(r, me?.name ?? "مشرف"));
  await notifyStudent(db, r, verdict.status);

  return NextResponse.json({ ok: true, request: r });
}

/**
 * البتّ في الطلب — يُعدّل الطلب في مكانه ويُنشئ الكود والإشعار.
 * مستقلّ عن المسار ليستدعيه ويبهوك تليجرام أيضاً بلا تكرار المنطق.
 */
export function decide(
  r: PayRequest,
  action: string,
  body: { code?: unknown; reason?: unknown },
  by: string
): { ok: true; status: PayRequestStatus } | { error: string } {
  const db = getDB();

  if (action === "approve") {
    const cfg = db.content.payments;
    const manual = clip(body.code, 40).toUpperCase();
    const taken = new Set(db.codes.map((c) => c.code));
    if (manual && taken.has(manual)) return { error: "هذا الكود مستخدم بالفعل" };

    const code = manual || (cfg?.autoCode === false ? "" : newActivationCode(taken, db.content.codePrefix));
    if (!code) return { error: "اكتب كود التفعيل — التوليد التلقائي مطفأ" };

    const target = r.subjectId || "*";
    const plan = db.plans.find((p) => p.id === r.planId);
    const fresh: Code = {
      code,
      planId: r.planId,
      planName: r.planName,
      plan: plan?.kind === "term" ? "ترم" : "شهر",
      subjectId: target,
      subjectName: r.subjectName ?? targetName(target, db.subjects),
      status: "متاح",
      createdAt: now().slice(0, 10),
      payId: r.id,
    };
    db.codes = [fresh, ...db.codes];

    r.status = "approved";
    r.code = code;
    r.handledAt = now();
    r.handledBy = by;
    r.readByAdmin = true;

    pushNotification(db, {
      title: "تم قبول تحويلك ✅",
      body: `تم قبول تحويلك لخطة «${r.planName}». هذا كود التفعيل — فعّله بضغطة واحدة.`,
      userId: r.userId,
      link: "/student/subjects",
      code,
      codeSubjectId: target === "*" || /^T[12]$/.test(target) ? undefined : target,
    });
    return { ok: true, status: "approved" };
  }

  if (action === "reject") {
    const reason = clip(body.reason, MAX_NOTE);
    r.status = "rejected";
    r.reason = reason || "بيانات التحويل غير مطابقة";
    r.handledAt = now();
    r.handledBy = by;
    r.readByAdmin = true;

    pushNotification(db, {
      title: "لم يُقبل التحويل",
      body: r.reason,
      userId: r.userId,
      link: "/student/subjects",
    });
    return { ok: true, status: "rejected" };
  }

  return { error: "إجراء غير معروف" };
}

/** إشعار جهاز الطالب — تنبيه إضافي فوق إشعار المنصّة، وفشله لا يهمّ. */
async function notifyStudent(db: DB, r: PayRequest, status: PayRequestStatus) {
  const user = db.users.find((u) => u.id === r.userId);
  if (!user) return;
  await sendToUsers([user], {
    title: status === "approved" ? "تم قبول تحويلك ✅" : "لم يُقبل التحويل",
    body: status === "approved"
      ? `كود تفعيل «${r.planName}»: ${r.code}`
      : r.reason || "راجع بيانات التحويل ثم أعد الإرسال",
    url: "/student/subjects",
  }).catch(() => { /* الإشعار تنبيه لا شرط */ });
}

function pushNotification(db: DB, n: Omit<Notification, "id" | "createdAt">) {
  db.notifications = [
    { id: `N-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`, createdAt: now(), ...n },
    ...db.notifications,
  ].slice(0, 500);
}

/* ------------------------------------------------------------------ */
/*  DELETE — حذف طلب                                                   */
/* ------------------------------------------------------------------ */

export async function DELETE(req: Request) {
  await loadDB();
  const session = await getSession();
  const db = getDB();
  const me = db.users.find((u) => u.id === session?.uid);
  if (!session || session.role !== "admin" || !can(me, "payments")) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get("id") ?? "";
  db.payments = (db.payments ?? []).filter((p) => p.id !== id);
  saveDB(db);
  await flushDB();
  return NextResponse.json({ ok: true });
}
