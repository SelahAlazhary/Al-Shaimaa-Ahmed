import { NextResponse } from "next/server";
import { loadDB, getDB, saveDB, flushDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { recordEvent } from "@/lib/security";
import { can } from "@/lib/perms";
import { fbPingNode, fbGetFrom, fbSetTo } from "@/lib/firebase";
import { envNode, orderNodes, nodeHealth, fillPercent, isFull } from "@/lib/db-nodes";
import type { DbNode } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * إدارة سلسلة قواعد البيانات — للمالكة وحدها.
 * ------------------------------------------------------------------
 * هذا أخطر ما في اللوحة: خطأٌ هنا يفقد بياناتِ المنصّة كلَّها. ولذلك:
 *
 *   • **للمالكة وحدها** لا لكل من يملك صلاحية «النسخ الاحتياطي» —
 *     الاعتمادات هنا تفتح القاعدةَ كلَّها لا نسخةً منها.
 *   • **لا تُضاف قاعدة قبل أن تُختبر.** إضافةُ عنوانٍ لا يردّ تعني
 *     سلسلةً تنتظر قاعدةً ميّتة في كل عطل.
 *   • **الاعتمادات لا تعود للواجهة أبداً** — تُعرض حالتُها لا قيمتُها.
 *   • **القاعدةُ الجديدة تُملأ فور إضافتها** بنسخةٍ من الحالي، فلا تكون
 *     فرعاً فارغاً يُسلَّم إليه الموقعُ عند أوّل عطل.
 */

async function owner(path: string) {
  const session = await getSession();
  const me = getDB().users.find((u) => u.id === session?.uid);
  if (!session || session.role !== "admin" || !me?.owner) {
    await recordEvent("unauthorized_admin", path);
    return null;
  }
  return me;
}

/** ما يُعرض عن قاعدة — بلا اعتماد. */
function publicNode(n: DbNode) {
  const h = nodeHealth(n.url);
  return {
    id: n.id,
    name: n.name,
    /* العنوان يُقصّ: يكفي للتمييز ولا يكفي لاستعماله. */
    host: n.url.replace(/^https?:\/\//, "").split(".")[0],
    role: n.role,
    enabled: n.enabled,
    capacityMB: n.capacityMB ?? 0,
    hasCredential: Boolean(n.secret || (n.clientEmail && n.privateKey)),
    ok: h.ok,
    error: h.error,
    bytes: h.bytes ?? 0,
    fill: fillPercent(n),
    full: isFull(n),
    fromEnv: n.id === "env",
  };
}

export async function GET() {
  await loadDB();
  if (!(await owner("/api/databases"))) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const stored = getDB().integrations?.databases ?? [];
  return NextResponse.json({
    nodes: orderNodes(stored).map(publicNode),
    envConfigured: Boolean(envNode()),
  });
}

export async function POST(req: Request) {
  await loadDB();
  const me = await owner("/api/databases");
  if (!me) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "add");
  const db = getDB();
  db.integrations = db.integrations ?? {};
  const list = [...(db.integrations.databases ?? [])];

  /* ---- إضافة قاعدة ---- */
  if (action === "add") {
    const url = String(body.url ?? "").trim().replace(/\/$/, "");
    if (!/^https:\/\/[\w.-]+\.(firebaseio\.com|firebasedatabase\.app)$/i.test(url)) {
      return NextResponse.json({ error: "عنوان قاعدة غير صالح" }, { status: 400 });
    }
    if (list.some((n) => n.url.toLowerCase() === url.toLowerCase())) {
      return NextResponse.json({ error: "هذه القاعدة مضافة بالفعل" }, { status: 409 });
    }

    const node: DbNode = {
      id: `DB-${Date.now().toString(36)}`,
      name: String(body.name ?? "").trim().slice(0, 60) || "قاعدة فرعية",
      url,
      secret: String(body.secret ?? "").trim() || undefined,
      clientEmail: String(body.clientEmail ?? "").trim() || undefined,
      privateKey: String(body.privateKey ?? "").replace(/\\n/g, "\n").trim() || undefined,
      role: body.role === "primary" ? "primary" : "branch",
      enabled: true,
      order: list.length,
      capacityMB: Math.max(0, Number(body.capacityMB) || 0),
      addedAt: new Date().toISOString(),
    };

    /* تُختبر قبل أن تُضاف — سلسلةٌ فيها قاعدةٌ ميّتة تنتظر في كل عطل. */
    const cfg = { databaseURL: node.url, secret: node.secret, clientEmail: node.clientEmail, privateKey: node.privateKey };
    const ping = await fbPingNode(cfg);
    if (!ping.ok) {
      return NextResponse.json({ error: `تعذّر الوصول إليها: ${ping.error ?? ""}` }, { status: 400 });
    }
    try {
      await fbSetTo(cfg, "platform/_probe", { at: new Date().toISOString() });
    } catch (e) {
      return NextResponse.json({ error: `تقبل القراءة ولا تقبل الكتابة: ${(e as Error).message}` }, { status: 400 });
    }

    /* من كان رئيسياً يصير فرعاً — رئيسيةٌ واحدة لا أكثر. */
    if (node.role === "primary") for (const n of list) n.role = "branch";

    db.integrations.databases = [...list, node];
    saveDB(db);
    await flushDB();   // الحفظ نفسُه يملأ القاعدة الجديدة بنسخةٍ كاملة

    return NextResponse.json({ ok: true, nodes: orderNodes(db.integrations.databases).map(publicNode) });
  }

  /* ---- حذف ---- */
  if (action === "remove") {
    const id = String(body.id ?? "");
    if (id === "env") {
      return NextResponse.json({ error: "قاعدة الاستضافة تُغيَّر من متغيّرات البيئة لا من هنا" }, { status: 400 });
    }
    db.integrations.databases = list.filter((n) => n.id !== id);
    saveDB(db);
    await flushDB();
    return NextResponse.json({ ok: true, nodes: orderNodes(db.integrations.databases).map(publicNode) });
  }

  /* ---- ترقية إلى رئيسية ---- */
  if (action === "promote") {
    const id = String(body.id ?? "");
    const hit = list.find((n) => n.id === id);
    if (!hit) return NextResponse.json({ error: "القاعدة غير موجودة" }, { status: 404 });
    for (const n of list) n.role = "branch";
    hit.role = "primary";
    db.integrations.databases = list;
    saveDB(db);
    await flushDB();
    return NextResponse.json({ ok: true, nodes: orderNodes(list).map(publicNode) });
  }

  /* ---- تشغيل/إيقاف وسعة ---- */
  if (action === "patch") {
    const id = String(body.id ?? "");
    const hit = list.find((n) => n.id === id);
    if (!hit) return NextResponse.json({ error: "القاعدة غير موجودة" }, { status: 404 });
    if (typeof body.enabled === "boolean") hit.enabled = body.enabled;
    if (body.capacityMB !== undefined) hit.capacityMB = Math.max(0, Number(body.capacityMB) || 0);
    if (body.name) hit.name = String(body.name).trim().slice(0, 60);
    db.integrations.databases = list;
    saveDB(db);
    await flushDB();
    return NextResponse.json({ ok: true, nodes: orderNodes(list).map(publicNode) });
  }

  /* ---- فحص الكلّ ---- */
  if (action === "check") {
    const nodes = orderNodes(list);
    for (const n of nodes) {
      const cfg = { databaseURL: n.url, secret: n.secret, clientEmail: n.clientEmail, privateKey: n.privateKey };
      try {
        /* القراءةُ الحقيقية تقيس الحجم أيضاً — والحجمُ هو ما يُنقل. */
        await fbGetFrom(cfg, "platform");
      } catch {
        /* الحالةُ تُسجَّل داخل fbGetFrom عبر المستدعي؛ هنا نتجاهل */
      }
    }
    return NextResponse.json({ ok: true, nodes: nodes.map(publicNode) });
  }

  return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
}
