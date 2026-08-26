/**
 * رفع متغيّرات البيئة إلى مشروع Vercel ثم إعادة النشر.
 * ------------------------------------------------------------------
 * يقرأ القيم من `.env.local` (لا تُطبَع أبداً) ورمز الوصول من `.vercel-token`،
 * ثم ينشئ/يحدّث كل متغيّر على البيئات الثلاث ويطلق نشراً جديداً.
 *
 * التشغيل:  node scripts/set-vercel-env.mjs
 *
 * الملفّان `.env.local` و`.vercel-token` محجوبان في .gitignore.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PROJECT = process.env.VERCEL_PROJECT || "al-shaimaa-ahmed";
const TEAM_SLUG = process.env.VERCEL_TEAM || "md-90ab";

/** المتغيّرات المطلوبة في الإنتاج. الفارغ منها يُتجاهل بتحذير. */
const REQUIRED = [
  "AUTH_SECRET",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "FIREBASE_DATABASE_URL",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
  "CRON_SECRET",
];

/** قيم تُضبط دائماً بغضّ النظر عن الملف المحلي. */
const FORCED = { COOKIE_SECURE: "1" };

function readToken() {
  const p = path.join(ROOT, ".vercel-token");
  if (process.env.VERCEL_TOKEN?.trim()) return process.env.VERCEL_TOKEN.trim();
  if (!fs.existsSync(p)) {
    console.error(
      "❌ لا يوجد رمز وصول.\n" +
        "   أنشئ رمزاً من https://vercel.com/account/settings/tokens\n" +
        `   ثم احفظه في: ${p}`
    );
    process.exit(1);
  }
  return fs.readFileSync(p, "utf8").trim();
}

/** قارئ .env بسيط يحترم الاقتباس ويتجاهل التعليقات. */
function readEnvLocal() {
  const p = path.join(ROOT, ".env.local");
  if (!fs.existsSync(p)) {
    console.error(`❌ ${p} غير موجود.`);
    process.exit(1);
  }
  const out = {};
  for (const raw of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"') && val.length > 1) ||
      (val.startsWith("'") && val.endsWith("'") && val.length > 1)
    ) {
      val = val.slice(1, -1);
    }
    // المفتاح الخاص يُخزَّن بأسطر حقيقية على فيرسل
    if (key === "FIREBASE_PRIVATE_KEY") val = val.replace(/\\n/g, "\n");
    out[key] = val;
  }
  return out;
}

const TOKEN = readToken();
const api = async (url, init = {}) => {
  const res = await fetch(`https://api.vercel.com${url}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  return { ok: res.ok, status: res.status, json };
};

(async () => {
  // 1) التحقّق من الرمز
  const me = await api("/v2/user");
  if (!me.ok) {
    console.error("❌ الرمز غير صالح:", me.status, me.json?.error?.message ?? "");
    process.exit(1);
  }
  console.log("✅ الحساب:", me.json.user?.username ?? me.json.user?.email);

  // 2) تحديد الفريق
  let teamId = null;
  const teams = await api("/v2/teams");
  if (teams.ok) {
    const t = (teams.json.teams || []).find((x) => x.slug === TEAM_SLUG);
    if (t) {
      teamId = t.id;
      console.log("✅ الفريق:", t.slug);
    }
  }
  const q = teamId ? `?teamId=${teamId}` : "";

  // 3) المشروع
  const proj = await api(`/v9/projects/${PROJECT}${q}`);
  if (!proj.ok) {
    console.error(`❌ لم يُعثر على المشروع «${PROJECT}»:`, proj.status, proj.json?.error?.message ?? "");
    process.exit(1);
  }
  console.log("✅ المشروع:", proj.json.name);

  // 4) رفع المتغيّرات
  const env = { ...readEnvLocal(), ...FORCED };
  const upsert = teamId ? `?teamId=${teamId}&upsert=true` : "?upsert=true";
  let ok = 0;
  const missing = [];

  for (const key of [...REQUIRED, ...Object.keys(FORCED)]) {
    const value = env[key];
    if (!value) {
      missing.push(key);
      continue;
    }
    const r = await api(`/v10/projects/${proj.json.id}/env${upsert}`, {
      method: "POST",
      body: JSON.stringify({
        key,
        value,
        type: "encrypted",
        target: ["production", "preview", "development"],
      }),
    });
    // القيمة نفسها لا تُطبع أبداً — الطول فقط
    console.log(r.ok ? `  ✅ ${key} (${value.length} حرفاً)` : `  ❌ ${key}: ${r.json?.error?.message ?? r.status}`);
    if (r.ok) ok++;
  }

  if (missing.length) console.log("⚠️ ناقصة في .env.local:", missing.join(", "));
  console.log(`\nتم ضبط ${ok} متغيّراً.`);

  // 5) إعادة النشر من آخر كوميت على main
  const deploy = await api(`/v13/deployments${q}`, {
    method: "POST",
    body: JSON.stringify({
      name: proj.json.name,
      project: proj.json.id,
      target: "production",
      gitSource: {
        type: "github",
        repo: "SelahAlazhary/Al-Shaimaa-Ahmed",
        ref: "main",
        org: "SelahAlazhary",
      },
    }),
  });
  if (deploy.ok) {
    console.log("🚀 بدأ نشر جديد:", `https://${deploy.json.url}`);
  } else {
    console.log("⚠️ تعذّر إطلاق النشر تلقائياً:", deploy.json?.error?.message ?? deploy.status);
    console.log("   اضغط Redeploy من لوحة فيرسل — المتغيّرات مضبوطة بالفعل.");
  }
})();
