import { memo } from 'react';

interface ServiceCardSkeletonProps {
  layout?: 1 | 2 | 3 | 6;
}

function ServiceCardSkeleton({ layout = 1 }: ServiceCardSkeletonProps) {
  if (layout === 2) {
    // Layout lista
    return (
      <div className="rounded-lg sm:rounded-xl overflow-hidden flex flex-col sm:flex-row items-center gap-2 sm:gap-3 md:gap-4 p-2.5 sm:p-3 md:p-4 border border-gray-200/50 animate-pulse">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 w-full space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-6 bg-gray-200 rounded w-24" />
        </div>
      </div>
    );
  }

  if (layout === 6 || layout === 3) {
    // Layout premium
    return (
      <div className="rounded-xl sm:rounded-2xl overflow-hidden flex flex-col border border-gray-200/50 animate-pulse h-full">
        <div className="w-full h-32 xs:h-36 sm:h-40 md:h-44 bg-gray-200" />
        <div className="p-2.5 sm:p-3 md:p-4 space-y-2 flex-1 flex flex-col">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="mt-auto h-8 bg-gray-200 rounded w-full" />
        </div>
      </div>
    );
  }

  // Layout 1: Grid clásico (default)
  return (
    <div className="rounded-lg sm:rounded-xl shadow-md overflow-hidden flex flex-col border border-gray-200/50 animate-pulse h-full">
      <div className="w-full h-32 xs:h-36 sm:h-40 md:h-44 bg-gray-200 flex-shrink-0" />
      <div className="p-2.5 sm:p-3 md:p-4 flex-1 flex flex-col space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="mt-auto h-8 bg-gray-200 rounded w-full" />
      </div>
    </div>
  );
}

export default memo(ServiceCardSkeleton);
