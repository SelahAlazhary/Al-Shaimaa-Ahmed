"use client";

/**
 * استوديو الصورة — قصّ وإزالة خلفية، كلّه في المتصفّح.
 * ------------------------------------------------------------------
 * أداتان على لوحة canvas واحدة:
 *
 * • القصّ: تُرسم مساحة بالسحب فوق الصورة، وعند التطبيق تُعاد رسم
 *   الجزء المحدّد وحده في canvas جديد.
 *
 * • إزالة الخلفية: تعمل بمطابقة اللون — تضغط على لون الخلفية في الصورة،
 *   فتُشفَّف كل البكسلات القريبة منه ضمن مدى «التسامح». وحواف الشفافية
 *   تُنعَّم بتدرّج بدل قطع حادّ، فلا يظهر «سنّ المنشار» حول الحوافّ.
 *
 *   حدّ هذه الطريقة الذي يجب معرفته: تصلح لخلفية موحّدة اللون (شعار على
 *   أبيض، صورة على خلفية استوديو)، ولا تصلح لصورة بخلفية مزدحمة — فتلك
 *   تحتاج نموذج تعلّم آلي وليس مطابقة لون.
 *
 * الناتج PNG (يحفظ الشفافية) يُرفع عبر uploadImage.
 */
import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { Crop, Eraser, Loader2, RotateCcw, Check, X, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/primitives";

type Tool = "crop" | "bg";
type Rect = { x: number; y: number; w: number; h: number };

/** أقصى بُعد للصورة الناتجة — يمنع رفع صور ضخمة بلا داعٍ. */
const MAX_DIM = 1600;

export function ImageStudio({
  file,
  onCancel,
  onDone,
}: {
  /** الملف الأصلي كما اختاره الأدمن. */
  file: File;
  onCancel: () => void;
  /** يُستدعى بالصورة النهائية جاهزة للرفع. */
  onDone: (out: File, ratio: number) => Promise<void> | void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** الصورة الأصلية — إليها نعود عند «تراجع عن الكل». */
  const originalRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<Tool>("crop");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tolerance, setTolerance] = useState(28);
  const [feather, setFeather] = useState(12);
  const [sel, setSel] = useState<Rect | null>(null);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [picked, setPicked] = useState<[number, number, number] | null>(null);
  const [note, setNote] = useState<string | null>(null);

  /* ---------- تحميل الصورة إلى اللوحة ---------- */
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const orig = document.createElement("canvas");
      orig.width = w;
      orig.height = h;
      orig.getContext("2d")!.drawImage(img, 0, 0, w, h);
      originalRef.current = orig;

      const c = canvasRef.current;
      if (c) {
        c.width = w;
        c.height = h;
        c.getContext("2d")!.drawImage(orig, 0, 0);
      }
      setReady(true);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      setNote("تعذّر قراءة الصورة");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [file]);

  /** يحوّل إحداثيات المؤشّر إلى بكسلات داخل اللوحة. */
  const toCanvas = (e: RPointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const box = c.getBoundingClientRect();
    return {
      x: Math.round(((e.clientX - box.left) / box.width) * c.width),
      y: Math.round(((e.clientY - box.top) / box.height) * c.height),
    };
  };

  /* ---------- السحب: تحديد مساحة القصّ ---------- */
  const onDown = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (!ready) return;
    const p = toCanvas(e);

    if (tool === "bg") {
      // الضغط يلتقط لون الخلفية من الموضع المضغوط
      const ctx = canvasRef.current!.getContext("2d")!;
      const d = ctx.getImageData(p.x, p.y, 1, 1).data;
      setPicked([d[0], d[1], d[2]]);
      setNote(null);
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag(p);
    setSel({ x: p.x, y: p.y, w: 0, h: 0 });
  };

  const onMove = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (tool !== "crop" || !drag) return;
    const p = toCanvas(e);
    setSel({
      x: Math.min(drag.x, p.x),
      y: Math.min(drag.y, p.y),
      w: Math.abs(p.x - drag.x),
      h: Math.abs(p.y - drag.y),
    });
  };

  const onUp = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (tool !== "crop" || !drag) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDrag(null);
  };

  /* ---------- تطبيق القصّ ---------- */
  const applyCrop = () => {
    const c = canvasRef.current;
    if (!c || !sel || sel.w < 8 || sel.h < 8) {
      setNote("حدّد مساحة القصّ بالسحب على الصورة أولاً");
      return;
    }
    const cut = document.createElement("canvas");
    cut.width = sel.w;
    cut.height = sel.h;
    cut.getContext("2d")!.drawImage(c, sel.x, sel.y, sel.w, sel.h, 0, 0, sel.w, sel.h);

    c.width = sel.w;
    c.height = sel.h;
    c.getContext("2d")!.drawImage(cut, 0, 0);
    setSel(null);
    setNote(null);
  };

  /* ---------- إزالة الخلفية بمطابقة اللون ---------- */
  const removeBg = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const img = ctx.getImageData(0, 0, c.width, c.height);
    const d = img.data;

    // بلا لون مختار: نأخذ لون الركن الأعلى الأيسر — غالباً هو الخلفية
    const target = picked ?? [d[0], d[1], d[2]];
    const [tr, tg, tb] = target;

    // المدى بالنسبة إلى أقصى مسافة لونية ممكنة
    const near = (tolerance / 100) * 442;
    const soft = Math.max(1, (feather / 100) * 442);

    for (let i = 0; i < d.length; i += 4) {
      const dist = Math.sqrt((d[i] - tr) ** 2 + (d[i + 1] - tg) ** 2 + (d[i + 2] - tb) ** 2);
      if (dist <= near) {
        d[i + 3] = 0;
      } else if (dist <= near + soft) {
        // تدرّج على الحافّة بدل قطع حادّ — يمنع «سنّ المنشار»
        d[i + 3] = Math.round(d[i + 3] * ((dist - near) / soft));
      }
    }
    ctx.putImageData(img, 0, 0);
    setNote(null);
  };

  /* ---------- تراجع ---------- */
  const reset = () => {
    const c = canvasRef.current;
    const orig = originalRef.current;
    if (!c || !orig) return;
    c.width = orig.width;
    c.height = orig.height;
    c.getContext("2d")!.drawImage(orig, 0, 0);
    setSel(null);
    setPicked(null);
    setNote(null);
  };

  /* ---------- الحفظ ---------- */
  const save = async () => {
    const c = canvasRef.current;
    if (!c) return;
    setBusy(true);
    const blob: Blob | null = await new Promise((r) => c.toBlob(r, "image/png"));
    if (!blob) { setBusy(false); setNote("تعذّر تجهيز الصورة"); return; }
    const name = file.name.replace(/\.[^.]+$/, "") + ".png";
    await onDone(new File([blob], name, { type: "image/png" }), c.width / c.height);
    setBusy(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed left-1/2 top-1/2 z-[61] w-[min(94vw,52rem)] max-h-[92vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-bento">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-display font-bold">تحرير الصورة</h3>
          <button onClick={onCancel} aria-label="إغلاق" className="grid size-8 place-items-center rounded-full border border-border">
            <X className="size-4" />
          </button>
        </div>

        {/* الأدوات */}
        <div className="mb-3 flex flex-wrap gap-2">
          <ToolBtn on={tool === "crop"} onClick={() => { setTool("crop"); setNote(null); }}>
            <Crop className="size-3.5" /> قصّ
          </ToolBtn>
          <ToolBtn on={tool === "bg"} onClick={() => { setTool("bg"); setSel(null); setNote("اضغط على لون الخلفية داخل الصورة"); }}>
            <Eraser className="size-3.5" /> إزالة الخلفية
          </ToolBtn>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-bold transition hover:border-primary hover:text-primary"
          >
            <RotateCcw className="size-3.5" /> تراجع عن الكل
          </button>
        </div>

        {/* اللوحة */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-[repeating-conic-gradient(#0000_0%_25%,#8883_0%_50%)] bg-[length:18px_18px]">
          <canvas
            ref={canvasRef}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            style={{ touchAction: "none" }}
            className={`block h-auto max-h-[52vh] w-full object-contain ${tool === "crop" ? "cursor-crosshair" : "cursor-copy"}`}
          />
          {/* مستطيل التحديد */}
          {tool === "crop" && sel && sel.w > 2 && canvasRef.current && (
            <div
              className="pointer-events-none absolute border-2 border-dashed border-primary bg-primary/15"
              style={{
                left: `${(sel.x / canvasRef.current.width) * 100}%`,
                top: `${(sel.y / canvasRef.current.height) * 100}%`,
                width: `${(sel.w / canvasRef.current.width) * 100}%`,
                height: `${(sel.h / canvasRef.current.height) * 100}%`,
              }}
            />
          )}
        </div>

        {/* إعدادات الأداة */}
        {tool === "crop" ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="flex-1 text-[11px] text-muted-foreground">
              اسحب على الصورة لتحديد المساحة، ثم اضغط «تطبيق القصّ».
            </p>
            <button
              type="button"
              onClick={applyCrop}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-4 py-2 text-xs font-bold text-primary"
            >
              <Crop className="size-3.5" /> تطبيق القصّ
            </button>
          </div>
        ) : (
          <div className="mt-3 grid gap-3">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>اللون المختار:</span>
              <span
                className="inline-block size-5 rounded-md border border-border"
                style={{ background: picked ? `rgb(${picked.join(",")})` : "transparent" }}
              />
              <span>{picked ? `rgb(${picked.join(", ")})` : "اضغط على الخلفية داخل الصورة"}</span>
            </div>
            <Slider label="مدى التشابه" value={tolerance} min={2} max={80} onChange={setTolerance} />
            <Slider label="نعومة الحافّة" value={feather} min={0} max={40} onChange={setFeather} />
            <button
              type="button"
              onClick={removeBg}
              className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-4 py-2 text-xs font-bold text-primary"
            >
              <Wand2 className="size-3.5" /> طبّق الإزالة
            </button>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              تعمل بمطابقة اللون: تُشفَّف كل بكسل قريب من اللون المختار. مناسبة للخلفيات الموحّدة
              (شعار على أبيض مثلاً)، وليست بديلاً عن أدوات الذكاء الاصطناعي في الصور المزدحمة.
            </p>
          </div>
        )}

        {note && (
          <p className="mt-3 rounded-2xl bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-600">{note}</p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-full border border-border px-5 py-2.5 text-xs font-bold">
            إلغاء
          </button>
          <Button onClick={save} disabled={busy || !ready} className="px-6 py-2.5">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} استخدام الصورة
          </Button>
        </div>
      </div>
    </>
  );
}

function ToolBtn({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
        on ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}

function Slider({
  label, value, min, max, onChange,
}: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
        <span>{label}</span>
        <span className="font-bold text-foreground">{value.toLocaleString("ar-EG")}</span>
      </span>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[hsl(var(--primary))]"
      />
    </label>
  );
}
