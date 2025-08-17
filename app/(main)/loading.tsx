import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Skeleton for Header and Date Pickers */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-64" />
        </div>
      </div>

      {/* Skeleton for a Card Group */}
      <div className="p-4 md:p-6">
        <Skeleton className="h-8 w-1/4 mb-4" />
        <div className="space-y-6">
          {/* Skeleton for Table */}
          <Skeleton className="h-48 w-full" />
          {/* Skeleton for Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
            <Skeleton className="h-[250px] w-full" />
            <Skeleton className="h-[250px] w-full" />
            <Skeleton className="h-[250px] w-full" />
          </div>
        </div>
      </div>
       {/* Skeleton for another Card Group */}
       <div className="p-4 md:p-6">
        <Skeleton className="h-8 w-1/4 mb-4" />
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
            <Skeleton className="h-[250px] w-full" />
            <Skeleton className="h-[250px] w-full" />
            <Skeleton className="h-[250px] w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}