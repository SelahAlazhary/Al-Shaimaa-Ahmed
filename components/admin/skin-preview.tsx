"use client";

/**
 * معاينات المظهر — مصغّرات SVG لبوابة الطالب.
 * ------------------------------------------------------------------
 * كل معاينة رسم SVG واحد بـviewBox ثابت ونسبة أبعاد ثابتة، فلا يتمدّد
 * ولا تتشوّه زواياه، ويُرسم بألوان الثيم نفسها وزخرفته — فما يراه
 * الأدمن هو ما سيراه الطالب، لا مربّعات ألوان مجرّدة.
 */
import { useUid } from "@/components/brand/use-uid";
import type { StudentSkin, StudentLayout, OrnamentId } from "@/lib/skins";
import type { HomeLayout } from "@/lib/home-layouts";
import type { MobileLayout } from "@/lib/skins";
import { shapeStyle, type StudentDesign } from "@/lib/designs";
import { EdgeArtLayer } from "@/components/brand/edge-art";
import type { SideNavStyle, DockStyle } from "@/lib/nav-styles";
import type { FrameShape } from "@/lib/frame-shapes";
import type { TileStyle, TileColors } from "@/lib/tile-styles";
import type { ToolbarStyle } from "@/lib/toolbar-styles";
import type { PlansStyle } from "@/lib/plans-styles";

const W = 160;
const H = 108;

const hsl = (v: string, a = 1) => (a === 1 ? `hsl(${v})` : `hsl(${v} / ${a})`);

/** بلاطة زخرفة مصغّرة — نسخة مبسّطة تكفي في هذا المقاس. */
function miniTile(id: OrnamentId, t: number, color: string) {
  const m = t / 2;
  const common = { fill: "none", stroke: color, strokeWidth: t * 0.07 } as const;
  switch (id) {
    case "kufi":
      return <path d={`M${t * 0.2} ${t * 0.8}V${t * 0.2}H${m}V${m}H${t * 0.8}`} {...common} />;
    case "shamsa":
      return <circle cx={m} cy={m} r={t * 0.28} {...common} />;
    case "arabesque":
      return <path d={`M0 ${m} Q${t * 0.25} 0 ${m} ${m} T${t} ${m}`} {...common} />;
    case "waves":
      return <path d={`M0 ${m} Q${t * 0.25} ${t * 0.25} ${m} ${m} T${t} ${m}`} {...common} />;
    case "grid":
      return <path d={`M0 0H${t}M0 0V${t}`} {...common} strokeWidth={t * 0.05} />;
    case "stars":
      return <path d={`M${m} ${t * 0.15} L${t * 0.85} ${m} L${m} ${t * 0.85} L${t * 0.15} ${m}Z`} {...common} />;
    case "hexes":
      return <path d={`M${m} ${t * 0.12} L${t * 0.86} ${t * 0.32} V${t * 0.68} L${m} ${t * 0.88} L${t * 0.14} ${t * 0.68} V${t * 0.32}Z`} {...common} />;
    case "rays":
      return <path d={`M0 ${t} L${t} 0`} {...common} />;
    case "knots":
      return <path d={`M0 ${m} q${t * 0.25} -${t * 0.25} ${m} 0 t${m} 0`} {...common} />;
    case "dots":
      return <circle cx={m} cy={m} r={t * 0.12} fill={color} />;
    default:
      return null;
  }
}

/** خلفية المعاينة: لون الصفحة + الزخرفة. */
function Backdrop({ skin, uid }: { skin: StudentSkin; uid: string }) {
  const v = skin.vars;
  const t = 22;
  return (
    <>
      <defs>
        <pattern id={`${uid}-p`} width={t} height={t} patternUnits="userSpaceOnUse">
          {miniTile(skin.ornament, t, hsl(v.primary, 0.16))}
        </pattern>
      </defs>
      <rect width={W} height={H} fill={hsl(v.background)} />
      {skin.ornament !== "none" && <rect width={W} height={H} fill={`url(#${uid}-p)`} />}
    </>
  );
}

/** بطاقة داخل المعاينة — شكلها يتبع أسلوب بطاقات الثيم. */
function MiniCard({
  skin, x, y, w, h,
}: { skin: StudentSkin; x: number; y: number; w: number; h: number }) {
  const v = skin.vars;
  const cut = Math.min(5, h * 0.25);

  if (skin.card === "plaque") {
    // لوح بأركان مقصوصة
    const d = `M${x + cut} ${y} H${x + w - cut} L${x + w} ${y + cut} V${y + h - cut} L${x + w - cut} ${y + h} H${x + cut} L${x} ${y + h - cut} V${y + cut}Z`;
    return (
      <>
        <path d={d} fill={hsl(v.card)} />
        <path d={d} fill="none" stroke={hsl(v.gold, 0.7)} strokeWidth={0.9} />
      </>
    );
  }
  if (skin.card === "outline") {
    return <rect x={x} y={y} width={w} height={h} rx={3} fill="none" stroke={hsl(v.border)} strokeWidth={1.1} />;
  }
  if (skin.card === "glass") {
    return (
      <>
        <rect x={x} y={y} width={w} height={h} rx={5} fill={hsl(v.card, 0.65)} />
        <rect x={x} y={y} width={w} height={h} rx={5} fill="none" stroke={hsl(v.foreground, 0.12)} strokeWidth={0.8} />
      </>
    );
  }
  if (skin.card === "elevated") {
    return (
      <>
        <rect x={x + 0.8} y={y + 1.6} width={w} height={h} rx={6} fill={hsl(v.foreground, 0.1)} />
        <rect x={x} y={y} width={w} height={h} rx={6} fill={hsl(v.card)} />
      </>
    );
  }
  // soft
  return <rect x={x} y={y} width={w} height={h} rx={6} fill={hsl(v.card)} />;
}

/* ------------------------------------------------------------------ */
/*  معاينة الثيم                                                       */
/* ------------------------------------------------------------------ */

export function SkinPreview({ skin }: { skin: StudentSkin }) {
  const uid = useUid("sp");
  const v = skin.vars;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-2xl" style={{ aspectRatio: `${W} / ${H}` }}>
      <Backdrop skin={skin} uid={uid} />

      {/* شريط جانبي */}
      <rect x={W - 30} y={0} width={30} height={H} fill={hsl(v.primary)} />
      <rect x={W - 25} y={10} width={20} height={4} rx={2} fill={hsl(v.gold, 0.9)} />
      {[22, 32, 42, 52].map((y) => (
        <rect key={y} x={W - 25} y={y} width={20} height={3} rx={1.5} fill="#fff" opacity={y === 22 ? 0.85 : 0.35} />
      ))}

      {/* لوح ترحيب */}
      <rect x={8} y={9} width={W - 46} height={26} rx={5} fill={hsl(v.primary)} />
      <rect x={13} y={15} width={38} height={4} rx={2} fill={hsl(v.goldLight, 0.9)} />
      <rect x={13} y={23} width={24} height={3} rx={1.5} fill="#fff" opacity={0.5} />
      <circle cx={W - 55} cy={22} r={8} fill="none" stroke="#fff" strokeOpacity={0.25} strokeWidth={2.5} />
      <circle
        cx={W - 55} cy={22} r={8}
        fill="none" stroke={hsl(v.gold)} strokeWidth={2.5} strokeLinecap="round"
        strokeDasharray={`${2 * Math.PI * 8 * 0.65} ${2 * Math.PI * 8}`}
        transform={`rotate(-90 ${W - 55} 22)`}
      />

      {/* مؤشّرات */}
      {[0, 1, 2].map((i) => (
        <MiniCard key={i} skin={skin} x={8 + i * 36} y={40} w={32} h={20} />
      ))}

      {/* كورسات */}
      <MiniCard skin={skin} x={8} y={66} w={50} h={32} />
      <MiniCard skin={skin} x={62} y={66} w={50} h={32} />
      <rect x={12} y={70} width={20} height={14} rx={2} fill={hsl(v.accent, 0.55)} />
      <rect x={66} y={70} width={20} height={14} rx={2} fill={hsl(v.accent, 0.55)} />
      <rect x={12} y={88} width={40} height={3} rx={1.5} fill={hsl(v.foreground, 0.35)} />
      <rect x={66} y={88} width={40} height={3} rx={1.5} fill={hsl(v.foreground, 0.35)} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة التخطيط                                                     */
/* ------------------------------------------------------------------ */

export function LayoutPreview({ layout, skin }: { layout: StudentLayout; skin: StudentSkin }) {
  const uid = useUid("lp");
  const v = skin.vars;
  const L = 8;                 // الهامش الأيسر
  const R = W - 30;            // بداية الشريط الجانبي
  const inner = R - L - 6;     // العرض المتاح

  /* --- الترويسة --- */
  const headH =
    layout.header === "banner" ? 28 :
    layout.header === "compact" ? 18 :
    layout.header === "stacked" ? 22 :
    layout.header === "split" ? 26 : 10;

  const headY = 8;
  const statsY = headY + headH + 5;

  /* --- المؤشّرات --- */
  const railMode = layout.stats === "rail";
  const statsH = layout.stats === "inline" ? 12 : layout.stats === "grid" ? 26 : 18;
  const contentX = railMode ? L + 26 : L;
  const contentW = railMode ? inner - 26 : inner;
  const cardsY = railMode ? statsY : statsY + (layout.statsInHeader ? 0 : statsH + 6);

  /* --- الكورسات --- */
  const cols = layout.cards === "grid3" ? 3 : layout.cards === "list" ? 1 : 2;
  const gap = 4;
  const cardW = (contentW - gap * (cols - 1)) / cols;
  const cardH = layout.cards === "list" ? 12 : layout.cards === "compact" ? 16 : 22;
  const rows = layout.cards === "list" ? 3 : 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-2xl" style={{ aspectRatio: `${W} / ${H}` }}>
      <Backdrop skin={skin} uid={uid} />

      {/* الشريط الجانبي ثابت في كل التخطيطات */}
      <rect x={R + 6} y={0} width={W - R - 6} height={H} fill={hsl(v.primary)} />
      {[10, 20, 28, 36].map((y) => (
        <rect key={y} x={R + 11} y={y} width={14} height={3} rx={1.5} fill="#fff" opacity={y === 10 ? 0.9 : 0.35} />
      ))}

      {/* الترويسة */}
      {layout.header === "minimal" ? (
        <>
          <rect x={L} y={headY} width={44} height={5} rx={2.5} fill={hsl(v.foreground, 0.7)} />
          <rect x={L} y={headY + 8} width={26} height={3} rx={1.5} fill={hsl(v.accent, 0.8)} />
        </>
      ) : layout.header === "split" ? (
        <>
          <rect x={L} y={headY} width={inner * 0.58} height={headH} rx={5} fill={hsl(v.primary)} />
          <rect x={L + inner * 0.62} y={headY} width={inner * 0.38} height={headH} rx={5} fill={hsl(v.card)} />
          <circle
            cx={L + inner * 0.81} cy={headY + headH / 2} r={7}
            fill="none" stroke={hsl(v.accent)} strokeWidth={2.5} strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 7 * 0.7} ${2 * Math.PI * 7}`}
            transform={`rotate(-90 ${L + inner * 0.81} ${headY + headH / 2})`}
          />
        </>
      ) : (
        <>
          <rect x={L} y={headY} width={inner} height={headH} rx={5} fill={hsl(v.primary)} />
          <rect x={L + 5} y={headY + 5} width={34} height={4} rx={2} fill={hsl(v.goldLight, 0.9)} />
          {headH > 20 && <rect x={L + 5} y={headY + 13} width={22} height={3} rx={1.5} fill="#fff" opacity={0.5} />}
          {/* المؤشّرات داخل اللوح */}
          {layout.statsInHeader &&
            [0, 1, 2].map((i) => (
              <rect
                key={i}
                x={L + inner - 8 - (3 - i) * 15}
                y={headY + headH - 12}
                width={13}
                height={8}
                rx={2}
                fill="#fff"
                opacity={0.22}
              />
            ))}
        </>
      )}

      {/* المؤشّرات خارج اللوح */}
      {!layout.statsInHeader && !railMode && (
        <>
          {layout.stats === "inline" ? (
            <MiniCard skin={skin} x={L} y={statsY} w={inner} h={statsH} />
          ) : (
            [0, 1, 2].map((i) => {
              const w = (inner - 8) / 3;
              return <MiniCard key={i} skin={skin} x={L + i * (w + 4)} y={statsY} w={w} h={statsH} />;
            })
          )}
        </>
      )}

      {/* شريط المؤشّرات الرأسي */}
      {railMode && [0, 1, 2].map((i) => (
        <MiniCard key={i} skin={skin} x={L} y={statsY + i * 20} w={22} h={16} />
      ))}

      {/* الكورسات */}
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const x = contentX + c * (cardW + gap);
          const y = cardsY + r * (cardH + gap);
          if (y + cardH > H - 4) return null;
          return (
            <g key={`${r}-${c}`}>
              <MiniCard skin={skin} x={x} y={y} w={cardW} h={cardH} />
              <rect x={x + 3} y={y + 3} width={Math.min(14, cardW * 0.3)} height={cardH - 6} rx={2} fill={hsl(v.accent, 0.5)} />
              <rect x={x + Math.min(14, cardW * 0.3) + 6} y={y + 5} width={Math.max(6, cardW * 0.4)} height={3} rx={1.5} fill={hsl(v.foreground, 0.35)} />
            </g>
          );
        })
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة تخطيط الواجهة الرئيسية                                      */
/* ------------------------------------------------------------------ */

/** ألوان المعاينة من ثيم المنصّة نفسه لا من مظهر الطالب. */
const SITE = {
  bg: "38 42% 96%",
  card: "40 56% 99%",
  fg: "224 44% 13%",
  primary: "226 60% 34%",
  accent: "38 76% 50%",
  border: "36 24% 85%",
};

/** لون تمثيلي لكل قسم — يجعل الترتيب مقروءاً من المصغّرة. */
const SECTION_TONE: Record<string, string> = {
  freeLive: "356 62% 52%",
  stages: "199 70% 42%",
  features: "226 60% 44%",
  plans: "38 76% 50%",
  testimonials: "266 50% 52%",
  faq: "162 44% 38%",
};

export function HomeLayoutPreview({ layout }: { layout: HomeLayout }) {
  const uid = useUid("hp");
  const pad = layout.width === "narrow" ? 26 : layout.width === "wide" ? 6 : 14;
  const gap = layout.density === "tight" ? 2 : layout.density === "airy" ? 6 : 4;
  const innerW = W - pad * 2;

  /* --- الهيرو --- */
  const heroH = layout.hero === "compact" ? 16 : layout.hero === "stacked" ? 30 : 26;
  const heroY = 10;

  /* --- الأقسام --- */
  let y = heroY + heroH + gap + 3;
  const bars: { id: string; y: number; h: number }[] = [];
  for (const id of layout.order) {
    const h = 7;
    if (y + h > H - 3) break;
    bars.push({ id, y, h });
    y += h + gap;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-2xl" style={{ aspectRatio: `${W} / ${H}` }}>
      <rect width={W} height={H} fill={hsl(SITE.bg)} />

      {/* شريط علوي */}
      <rect x={pad} y={3} width={innerW} height={5} rx={2.5} fill={hsl(SITE.card)} />
      <rect x={pad + 2} y={4.6} width={12} height={2} rx={1} fill={hsl(SITE.primary, 0.8)} />
      <rect x={pad + innerW - 14} y={4.4} width={12} height={2.4} rx={1.2} fill={hsl(SITE.accent)} />

      {/* الهيرو بأشكاله */}
      {layout.hero === "compact" ? (
        <>
          <rect x={pad + innerW * 0.2} y={heroY + 3} width={innerW * 0.6} height={4} rx={2} fill={hsl(SITE.fg, 0.75)} />
          <rect x={pad + innerW * 0.3} y={heroY + 10} width={innerW * 0.4} height={3} rx={1.5} fill={hsl(SITE.accent)} />
        </>
      ) : layout.hero === "centered" ? (
        <>
          <rect x={pad + innerW * 0.2} y={heroY} width={innerW * 0.6} height={4} rx={2} fill={hsl(SITE.fg, 0.75)} />
          <rect x={pad + innerW * 0.32} y={heroY + 7} width={innerW * 0.36} height={3} rx={1.5} fill={hsl(SITE.accent)} />
          <rect x={pad + innerW * 0.3} y={heroY + 13} width={innerW * 0.4} height={heroH - 14} rx={3} fill={hsl(SITE.primary, 0.75)} />
        </>
      ) : layout.hero === "stacked" ? (
        <>
          <rect x={pad + innerW * 0.25} y={heroY} width={innerW * 0.5} height={16} rx={3} fill={hsl(SITE.primary, 0.75)} />
          <rect x={pad + innerW * 0.15} y={heroY + 19} width={innerW * 0.7} height={4} rx={2} fill={hsl(SITE.fg, 0.7)} />
          <rect x={pad + innerW * 0.3} y={heroY + 25} width={innerW * 0.4} height={3} rx={1.5} fill={hsl(SITE.accent)} />
        </>
      ) : (
        // منقسم أو معكوس — الصورة على أحد الجانبين
        <>
          <rect
            x={layout.hero === "reversed" ? pad : pad + innerW * 0.55}
            y={heroY}
            width={innerW * 0.45}
            height={heroH}
            rx={4}
            fill={hsl(SITE.primary, 0.75)}
          />
          <rect
            x={layout.hero === "reversed" ? pad + innerW * 0.5 : pad}
            y={heroY + 3}
            width={innerW * 0.4}
            height={4}
            rx={2}
            fill={hsl(SITE.fg, 0.75)}
          />
          <rect
            x={layout.hero === "reversed" ? pad + innerW * 0.5 : pad}
            y={heroY + 10}
            width={innerW * 0.28}
            height={3}
            rx={1.5}
            fill={hsl(SITE.accent)}
          />
          <rect
            x={layout.hero === "reversed" ? pad + innerW * 0.5 : pad}
            y={heroY + 17}
            width={innerW * 0.22}
            height={5}
            rx={2.5}
            fill={hsl(SITE.primary)}
          />
        </>
      )}

      {/* الأقسام بترتيبها — لكل قسم لونه فيُقرأ الترتيب من المصغّرة */}
      {bars.map((b, i) => (
        <g key={b.id}>
          {i > 0 && layout.divider !== "none" && (
            layout.divider === "wave" ? (
              <path
                d={`M${pad} ${b.y - gap / 2} q${innerW / 6} -2 ${innerW / 3} 0 t${innerW / 3} 0 t${innerW / 3} 0`}
                fill="none" stroke={hsl(SITE.accent, 0.5)} strokeWidth={0.7}
              />
            ) : layout.divider === "rule" ? (
              <path d={`M${pad + 8} ${b.y - gap / 2} H${pad + innerW - 8}`} stroke={hsl(SITE.accent, 0.45)} strokeWidth={0.7} />
            ) : (
              <g stroke={hsl(SITE.accent, 0.6)} strokeWidth={0.7} fill="none">
                <path d={`M${pad + 18} ${b.y - gap / 2} H${W / 2 - 4}`} opacity={0.5} />
                <path d={`M${W / 2 + 4} ${b.y - gap / 2} H${pad + innerW - 18}`} opacity={0.5} />
                <path d={`M${W / 2} ${b.y - gap / 2 - 2.2} l2.2 2.2 -2.2 2.2 -2.2 -2.2Z`} />
              </g>
            )
          )}
          <rect x={pad} y={b.y} width={innerW} height={b.h} rx={2.5} fill={hsl(SITE.card)} />
          <rect x={pad} y={b.y} width={3} height={b.h} rx={1.5} fill={hsl(SECTION_TONE[b.id] ?? SITE.primary)} />
          <rect x={pad + 7} y={b.y + 2} width={innerW * 0.35} height={2} rx={1} fill={hsl(SITE.fg, 0.28)} />
        </g>
      ))}

      <rect x={0} y={H - 4} width={W} height={4} fill={hsl(SITE.primary, 0.85)} />
      <rect id={uid} width={0} height={0} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة تنسيق الهاتف — إطار جهاز رأسي                                */
/* ------------------------------------------------------------------ */

const PW = 74;   // عرض إطار الجهاز
const PH = 132;  // ارتفاعه

export function MobilePreview({ mobile, skin }: { mobile: MobileLayout; skin: StudentSkin }) {
  const v = skin.vars;
  const pad = mobile.density === "compact" ? 4 : mobile.density === "roomy" ? 8 : 6;
  const inner = PW - pad * 2;

  /* الترحيب */
  const headH = mobile.slimHeader ? 14 : 24;
  const headY = 12;

  /* المؤشّرات */
  const statsY = headY + headH + pad;
  const statsH = 14;

  /* الكورسات */
  const cardsY = statsY + statsH + pad;
  const two = mobile.cards === "two";
  const cols = two ? 2 : 1;
  const cardW = (inner - (two ? 3 : 0)) / cols;
  const cardH = mobile.cards === "row" ? 10 : mobile.cards === "wide" ? 26 : two ? 22 : 16;

  /* شريط التنقّل */
  const navH = mobile.nav === "labels" ? 15 : mobile.nav === "pill" ? 10 : 12;
  const navY = PH - navH - (mobile.nav === "bar" ? 0 : 3);
  const navW = mobile.nav === "bar" ? PW : mobile.nav === "pill" ? PW * 0.62 : PW - 8;
  const navX = mobile.nav === "bar" ? 0 : (PW - navW) / 2;
  const tabs = 5;

  return (
    <svg viewBox={`0 0 ${PW} ${PH}`} className="mx-auto block h-auto w-full max-w-[7rem]" style={{ aspectRatio: `${PW} / ${PH}` }}>
      {/* جسم الجهاز */}
      <rect x="0.6" y="0.6" width={PW - 1.2} height={PH - 1.2} rx="9" fill={hsl(v.background)} stroke={hsl(v.foreground, 0.28)} strokeWidth="1.2" />
      {/* النوتش */}
      <rect x={PW / 2 - 9} y="3" width="18" height="3.2" rx="1.6" fill={hsl(v.foreground, 0.3)} />

      {/* الترحيب */}
      <rect x={pad} y={headY} width={inner} height={headH} rx={mobile.slimHeader ? 4 : 6} fill={hsl(v.primary)} />
      <rect x={pad + 3} y={headY + 4} width={inner * 0.42} height={2.6} rx={1.3} fill={hsl(v.goldLight, 0.9)} />
      {!mobile.slimHeader && (
        <rect x={pad + 3} y={headY + 10} width={inner * 0.26} height={2.2} rx={1.1} fill="#fff" opacity={0.45} />
      )}

      {/* المؤشّرات — ممرّرة أفقياً أم ملتفّة */}
      {mobile.scrollStats ? (
        <>
          {[0, 1, 2].map((i) => (
            <MiniCard key={i} skin={skin} x={pad + i * (inner * 0.42 + 2)} y={statsY} w={inner * 0.42} h={statsH} />
          ))}
          {/* البطاقة الثالثة مقطوعة عند الحافة — إشارة إلى التمرير */}
          <rect x={PW - pad} y={statsY} width={pad} height={statsH} fill={hsl(v.background)} />
        </>
      ) : (
        [0, 1, 2].map((i) => {
          const w = (inner - 4) / 3;
          return <MiniCard key={i} skin={skin} x={pad + i * (w + 2)} y={statsY} w={w} h={statsH} />;
        })
      )}

      {/* الكورسات */}
      {Array.from({ length: two ? 4 : 3 }).map((_, i) => {
        const c = two ? i % 2 : 0;
        const r = two ? Math.floor(i / 2) : i;
        const x = pad + c * (cardW + 3);
        const y = cardsY + r * (cardH + pad * 0.6);
        if (y + cardH > navY - 3) return null;
        return (
          <g key={i}>
            <MiniCard skin={skin} x={x} y={y} w={cardW} h={cardH} />
            {mobile.cards === "wide" || two ? (
              <rect x={x + 2} y={y + 2} width={cardW - 4} height={cardH * 0.55} rx={2} fill={hsl(v.accent, 0.5)} />
            ) : (
              <rect x={x + 2} y={y + 2} width={mobile.cards === "row" ? 7 : 11} height={cardH - 4} rx={2} fill={hsl(v.accent, 0.5)} />
            )}
          </g>
        );
      })}

      {/* شريط التنقّل */}
      <rect x={navX} y={navY} width={navW} height={navH} rx={mobile.nav === "bar" ? 0 : 5} fill={hsl(v.card)} stroke={hsl(v.gold, 0.5)} strokeWidth="0.7" />
      {Array.from({ length: tabs }).map((_, i) => {
        const w = navW / tabs;
        const cx = navX + w * i + w / 2;
        return (
          <g key={i}>
            <circle cx={cx} cy={navY + (mobile.nav === "labels" ? 5.5 : navH / 2)} r="1.9" fill={hsl(i === 0 ? v.primary : v.foreground, i === 0 ? 1 : 0.35)} />
            {mobile.nav === "labels" && (
              <rect x={cx - 3.4} y={navY + 9.5} width="6.8" height="1.6" rx="0.8" fill={hsl(v.foreground, 0.3)} />
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة الهيئة — الشكل لا اللون                                     */
/* ------------------------------------------------------------------ */

/**
 * تُرسم بعناصر HTML لا SVG: الأشكال نفسها مبنيّة على `clip-path`، فرسمها
 * بالعنصر الحقيقي يُظهر الشكل كما سيبدو تماماً بدل محاكاته بمسار SVG قد
 * يختلف عنه. زخرفة الحافّة وحدها SVG — وهي كذلك في الصفحة الحقيقية.
 */
export function DesignPreview({ design, skin }: { design: StudentDesign; skin: StudentSkin }) {
  const v = skin.vars;
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl p-3"
      style={{ background: hsl(v.background), aspectRatio: `${W} / ${H}` }}
    >
      {/* لوح الترحيب */}
      <div
        className="relative overflow-hidden"
        style={{ ...shapeStyle(design.panel), background: hsl(v.primary), height: "42%" }}
      >
        <span className="absolute inset-x-0 top-0 text-[hsl(var(--gold-light))]" style={{ color: hsl(v.goldLight) }}>
          <EdgeArtLayer kind={design.edge} />
        </span>
        <div className="relative p-2.5">
          <div className="h-1.5 w-10 rounded-full" style={{ background: hsl(v.goldLight, 0.9) }} />
          <div className="mt-1.5 h-2 w-16 rounded-full bg-white/45" />
        </div>
      </div>

      {/* بطاقات */}
      <div className="mt-2 grid grid-cols-3 gap-1.5" style={{ height: "24%" }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-full"
            style={{
              ...shapeStyle(design.tile),
              background: hsl(v.card),
              boxShadow:
                design.border === "none"
                  ? undefined
                  : `inset 0 0 0 1px ${hsl(v.gold, design.border === "dashed" ? 0.35 : 0.55)}`,
            }}
          />
        ))}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1.5" style={{ height: "22%" }}>
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-full"
            style={{
              ...shapeStyle(design.tile),
              background: hsl(v.card),
              boxShadow: design.border === "none" ? undefined : `inset 0 0 0 1px ${hsl(v.gold, 0.5)}`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة القائمة الجانبية                                            */
/* ------------------------------------------------------------------ */

export function SideNavPreview({ nav, skin }: { nav: SideNavStyle; skin: StudentSkin }) {
  const v = skin.vars;
  const rail = nav.panel === "rail";
  const float = nav.panel === "floating";
  const w = rail ? 26 : 46;
  const x = float ? W - w - 5 : W - w;
  const y = float ? 5 : 0;
  const h = float ? H - 10 : H;
  const rowH = rail || nav.stacked ? 19 : 15;
  const top = 26;

  const panelFill =
    nav.panel === "outline" ? "none"
      : nav.panel === "glass" ? hsl(v.card, 0.6)
        : nav.panel === "gradient" ? `url(#sn-${nav.id})`
          : hsl(v.primary);

  const onDark = nav.panel === "solid" || nav.panel === "gradient" || nav.panel === "floating";
  const label = onDark ? "#fff" : hsl(v.foreground);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-2xl" style={{ aspectRatio: `${W} / ${H}` }}>
      <defs>
        <linearGradient id={`sn-${nav.id}`} x1="0" y1={y} x2="0" y2={y + h} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={hsl(v.primary)} />
          <stop offset="100%" stopColor={hsl(v.glow, 0.85)} />
        </linearGradient>
      </defs>

      <rect width={W} height={H} fill={hsl(v.background)} />

      {/* محتوى الصفحة — سياق يوضّح موضع القائمة */}
      <rect x={6} y={10} width={W - w - 14} height={22} rx={4} fill={hsl(v.card)} />
      <rect x={6} y={38} width={W - w - 14} height={30} rx={4} fill={hsl(v.card)} />
      <rect x={6} y={74} width={W - w - 14} height={26} rx={4} fill={hsl(v.card)} />

      <rect
        x={x} y={y} width={w} height={h}
        rx={float ? 8 : 0}
        fill={panelFill}
        stroke={nav.panel === "outline" ? hsl(v.border) : "none"}
        strokeWidth={nav.panel === "outline" ? 1 : 0}
      />

      <rect x={x + 6} y={10} width={w - 12} height={4} rx={2} fill={hsl(v.gold, 0.9)} />

      {[0, 1, 2, 3, 4].map((i) => {
        const iy = top + i * rowH;
        const on = i === 1;
        const icx = rail || nav.stacked ? x + w / 2 : x + w - 9;
        const icy = nav.stacked ? iy + 5 : iy + rowH / 2 - 1;

        return (
          <g key={i}>
            {on && nav.active === "pill" && (
              <rect x={x + 4} y={iy} width={w - 8} height={rowH - 3} rx={5} fill={hsl(v.gold, 0.18)} stroke={hsl(v.gold, 0.4)} strokeWidth={0.8} />
            )}
            {on && nav.active === "bar" && (
              <rect x={x} y={iy} width={2.5} height={rowH - 3} rx={1.2} fill={hsl(v.gold)} />
            )}
            {on && nav.active === "plaque" && (
              <path
                d={`M${x + 8} ${iy} H${x + w - 8} L${x + w - 4} ${iy + 4} V${iy + rowH - 7} L${x + w - 8} ${iy + rowH - 3} H${x + 8} L${x + 4} ${iy + rowH - 7} V${iy + 4}Z`}
                fill={hsl(v.gold, 0.18)} stroke={hsl(v.gold, 0.5)} strokeWidth={0.8}
              />
            )}
            {on && nav.active === "notch" && (
              <path
                d={`M${x + w} ${iy} H${x + 8} a5 5 0 0 0 -5 5 V${iy + rowH - 8} a5 5 0 0 0 5 5 H${x + w}Z`}
                fill={hsl(v.gold, 0.2)}
              />
            )}
            {on && nav.active === "glow" && (
              <ellipse cx={x + w / 2} cy={iy + rowH / 2 - 1} rx={w / 2 - 3} ry={rowH / 2} fill={hsl(v.gold, 0.22)} />
            )}
            {on && nav.active === "underline" && (
              <rect x={x + 6} y={iy + rowH - 5} width={w - 12} height={1.6} rx={0.8} fill={hsl(v.gold)} />
            )}
            {on && nav.active === "dot" && (
              <circle cx={x + 5} cy={iy + rowH / 2 - 1} r={1.8} fill={hsl(v.gold)} />
            )}
            {on && nav.active === "frame" && (
              <rect x={x + 4} y={iy} width={w - 8} height={rowH - 3} rx={5} fill="none" stroke={hsl(v.gold, 0.7)} strokeWidth={1.1} />
            )}

            {nav.icon === "box" && <rect x={icx - 4} y={icy - 4} width={8} height={8} rx={2} fill={hsl(v.gold, 0.2)} />}
            {nav.icon === "circle" && <circle cx={icx} cy={icy} r={4.2} fill={hsl(v.gold, 0.2)} />}
            {nav.icon === "medallion" && (
              <path
                d={`M${icx} ${icy - 4.6} L${icx + 3.2} ${icy - 3.2} L${icx + 4.6} ${icy} L${icx + 3.2} ${icy + 3.2} L${icx} ${icy + 4.6} L${icx - 3.2} ${icy + 3.2} L${icx - 4.6} ${icy} L${icx - 3.2} ${icy - 3.2}Z`}
                fill={hsl(v.gold, 0.2)} stroke={hsl(v.gold, 0.45)} strokeWidth={0.6}
              />
            )}
            <circle cx={icx} cy={icy} r={1.7} fill={on ? hsl(v.gold) : label} opacity={on ? 1 : 0.55} />

            {!rail && !nav.stacked && (
              <rect x={x + 6} y={icy - 1} width={w - 24} height={2.4} rx={1.2} fill={label} opacity={on ? 0.95 : 0.4} />
            )}
            {nav.stacked && (
              <rect x={x + w / 2 - 7} y={icy + 6} width={14} height={2} rx={1} fill={label} opacity={on ? 0.95 : 0.4} />
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة القائمة السفلية                                             */
/* ------------------------------------------------------------------ */

export function DockPreview({ dock, skin }: { dock: DockStyle; skin: StudentSkin }) {
  const v = skin.vars;
  const DW = 74;
  const DH = 132;
  const tabs = 5;

  const full = dock.shape === "flat" || dock.shape === "tray";
  const barW = dock.shape === "pill" ? DW * 0.62 : full ? DW : DW - 8;
  const barX = full ? 0 : (DW - barW) / 2;
  const barH = dock.labels ? 15 : 11;
  const barY = DH - barH - (full ? 0 : 4);

  /* القوس والمقصوص شكلان لا يُعبَّر عنهما بمستطيل، فيُرسمان بمسار. */
  const barPath =
    dock.shape === "arc"
      ? `M${barX} ${barY + barH} V${barY + 7} Q${barX + barW / 2} ${barY - 5} ${barX + barW} ${barY + 7} V${barY + barH} Z`
      : dock.shape === "cut"
        ? `M${barX + 6} ${barY} H${barX + barW - 6} L${barX + barW} ${barY + 6} V${barY + barH} H${barX} V${barY + 6} Z`
        : null;

  return (
    <svg viewBox={`0 0 ${DW} ${DH}`} className="mx-auto block h-auto w-full max-w-[7rem]" style={{ aspectRatio: `${DW} / ${DH}` }}>
      <rect x="0.6" y="0.6" width={DW - 1.2} height={DH - 1.2} rx="9" fill={hsl(v.background)} stroke={hsl(v.foreground, 0.28)} strokeWidth="1.2" />
      <rect x={DW / 2 - 9} y="3" width="18" height="3.2" rx="1.6" fill={hsl(v.foreground, 0.3)} />

      <rect x={6} y={12} width={DW - 12} height={22} rx={4} fill={hsl(v.primary)} />
      <rect x={6} y={38} width={DW - 12} height={16} rx={3} fill={hsl(v.card)} />
      <rect x={6} y={58} width={DW - 12} height={16} rx={3} fill={hsl(v.card)} />
      <rect x={6} y={78} width={DW - 12} height={16} rx={3} fill={hsl(v.card)} />

      {barPath ? (
        <path d={barPath} fill={hsl(v.card)} stroke={hsl(v.gold, 0.5)} strokeWidth="0.7" />
      ) : (
        <rect
          x={barX} y={barY} width={barW} height={barH}
          rx={dock.shape === "pill" ? barH / 2 : full ? (dock.shape === "tray" ? 5 : 0) : 5}
          fill={hsl(v.card)} stroke={hsl(v.gold, 0.5)} strokeWidth="0.7"
        />
      )}
      {dock.shape === "tray" && (
        <rect x={barX} y={barY - 2} width={barW} height={2} fill={hsl(v.primary, 0.18)} />
      )}

      {Array.from({ length: tabs }).map((_, i) => {
        const cw = barW / tabs;
        const cx = barX + cw * i + cw / 2;
        const on = i === 1;
        const lift = on && dock.mark === "lift" ? -4 : 0;
        const cy = barY + (dock.labels ? 5 : barH / 2) + lift;

        return (
          <g key={i}>
            {on && dock.mark === "pill" && (
              <rect x={cx - cw / 2 + 1.5} y={barY + 1.5 + lift} width={cw - 3} height={barH - 3} rx={3} fill={hsl(v.accent, 0.2)} />
            )}
            {on && dock.mark === "lift" && <circle cx={cx} cy={cy} r={5.5} fill={hsl(v.primary)} />}
            {on && dock.mark === "dot" && <circle cx={cx} cy={barY + barH - 2.5} r={1.5} fill={hsl(v.accent)} />}
            {on && dock.mark === "glow" && (
              <ellipse cx={cx} cy={cy} rx={cw / 2 - 1} ry={barH / 2 - 1} fill={hsl(v.accent, 0.28)} />
            )}
            {on && dock.mark === "bar" && (
              <rect x={cx - cw / 2 + 2} y={barY + 1} width={cw - 4} height={1.6} rx={0.8} fill={hsl(v.accent)} />
            )}

            <circle cx={cx} cy={cy} r={1.8} fill={on && dock.mark === "lift" ? "#fff" : hsl(on ? v.primary : v.foreground, on ? 1 : 0.4)} />
            {dock.labels && (
              <rect x={cx - 3.2} y={barY + 9.5 + lift} width={6.4} height={1.5} rx={0.75} fill={hsl(v.foreground, on ? 0.75 : 0.32)} />
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة إطار الصورة                                                 */
/* ------------------------------------------------------------------ */

export function FramePreview({
  shape,
  color,
  skin,
}: {
  shape: FrameShape;
  color?: string;
  skin: StudentSkin;
}) {
  const v = skin.vars;
  const FW = 80;
  const FH = 100;
  const stroke = color || hsl(v.primary);
  const outer = shape.path(FW, FH, 3);
  const inner = shape.path(FW, FH, 11);
  const uid = useUid("fp");

  return (
    <svg viewBox={`0 0 ${FW} ${FH}`} className="mx-auto block h-auto w-full max-w-[6.5rem]" style={{ aspectRatio: `${FW} / ${FH}` }}>
      <defs>
        <clipPath id={`${uid}-c`}>
          <path d={outer} />
        </clipPath>
      </defs>
      {/* صورة تمثيلية: هيئة شخص مبسّطة تُظهر ما يقصّه الإطار */}
      <g clipPath={`url(#${uid}-c)`}>
        <rect width={FW} height={FH} fill={hsl(v.muted)} />
        <circle cx={FW / 2} cy={FH * 0.38} r={FW * 0.17} fill={hsl(v.primary, 0.45)} />
        <path
          d={`M${FW * 0.2} ${FH} q${FW * 0.3} -${FH * 0.34} ${FW * 0.6} 0 Z`}
          fill={hsl(v.primary, 0.45)}
        />
      </g>
      <path d={outer} fill="none" stroke={stroke} strokeWidth={1.6} strokeOpacity={0.75} strokeLinejoin="round" />
      {shape.innerRule && (
        <path d={inner} fill="none" stroke={stroke} strokeWidth={0.8} strokeOpacity={0.35} strokeLinejoin="round" />
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة بطاقة المؤشّر                                               */
/* ------------------------------------------------------------------ */

export function TilePreview({
  tile,
  colors,
  skin,
}: {
  tile: TileStyle;
  colors?: TileColors;
  skin: StudentSkin;
}) {
  const v = skin.vars;
  const bg =
    colors?.bg ||
    (tile.surface === "solid" ? hsl(v.card)
      : tile.surface === "gradient" ? hsl(v.primary)
        : tile.surface === "glass" ? hsl(v.card, 0.5)
          : "transparent");
  const bg2 = colors?.bg2 || hsl(v.glow);
  const text = colors?.text || hsl(v.foreground);
  const badge = colors?.icon || hsl(v.gold);
  const accent = colors?.accent || hsl(v.gold, 0.5);

  const fill =
    tile.surface === "gradient" ? `linear-gradient(140deg, ${bg}, ${bg2})` : bg;
  const ring = tile.surface === "flat" ? "none" : `inset 0 0 0 ${tile.surface === "outline" ? 1.6 : 1}px ${accent}`;

  const badgeShape =
    tile.icon === "circle" ? "9999px"
      : tile.icon === "square" ? "3px"
        : "7px";

  const centered = tile.layout === "centered";
  const inline = tile.layout === "inline";

  return (
    <div
      className="grid w-full place-items-center rounded-2xl p-3"
      style={{ background: hsl(v.background), aspectRatio: "160 / 108" }}
    >
      <div
        className="w-full max-w-[9rem] p-3"
        style={{
          background: fill,
          boxShadow: ring,
          borderRadius: "0.9rem",
          textAlign: centered ? "center" : "right",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            justifyContent: centered ? "center" : "space-between",
            flexDirection: inline ? "row-reverse" : "row",
          }}
        >
          {tile.icon !== "none" && (
            <span
              style={{
                width: 22,
                height: 22,
                background: badge,
                borderRadius: tile.icon === "medallion" ? 0 : badgeShape,
                clipPath:
                  tile.icon === "medallion"
                    ? "polygon(50% 0, 85% 15%, 100% 50%, 85% 85%, 50% 100%, 15% 85%, 0 50%, 15% 15%)"
                    : undefined,
                flexShrink: 0,
              }}
            />
          )}
          {inline && (
            <span style={{ color: text, fontWeight: 700, fontSize: "1.1rem", lineHeight: 1 }}>٧٥٪</span>
          )}
        </div>

        {!inline && (
          <p style={{ color: text, fontWeight: 700, fontSize: "1.35rem", lineHeight: 1, marginTop: 10 }}>٧٥٪</p>
        )}
        <p style={{ color: text, opacity: 0.7, fontSize: "0.6rem", marginTop: 6 }}>متوسّط تقدّمك</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة شريط الأدوات                                                */
/* ------------------------------------------------------------------ */

export function ToolbarPreview({ bar, skin }: { bar: ToolbarStyle; skin: StudentSkin }) {
  const v = skin.vars;
  const uid = useUid("tb");

  const H_BAR = bar.height === "compact" ? 14 : bar.height === "tall" ? 24 : 19;
  const float = bar.surface === "floating";
  const bx = float ? 5 : 0;
  const by = float ? 5 : 0;
  const bw = W - (float ? 10 : 0) - 30; // ٣٠ للشريط الجانبي
  const ink = bar.surface === "ink";

  const fill =
    bar.surface === "outline" ? "none"
      : bar.surface === "glass" ? hsl(v.card, 0.6)
        : bar.surface === "gradient" ? `url(#${uid}-g)`
          : ink ? hsl(v.primary)
            : hsl(v.card);

  const fg = ink ? "#fff" : hsl(v.foreground);

  /* عرض حقل البحث بحسب نمطه */
  const searchW =
    bar.search === "none" ? 0 : bar.search === "icon" ? 12 : bar.search === "pill" ? 30 : 52;

  const actN = 3;
  const actW = 9;
  const actGap = bar.grouped ? 1.5 : 3;
  const actTotal = actN * actW + (actN - 1) * actGap + (bar.grouped ? 4 : 0);
  const actX = bx + 5;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-2xl" style={{ aspectRatio: `${W} / ${H}` }}>
      <defs>
        <linearGradient id={`${uid}-g`} x1={bx} y1="0" x2={bx + bw} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={hsl(v.card)} />
          <stop offset="100%" stopColor={hsl(v.muted)} />
        </linearGradient>
      </defs>

      <rect width={W} height={H} fill={hsl(v.background)} />

      {/* شريط جانبي — سياق يوضّح موضع التول بار */}
      <rect x={W - 30} y="0" width="30" height={H} fill={hsl(v.primary)} opacity={0.9} />

      {/* الشريط */}
      <rect
        x={bx} y={by} width={bw} height={H_BAR}
        rx={float ? 5 : 0}
        fill={fill}
        stroke={bar.surface === "outline" ? "none" : "none"}
      />

      {/* الفاصل السفلي */}
      {bar.edge === "line" && (
        <path d={`M${bx} ${by + H_BAR} H${bx + bw}`} stroke={hsl(v.border)} strokeWidth="1" />
      )}
      {bar.edge === "gold" && (
        <path d={`M${bx} ${by + H_BAR - 0.8} H${bx + bw}`} stroke={hsl(v.gold, 0.75)} strokeWidth="1.6" />
      )}
      {bar.edge === "shadow" && (
        <rect x={bx} y={by + H_BAR} width={bw} height="3" fill={hsl(v.primary, 0.12)} />
      )}

      {/* الأزرار */}
      {bar.grouped && (
        <rect
          x={actX - 2} y={by + H_BAR / 2 - actW / 2 - 2}
          width={actTotal} height={actW + 4} rx={(actW + 4) / 2}
          fill={ink ? "#fff" : hsl(v.muted)} opacity={ink ? 0.15 : 1}
        />
      )}
      {Array.from({ length: actN }).map((_, i) => (
        <circle
          key={i}
          cx={actX + actW / 2 + i * (actW + actGap)}
          cy={by + H_BAR / 2}
          r={actW / 2 - 1}
          fill={fg}
          opacity={i === actN - 1 ? 0.9 : 0.45}
        />
      ))}

      {/* حقل البحث */}
      {bar.search !== "none" && (
        <>
          <rect
            x={bx + bw - searchW - 5} y={by + H_BAR / 2 - 4}
            width={searchW} height="8" rx="4"
            fill={ink ? "#fff" : hsl(v.background)} opacity={ink ? 0.15 : 1}
            stroke={hsl(v.border)} strokeWidth={ink ? 0 : 0.7}
          />
          <circle cx={bx + bw - 9} cy={by + H_BAR / 2} r="1.6" fill={fg} opacity={0.5} />
        </>
      )}

      {/* محتوى الصفحة تحت الشريط */}
      <rect x={bx + 5} y={by + H_BAR + 7} width={bw - 10} height="20" rx="3" fill={hsl(v.card)} />
      <rect x={bx + 5} y={by + H_BAR + 31} width={bw - 10} height="26" rx="3" fill={hsl(v.card)} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة قسم الخطط                                                   */
/* ------------------------------------------------------------------ */

export function PlansPreview({ style, skin }: { style: PlansStyle; skin: StudentSkin }) {
  const v = skin.vars;
  const tone = hsl(v.primary);
  const list = style.grid === "list";
  const cols = list ? 1 : style.grid === "two" || style.grid === "wide" ? 2 : 3;
  const n = list ? 3 : cols;

  const pad = 8;
  const gap = 4;
  const inner = W - pad * 2;
  const cw = list ? inner : (inner - gap * (cols - 1)) / cols;
  const ch = list ? 18 : 62;
  const top = 30;
  const featured = list ? 1 : Math.floor(cols / 2);

  /** شكل البطاقة — القصّ يُرسم مساراً لأنه شكل حقيقي لا حدّ. */
  const cardPath = (x: number, y: number, w: number, h: number) => {
    if (style.surface === "plaque") {
      const c = 6;
      return `M${x + c} ${y} H${x + w - c} L${x + w} ${y + c} V${y + h - c} L${x + w - c} ${y + h} H${x + c} L${x} ${y + h - c} V${y + c} Z`;
    }
    if (style.surface === "ticket") {
      const m = y + h / 2;
      return `M${x} ${y} H${x + w} V${m - 4} L${x + w - 3} ${m} L${x + w} ${m + 4} V${y + h} H${x} V${m + 4} L${x + 3} ${m} L${x} ${m - 4} Z`;
    }
    return null;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-2xl" style={{ aspectRatio: `${W} / ${H}` }}>
      <rect width={W} height={H} fill={hsl(v.background)} />

      {/* عنوان القسم */}
      <rect x={W / 2 - 26} y={10} width={52} height={4} rx={2} fill={hsl(v.foreground, 0.6)} />
      <rect x={W / 2 - 16} y={18} width={32} height={2.5} rx={1.2} fill={hsl(v.accent)} />

      {Array.from({ length: n }).map((_, i) => {
        const on = i === featured;
        const x = list ? pad : pad + i * (cw + gap);
        const y = list ? top + i * (ch + gap) : top - (on && style.featured === "lift" ? 5 : 0);
        const h = ch + (on && style.featured === "scale" ? 6 : 0);
        const w = cw + (on && style.featured === "scale" ? 4 : 0);
        const xx = x - (on && style.featured === "scale" ? 2 : 0);
        const d = cardPath(xx, y, w, h);

        const fill =
          style.surface === "outline" ? "none"
            : style.surface === "glass" ? hsl(v.card, 0.6)
              : hsl(v.card);
        const stroke =
          style.featured === "border" && on ? tone
            : style.surface === "outline" ? hsl(v.border)
              : style.surface === "soft" ? "none"
                : hsl(v.border);

        return (
          <g key={i}>
            {/* هالة الخطة المميّزة */}
            {on && style.featured === "glow" && (
              <rect x={xx - 2} y={y - 2} width={w + 4} height={h + 4} rx={7} fill={tone} opacity={0.16} />
            )}

            {d ? (
              <path d={d} fill={fill} stroke={stroke} strokeWidth={on ? 1.4 : 0.8} />
            ) : (
              <rect x={xx} y={y} width={w} height={h} rx={5} fill={fill} stroke={stroke} strokeWidth={on ? 1.4 : 0.8} />
            )}

            {/* تاج علوي */}
            {on && style.featured === "crown" && (
              <rect x={xx} y={y} width={w} height={2.5} rx={1.2} fill={tone} />
            )}

            {/* السعر بأشكاله */}
            {style.price === "circle" ? (
              <>
                <circle cx={xx + w / 2} cy={y + h * 0.42} r={Math.min(13, w / 3)} fill={tone} opacity={0.14} />
                <circle cx={xx + w / 2} cy={y + h * 0.42} r={Math.min(13, w / 3)} fill="none" stroke={tone} strokeWidth={1} opacity={0.5} />
                <rect x={xx + w / 2 - 7} y={y + h * 0.42 - 1.5} width={14} height={3.5} rx={1.7} fill={tone} />
              </>
            ) : style.price === "badge" ? (
              <>
                {/* الشارة في موضع السعر — وموضعه يحدّده نمط العرض لا هذا الفرع */}
                <rect x={xx + 5} y={y + h * 0.3} width={Math.min(34, w - 10)} height={9} rx={4.5} fill={tone} opacity={0.16} />
                <rect x={xx + 8} y={y + h * 0.3 + 3} width={Math.min(20, w - 16)} height={3} rx={1.5} fill={tone} />
              </>
            ) : (
              <rect
                x={xx + 5}
                y={y + (style.price === "top" ? 5 : h * 0.32)}
                width={Math.min(22, w - 10)}
                height={5}
                rx={2.5}
                fill={tone}
              />
            )}

            {/* الاسم والمزايا */}
            <rect x={xx + 5} y={y + (style.price === "top" ? 15 : h * 0.16)} width={Math.min(26, w - 10)} height={3} rx={1.5} fill={hsl(v.foreground, 0.5)} />
            {!list && (
              <>
                <rect x={xx + 5} y={y + h * 0.55} width={w - 12} height={2} rx={1} fill={hsl(v.foreground, 0.22)} />
                <rect x={xx + 5} y={y + h * 0.63} width={w - 16} height={2} rx={1} fill={hsl(v.foreground, 0.22)} />
                <rect x={xx + 5} y={y + h * 0.71} width={w - 20} height={2} rx={1} fill={hsl(v.foreground, 0.22)} />
              </>
            )}

            {/* الزرّ */}
            <rect
              x={xx + 5}
              y={y + h - 11}
              width={w - 10}
              height={7}
              rx={3.5}
              fill={on ? tone : "none"}
              stroke={on ? "none" : tone}
              strokeWidth={0.9}
            />
          </g>
        );
      })}
    </svg>
  );
}
