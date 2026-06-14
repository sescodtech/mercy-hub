export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-lg overflow-hidden border border-neutral-100">
      {/* Image */}
      <div className="aspect-square bg-neutral-100" />
      {/* Info */}
      <div className="p-2 sm:p-2.5 space-y-2">
        <div className="h-2 w-12 bg-neutral-100 rounded" />
        <div className="h-3 w-full bg-neutral-100 rounded" />
        <div className="h-3 w-3/4 bg-neutral-100 rounded" />
        <div className="h-3.5 w-20 bg-neutral-100 rounded mt-1" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 24 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
