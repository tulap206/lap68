export function SkeletonMetricCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 rounded-xl bg-zinc-800/60 border border-zinc-800 animate-pulse" />
      ))}
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 rounded-lg bg-zinc-800/50 border border-zinc-800/80 animate-pulse" />
      ))}
    </div>
  )
}
