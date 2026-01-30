interface PublicSectionSkeletonProps {
  title?: string;
  lines?: number;
}

export function PublicSectionSkeleton({ title, lines = 3 }: PublicSectionSkeletonProps) {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-100 bg-white/70 p-4 shadow-sm">
      {title && <div className="h-4 w-32 rounded bg-slate-200 mb-4" aria-hidden="true" />}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="h-3 w-full rounded bg-slate-200"
            style={{ width: `${80 - index * 8}%` }}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}
