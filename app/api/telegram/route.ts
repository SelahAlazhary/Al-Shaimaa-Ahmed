import { NextResponse } from "next/server";
import { loadDB, getDB, saveDB, flushDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { recordEvent } from "@/lib/security";
import { can } from "@/lib/perms";
import {
  tgConfig, tgGetMe, tgSetWebhook, tgDeleteWebhook, tgSend, newWebhookSecret, siteUrl, esc, cleanTgId,
} from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * ربط بوت تليجرام — للمشرف صاحب صلاحية «بوّابة الدفع».
 * ------------------------------------------------------------------
 * المطلوب من المشرفة خطوةٌ واحدة: لصق التوكن من BotFather. الباقي
 * يتمّ هنا تلقائياً — التحقّق من التوكن، توليد سرّ الويبهوك، وتسجيل
 * الويبهوك عند تليجرام. التوكن لا يعود للواجهة أبداً بعد حفظه.
 */

async function guard(path: string) {
  const session = await getSession();
  const me = getDB().users.find((u) => u.id === session?.uid);
  if (!session || session.role !== "admin" || !can(me, "payments")) {
    await recordEvent("unauthorized_admin", path);
    return null;
  }
  return me;
}

/** حالة الربط — بلا توكن إطلاقاً. */
export async function GET() {
  await loadDB();
  if (!(await guard("/api/telegram"))) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const t = getDB().integrations?.telegram;
  const c = tgConfig();
  return NextResponse.json({
    configured: Boolean(c.token),
    enabled: t?.enabled !== false,
    chatId: c.chatId || "",
    username: t?.username || "",
    allowedIds: c.allowedIds,
    webhookSetAt: t?.webhookSetAt || "",
    /* التوكن من متغيّر البيئة لا يُعدَّل من اللوحة — مصدره خارجها. */
    fromEnv: Boolean(process.env.TELEGRAM_BOT_TOKEN),
  });
}

export async function POST(req: Request) {
  await loadDB();
  const me = await guard("/api/telegram");
  if (!me) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "save");
  const db = getDB();
  db.integrations = db.integrations ?? {};
  const current = db.integrations.telegram ?? {};

  /* ---- اختبار: رسالة تجريبية إلى المحادثة المضبوطة ---- */
  if (action === "test") {
    const c = tgConfig();
    if (!c.token) return NextResponse.json({ error: "لم يُضبط توكن البوت" }, { status: 400 });
    if (!c.chatId) return NextResponse.json({ error: "لم يُضبط معرّف المحادثة" }, { status: 400 });
    const res = await tgSend(
      [
        "🔔 <b>رسالة اختبار</b>",
        "",
        "الربط يعمل — ستصلك طلبات الدفع هنا بزرَّي قبول ورفض.",
        `بواسطة: ${esc(me.name)}`,
      ].join("\n")
    );
    if (!res.ok) return NextResponse.json({ error: res.error || "تعذّر الإرسال" }, { status: 502 });
    return NextResponse.json({ ok: true });
  }

  /* ---- فصل ---- */
  if (action === "disconnect") {
    await tgDeleteWebhook();
    db.integrations.telegram = { enabled: false };
    saveDB(db);
    await flushDB();
    return NextResponse.json({ ok: true, configured: false });
  }

  /* ---- المعرّفات المسموح لها ---- */
  if (action === "ids") {
    const ids = Array.isArray(body.ids) ? body.ids : [];
    const clean: string[] = Array.from(new Set(ids.map((x: unknown) => cleanTgId(String(x))))).filter(Boolean) as string[];
    db.integrations.telegram = { ...current, allowedIds: clean };
    saveDB(db);
    await flushDB();
    return NextResponse.json({ ok: true, allowedIds: clean });
  }

  /* ---- تشغيل/إيقاف بلا مساس بالتوكن ---- */
  if (action === "toggle") {
    db.integrations.telegram = { ...current, enabled: Boolean(body.enabled) };
    saveDB(db);
    await flushDB();
    return NextResponse.json({ ok: true, enabled: Boolean(body.enabled) });
  }

  /* ---- حفظ التوكن ومعرّف المحادثة ثم تسجيل الويبهوك ---- */
  const token = String(body.token ?? "").trim() || current.token || "";
  const chatId = cleanTgId(String(body.chatId ?? "")) || current.chatId || "";
  if (!token) return NextResponse.json({ error: "الصق توكن البوت من BotFather" }, { status: 400 });

  const who = await tgGetMe(token);
  if (!who.ok) {
    return NextResponse.json({ error: who.error || "التوكن غير صالح" }, { status: 400 });
  }

  const secret = current.webhookSecret || newWebhookSecret();
  const base = siteUrl(req);
  let webhookSetAt = current.webhookSetAt;
  let warn: string | undefined;

  if (/^https:\/\//i.test(base)) {
    const hook = await tgSetWebhook(`${base}/api/telegram/webhook`, secret, token);
    if (hook.ok) webhookSetAt = new Date().toISOString();
    else warn = hook.error || "تعذّر تسجيل الويبهوك";
  } else {
    /* تليجرام لا يقبل ويبهوك إلا على HTTPS — محلياً يبقى الإرسال فقط. */
    warn = "الويبهوك يحتاج رابطاً بـHTTPS — أزرار القبول والرفض ستعمل بعد الرفع على الاستضافة";
  }

  db.integrations.telegram = {
    ...current,
    token,
    chatId,
    webhookSecret: secret,
    webhookSetAt,
    username: who.result?.username,
    enabled: true,
  };
  saveDB(db);
  await flushDB();

  return NextResponse.json({
    ok: true,
    configured: true,
    enabled: true,
    chatId,
    username: who.result?.username ?? "",
    webhookSetAt: webhookSetAt ?? "",
    warn,
  });
}
