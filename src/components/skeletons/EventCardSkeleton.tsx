import { memo } from 'react';

function EventCardSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-5 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-24" />
      </div>
      <div className="space-y-2 mb-2">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-1/3" />
    </div>
  );
}

export default memo(EventCardSkeleton);

