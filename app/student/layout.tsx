import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { studentNav } from "@/lib/dashboard-data";
import { getSession } from "@/lib/session";
import { getPublicDB, loadDB, sessionUser } from "@/lib/db";
import { findSkin, findLayout, findMobile, mobileClass, skinVars } from "@/lib/skins";
import { SkinOrnament } from "@/components/brand/skin-ornaments";

export const dynamic = "force-dynamic";
export const metadata = { title: "بوابة الطالب", robots: { index: false } };

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "student") redirect("/login?next=/student");

  /* الجلسة رمز موقّع لا يُبطله حذف الحساب من اللوحة، فنتحقّق من الحساب
     نفسه عند كل تحميل: المحذوف أو الموقوف يُعاد إلى صفحة الدخول فوراً. */
  await loadDB();
  if (!sessionUser(session)) redirect("/login?gone=1");

  const pub = getPublicDB();
  const me = pub.users.find((u) => u.id === session.uid);

  /* المظهر يُحقن كمتغيّرات CSS على غلاف واحد: ثيم واحد فقط يصل
     المتصفّح بدل عشرين كتلة أنماط لا يُعرض منها إلا واحدة. */
  const skin = findSkin(pub.content?.studentSkin);
  const layout = findLayout(pub.content?.studentLayout);
  const mobile = findMobile(pub.content?.studentMobile);

  return (
    <div
      className={`student-skin relative min-h-full ${mobileClass(mobile)}`}
      style={skinVars(skin)}
      data-skin={skin.id}
      data-layout={layout.id}
      data-card={skin.card}
      data-mobile={mobile.id}
    >
      <SkinOrnament id={skin.ornament} />
      <DashboardShell
        nav={studentNav}
        role="student"
        user={{ name: session.name, sub: me?.grade ?? "طالب", avatar: session.name.charAt(0) }}
      >
        {children}
      </DashboardShell>
    </div>
  );
}
