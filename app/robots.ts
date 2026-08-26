import type { MetadataRoute } from "next";
import { getPublicDB, loadDB } from "@/lib/db";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * robots.txt
 * ------------------------------------------------------------------
 * الصفحة العامة وحدها مفتوحة للفهرسة. كل ما خلف تسجيل الدخول محجوب:
 * لوحة الإدارة وبوابة الطالب ومسارات الـAPI — لا لأنها سرّ (الخادم
 * يحميها) بل لأن فهرستها بلا معنى وتستهلك ميزانية زحف محرّك البحث.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  await loadDB();
  const { content } = getPublicDB();
  const base = await siteUrl(content.url);

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/student", "/student/", "/api/"],
      },
    ],
    ...(base ? { sitemap: `${base}/sitemap.xml`, host: base } : {}),
  };
}
