import { Skeleton } from "@/components/ui/skeleton";

export default function CreateProjectLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="space-y-8">
        {/* Step indicator skeleton */}
        <nav className="w-full">
          <div className="flex items-center justify-between gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <Skeleton className="size-10 rounded-full" />
                  <Skeleton className="h-3 w-8" />
                </div>
                {i < 4 && <Skeleton className="mx-2 h-0.5 flex-1 min-w-[24px]" />}
              </div>
            ))}
          </div>
        </nav>

        {/* Content skeleton */}
        <div className="min-h-[200px] space-y-4">
          <Skeleton className="h-5 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}
