/**
 * رفع متغيّرات البيئة إلى Vercel عبر الـCLI المسجَّل دخوله.
 * ------------------------------------------------------------------
 * يقرأ القيم من `.env.local` ولا يطبع أي قيمة — الطول فقط.
 * يحذف المتغيّر إن كان موجوداً ثم يضيفه، فيصلح أي قيمة قديمة خاطئة.
 *
 * التشغيل: node scripts/push-env.mjs
 */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const TARGETS = ["production", "preview", "development"];

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

/** قيم تُفرض دائماً — لا تأتي من الملف المحلي. */
const FORCED = { COOKIE_SECURE: "1" };

function readEnvLocal() {
  const out = {};
  for (const raw of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (val.length > 1 && ((val[0] === '"' && val.endsWith('"')) || (val[0] === "'" && val.endsWith("'")))) {
      val = val.slice(1, -1);
    }
    // فيرسل يخزّن المفتاح بأسطر حقيقية؛ lib/firebase يقبل الشكلين
    if (key === "FIREBASE_PRIVATE_KEY") val = val.replace(/\\n/g, "\n");
    out[key] = val;
  }
  return out;
}

const vercel = (args, input) =>
  spawnSync("npx", ["--yes", "vercel", ...args], {
    input,
    encoding: "utf8",
    shell: true,
  });

const env = { ...readEnvLocal(), ...FORCED };
const keys = [...REQUIRED, ...Object.keys(FORCED)];
let ok = 0;
const failed = [];

for (const key of keys) {
  const value = env[key];
  if (!value) {
    failed.push(`${key} (فارغ محلياً)`);
    continue;
  }
  for (const target of TARGETS) {
    // إزالة أي قيمة سابقة حتى لا يفشل الإضافة
    vercel(["env", "rm", key, target, "--yes"]);
    const r = vercel(["env", "add", key, target], value);
    const good = r.status === 0 && !/error/i.test(r.stderr || "");
    if (!good && target === "production") {
      failed.push(`${key}/${target}: ${(r.stderr || r.stdout || "").trim().split("\n").pop()}`);
    }
    if (good) ok++;
  }
  console.log(`  ✅ ${key} — ${value.length} حرفاً × ${TARGETS.length} بيئات`);
}

console.log(`\nتم ضبط ${ok} قيمة عبر ${keys.length} متغيّراً.`);
if (failed.length) {
  console.log("⚠️ مشاكل:");
  failed.forEach((f) => console.log("   -", f));
}
