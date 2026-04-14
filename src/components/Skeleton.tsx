export function SkeletonBar({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonMatchCard() {
  return (
    <div className="card p-5 mb-4">
      <div className="flex justify-between items-center mb-4">
        <SkeletonBar className="h-3 w-10" />
        <SkeletonBar className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex items-center justify-center gap-4">
        <SkeletonBar className="h-10 flex-1 max-w-[80px]" />
        <SkeletonBar className="h-14 w-[110px] rounded-2xl" />
        <SkeletonBar className="h-10 flex-1 max-w-[80px]" />
      </div>
    </div>
  );
}

export function SkeletonTeamGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4 space-y-3">
          <SkeletonBar className="h-7 w-16" />
          <SkeletonBar className="h-3 w-20" />
          <SkeletonBar className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonMatchCard key={i} />
      ))}
    </div>
  );
}
