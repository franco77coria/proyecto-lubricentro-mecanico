export function SeguimientoSkeleton() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12 animate-pulse space-y-6">
      {/* Header Skeleton */}
      <header className="space-y-2 text-center">
        <div className="mx-auto h-4 w-28 bg-muted rounded-full" />
        <div className="mx-auto h-9 w-44 bg-muted rounded-xl" />
        <div className="mx-auto h-4 w-52 bg-muted rounded-full" />
      </header>

      {/* Tracker Card Skeleton */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-border/60">
          <div className="space-y-2">
            <div className="h-3 w-32 bg-muted rounded-full" />
            <div className="h-6 w-48 bg-muted rounded-xl" />
          </div>
          <div className="h-6 w-24 bg-muted rounded-full" />
        </div>
        <div className="h-2 w-full bg-muted rounded-full" />
        <div className="grid grid-cols-5 gap-2 pt-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-muted" />
              <div className="h-3 w-12 bg-muted rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Telemetría Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="h-20 bg-card border border-border/80 rounded-2xl" />
        <div className="h-20 bg-card border border-border/80 rounded-2xl" />
      </div>

      {/* Detalle Skeleton */}
      <div className="h-40 bg-card border border-border/80 rounded-2xl" />
    </main>
  );
}
