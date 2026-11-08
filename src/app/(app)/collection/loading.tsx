import { Skeleton } from "@/components/ui/Skeleton";

export default function CollectionLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col gap-2 p-4 bg-surface rounded-lg border border-line">
            <Skeleton className="h-14 w-14 rounded-lg" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-1/2" />
            <Skeleton className="h-2 w-1/4" />
            <div className="mt-2 flex items-center gap-2">
              <Skeleton className="h-2 w-1/2 rounded-full" />
              <Skeleton className="h-2 w-1/4 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}