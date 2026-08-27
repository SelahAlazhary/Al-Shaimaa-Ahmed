/** عناصر هيكل عظمي (Skeleton) للتحميل — نبض + وميض ناعم. */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

/** بطاقة إحصائية هيكلية */
export function StatSkeleton() {
  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-start justify-between">
        <Skeleton className="size-11 rounded-2xl" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-7 w-24" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}

/** بطاقة محتوى هيكلية */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={`h-3 ${["w-11/12", "w-4/5", "w-2/3", "w-3/4"][i % 4]}`} />
        ))}
      </div>
    </div>
  );
}

/** رأس صفحة هيكلي */
export function HeaderSkeleton() {
  return (
    <div className="mb-6 space-y-2">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}

/** شبكة بطاقات هيكلية */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * هيكل بوابة الطالب — يطابق ترتيب الصفحة الحقيقي.
 * ------------------------------------------------------------------
 * الهيكل يحاكي التخطيط المختار (لوح الترحيب والمؤشّرات وشبكة الكورسات)
 * لا شكلاً عاماً واحداً — فلا «تقفز» الصفحة عند اكتمال البيانات، وهي
 * القفزة التي تجعل الهيكل مزعجاً بدل أن يكون مطمئناً.
 */
export function StudentHomeSkeleton({
  header = true,
  statsInHeader = true,
  cards = 2,
}: {
  header?: boolean;
  statsInHeader?: boolean;
  cards?: number;
}) {
  const stats = (
    <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-[7.5rem] rounded-[1.4rem]" />
      ))}
    </div>
  );

  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">جارٍ تحميل بياناتك…</span>

      {header ? (
        <div className="mb-6 rounded-[1.75rem] bg-primary/90 p-6 sm:p-8">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24 bg-white/25" />
            <Skeleton className="h-8 w-56 bg-white/25" />
            <Skeleton className="h-2 w-40 bg-white/20" />
          </div>
          {statsInHeader && (
            <div className="mt-7 grid gap-3 sm:grid-cols-3 sm:gap-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-[7.5rem] rounded-[1.4rem] bg-white/15" />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mb-5 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-48" />
        </div>
      )}

      {(!header || !statsInHeader) && <div className="mb-6">{stats}</div>}

      <div className="mb-4 flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-24" />
      </div>

      <div className={`grid gap-4 ${cards === 1 ? "grid-cols-1" : cards === 3 ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2"}`}>
        {Array.from({ length: cards === 1 ? 3 : 4 }).map((_, i) => (
          <div key={i} className="glass flex gap-4 rounded-3xl p-4">
            <Skeleton className="h-24 w-28 shrink-0 rounded-2xl sm:w-32" />
            <div className="flex-1 space-y-2.5 py-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-2.5 w-full rounded-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
