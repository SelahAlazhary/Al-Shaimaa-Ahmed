"use client";

/**
 * قواعد أمان قاعدة البيانات.
 * ------------------------------------------------------------------
 * القاعدةُ الجديدة تُنشأ إمّا مفتوحةً للعالم (Test mode) وإمّا مقفلةً
 * تماماً (Locked mode). والأولى كارثة: أيُّ أحدٍ يعرف العنوان يقرأ بيانات
 * الطلاب ويكتب فيها. والثانية تمنعنا نحن أيضاً ما لم يكن معنا حسابُ خدمة.
 *
 * والصوابُ بينهما: **مقفلةٌ على الجميع، مفتوحةٌ لحساب الخدمة وحدَه.**
 * وهي قاعدةٌ سطران — لكنّ كتابتَها يدوياً في كونسول فايربيز موضعُ خطأ،
 * فتُعطى جاهزةً هنا: تُنسخ بضغطة أو تُنزَّل ملفّاً، ومعها رابطٌ مباشر إلى
 * موضعها في الكونسول.
 *
 * **ولماذا تكفي هذه القاعدة؟** حسابُ الخدمة يتجاوز القواعد أصلاً — فما
 * يكتبه الخادمُ يمرّ، وما يطلبه متصفّحٌ من الخارج يُردّ. فلا يبقى للقاعدة
 * إلّا أن تقول: لا أحدَ غير الخادم.
 */

import { useState } from "react";
import { Copy, Check, Download, ExternalLink, ShieldCheck } from "lucide-react";

const RULES = `{
  "rules": {
    ".read": false,
    ".write": false
  }
}`;

/** اسمُ نسخة القاعدة من عنوانها: newserver1-c9a15-default-rtdb */
function instanceOf(host: string): string {
  return host.replace(/^https?:\/\//, "").split(".")[0];
}

/** معرّفُ المشروع من اسم النسخة. */
function projectOf(host: string): string {
  return instanceOf(host).replace(/-default-rtdb$/, "");
}

/** رابطُ صفحة القواعد في كونسول فايربيز — للقاعدة بعينها لا للمشروع. */
export function rulesUrl(host: string): string {
  const inst = instanceOf(host);
  return `https://console.firebase.google.com/project/${projectOf(host)}/database/${inst}/rules`;
}

export function DbRulesCard({ hosts }: { hosts: { id: string; name: string; host: string }[] }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(RULES);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* المتصفّحُ قد يمنع الحافظة بلا إذن — والنصُّ ظاهرٌ ليُنسخ يدوياً. */
    }
  };

  const download = () => {
    /* ملفٌّ يُنزَّل بلا خادم: الـblob يُبنى في المتصفّح ويُلغى بعد لحظة. */
    const url = URL.createObjectURL(new Blob([RULES], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "database.rules.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="grid gap-4">
      <div>
        <p className="font-display mb-1 flex items-center gap-2 font-bold">
          <ShieldCheck className="size-4 text-primary" /> قواعد الأمان الموصى بها
        </p>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          مقفلةٌ على الجميع، ومفتوحةٌ لحساب الخدمة وحدَه — لأنّ حساب الخدمة يتجاوز القواعد
          أصلاً. فما يكتبه خادمُ المنصّة يمرّ، وما يطلبه متصفّحٌ من الخارج يُردّ.
        </p>
      </div>

      <pre dir="ltr" className="overflow-x-auto rounded-2xl border border-border bg-muted/40 p-4 font-mono text-[11px] leading-relaxed">
{RULES}
      </pre>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-white"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "نُسخت" : "انسخ القواعد"}
        </button>
        <button
          type="button"
          onClick={download}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-border px-4 py-2 text-xs font-bold"
        >
          <Download className="size-4" /> نزّل database.rules.json
        </button>
      </div>

      {hosts.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-bold text-muted-foreground">
            افتح صفحة القواعد لكلّ قاعدة والصقها في محرّر Rules ثمّ اضغط Publish:
          </p>
          <div className="flex flex-wrap gap-2">
            {hosts.map((n) => (
              <a
                key={n.id}
                href={rulesUrl(n.host)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-2xl border border-border px-3 py-2 text-[11px] font-bold transition hover:border-primary/50 hover:text-primary"
              >
                <ExternalLink className="size-3.5" /> {n.name}
              </a>
            ))}
          </div>
        </div>
      )}

      <p className="rounded-2xl bg-muted/50 p-3 text-[10px] leading-relaxed text-muted-foreground">
        <b className="text-foreground">انتبه:</b> بعد نشر هذه القواعد لن تعمل القاعدة إلّا
        بحساب خدمة. فأضف بريدَ الحساب ومفتاحَه للقاعدة هنا <b className="text-foreground">قبل</b>{" "}
        النشر، وإلّا سقطت من السلسلة حتى تُضاف.
      </p>
    </div>
  );
}
