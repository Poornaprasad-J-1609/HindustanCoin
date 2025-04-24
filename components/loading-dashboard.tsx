import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <Skeleton className="h-10 w-full md:w-96 bg-gray-800" />
        <Skeleton className="h-10 w-full md:w-40 bg-gray-800" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-32 bg-gray-800" />
          ))}
      </div>

      <div className="mt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <Skeleton className="h-10 w-48 bg-gray-800 mb-4 md:mb-0" />
          <Skeleton className="h-10 w-32 bg-gray-800" />
        </div>

        <Skeleton className="h-[400px] w-full bg-gray-800 mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 bg-gray-800" />
          <Skeleton className="h-64 bg-gray-800" />
        </div>
      </div>
    </div>
  )
}
