import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminValidationCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-5 w-24" />
          </div>
           <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <div>
          <Skeleton className="h-4 w-1/3 mb-2" />
          <Skeleton className="aspect-square w-[250px] rounded-md" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-28" />
      </CardFooter>
    </Card>
  );
}
