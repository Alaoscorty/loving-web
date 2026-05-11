import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ManRendezvousCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <Skeleton className="w-5 h-5 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Skeleton className="w-5 h-5 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
         {/* No footer content needed for skeleton */}
      </CardFooter>
    </Card>
  );
}
