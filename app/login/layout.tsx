import type { ReactNode } from "react";

/**
 * صفحة الدخول لا تُفهرَس: لا محتوى فيها لباحث، وفهرستها تُنتج نتيجة
 * ضعيفة تنافس الصفحة الرئيسية على الكلمات نفسها. تبقى الروابط متتبَّعة.
 */
export const metadata = {
  title: "تسجيل الدخول",
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
