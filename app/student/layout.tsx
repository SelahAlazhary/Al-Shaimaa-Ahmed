import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { studentNav } from "@/lib/dashboard-data";
import { getSession } from "@/lib/session";
import { getPublicDB, loadDB, sessionUser } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "بوابة الطالب", robots: { index: false } };

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "student") redirect("/login?next=/student");

  /* الجلسة رمز موقّع لا يُبطله حذف الحساب من اللوحة، فنتحقّق من الحساب
     نفسه عند كل تحميل: المحذوف أو الموقوف يُعاد إلى صفحة الدخول فوراً. */
  await loadDB();
  if (!sessionUser(session)) redirect("/login?gone=1");

  const me = getPublicDB().users.find((u) => u.id === session.uid);
  return (
    <DashboardShell
      nav={studentNav}
      role="student"
      user={{ name: session.name, sub: me?.grade ?? "طالب", avatar: session.name.charAt(0) }}
    >
      {children}
    </DashboardShell>
  );
}
