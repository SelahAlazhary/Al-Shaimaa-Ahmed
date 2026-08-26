import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Amiri, IBM_Plex_Sans_Arabic, Noto_Kufi_Arabic } from "next/font/google";
import { ContentProvider } from "@/components/content/content-provider";
import { RouteTransition } from "@/components/ui/route-transition";
import { RegisterSW } from "@/components/pwa/register-sw";
import { getPublicDB, getScopedDB, loadDB } from "@/lib/db";
import { touchSession } from "@/lib/session";
import { defaultContent } from "@/lib/defaults";
import { buildJsonLd } from "@/lib/seo";
import "./globals.css";

export const dynamic = "force-dynamic";

/**
 * الخطوط — ثلاثة وجوه عربية أصيلة تخدم هوية المخطوط:
 * • IBM Plex Sans Arabic : متن الواجهة — وضوح عالٍ على الشاشات وأوزان كاملة.
 * • Amiri                : عناوين بخطّ النسخ الكلاسيكي — روح المخطوط العربي.
 * • Noto Kufi Arabic     : الشارات والعناوين الفرعية — كوفي هندسي حازم.
 */
const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});
const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-display",
  display: "swap",
});
const kufi = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  weight: ["400", "600", "700"],
  variable: "--font-kufi",
  display: "swap",
});

/** إعدادات العرض — viewport-fit=cover ضروري لاحترام حوّاف الشاشة في التطبيق المثبّت. */
export function generateViewport(): Viewport {
  const { content } = getPublicDB();
  const preset: Record<string, string> = {
    midad: "#233b8b", nile: "#095e86", andalus: "#245c4b", rumman: "#87263a",
    violet: "#233b8b", emerald: "#245c4b", ocean: "#095e86", crimson: "#87263a",
  };
  const primary =
    (content.theme.preset === "custom" && content.theme.customPrimary) ||
    preset[content.theme.preset] ||
    preset.midad;
  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: primary,
  };
}

/** يحوّل عنوان الموقع إلى URL صالح، ويسقط لعنوان محلي إن كان فارغاً أو تالفاً. */
function safeUrl(raw?: string): URL {
  try {
    if (raw) return new URL(raw);
  } catch {
    /* عنوان غير صالح — نتجاهله */
  }
  return new URL("http://localhost:3000");
}

/** ميتاداتا ديناميكية من قاعدة البيانات (العنوان/الوصف/الأيقونة/OG). */
export function generateMetadata(): Metadata {
  const { content: c } = getPublicDB();
  // أيقونة الموقع (favicon) = شعار الأستاذة أو صورتها
  const icon = c.teacher?.logo || c.teacher?.avatar || "/teacher.png";
  return {
    // عنوان الموقع قد يكون فارغاً قبل ضبطه من اللوحة — لا نكسر البناء بسببه
    metadataBase: safeUrl(c.url),
    title: { default: `${c.brand} | ${c.platformSubtitle}`, template: `%s | ${c.brand}` },
    description: c.teacher.bio,
    openGraph: {
      type: "website", locale: "ar_EG", url: c.url, siteName: c.brand,
      title: `${c.teacher.subject} مع ${c.teacher.name}`,
      description: c.teacher.tagline,
      images: [{ url: icon, width: 1200, height: 630, alt: c.brand }],
    },
    twitter: { card: "summary_large_image", title: c.brand, description: c.teacher.tagline, images: [icon] },
    robots: { index: true, follow: true },
    manifest: "/manifest.webmanifest",
    applicationName: c.brand,
    appleWebApp: {
      capable: true,
      title: c.brand,
      statusBarStyle: "black-translucent",
    },
    icons: {
      icon,
      apple: [{ url: "/api/pwa-icon?size=180", sizes: "180x180", type: "image/png" }],
    },
    formatDetection: { telephone: false },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  await loadDB(); // مصدر الحقيقة (فايربيز إن ضُبط)
  const session = await touchSession(); // يمدّد الجلسة الدائمة
  // الحمولة الأولى (SSR) مقيّدة بدور صاحب الجلسة — لا تسرّب بيانات لغير أصحابها
  const db = getScopedDB(session);
  const theme = db.content?.theme ?? defaultContent.theme;
  const jsonLd = buildJsonLd(db.content ?? defaultContent);

  return (
    <html
      lang="ar"
      dir="rtl"
      data-layout={theme.layout}
      data-preset={theme.preset}
      suppressHydrationWarning
    >
      <head>
        {jsonLd.map((block, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }} />
        ))}
      </head>
      <body className={`${plex.variable} ${amiri.variable} ${kufi.variable} font-sans`}>
        <ContentProvider initialDB={db} initialSession={session}>
          <RouteTransition>{children}</RouteTransition>
          <RegisterSW />
        </ContentProvider>
      </body>
    </html>
  );
}
