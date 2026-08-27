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
