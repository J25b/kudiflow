import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function PageHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-32 rounded-md" />
    </div>
  );
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <Skeleton className="h-7 w-24" />
        </Card>
      ))}
    </div>
  );
}

export function ListRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
          <Skeleton className="h-4 w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <Card className="p-5 space-y-4">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="w-full rounded-md" style={{ height }} />
      <Skeleton className="h-3 w-2/3" />
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      <PageHeaderSkeleton />
      <Card className="p-5 space-y-3">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </Card>
      <StatCardsSkeleton />
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5 space-y-4">
          <Skeleton className="h-4 w-48" />
          <ListRowsSkeleton rows={4} />
        </Card>
        <Card className="p-5 space-y-4">
          <Skeleton className="h-4 w-40" />
          <ListRowsSkeleton rows={5} />
        </Card>
      </div>
    </div>
  );
}

export function ListPageSkeleton() {
  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      <PageHeaderSkeleton />
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>
      <Card className="p-5">
        <ListRowsSkeleton rows={7} />
      </Card>
    </div>
  );
}

export function CardsPageSkeleton() {
  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      <PageHeaderSkeleton />
      <div className="grid md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      <Skeleton className="h-8 w-56" />
      <ChartSkeleton />
      <ChartSkeleton height={200} />
      <ChartSkeleton height={200} />
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
      <Skeleton className="h-8 w-40" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="p-5 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-2/3 rounded-md" />
        </Card>
      ))}
    </div>
  );
}
