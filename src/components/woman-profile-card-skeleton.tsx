import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function WomanProfileCardSkeleton() {
  return (
    <Card className="overflow-hidden">
        <Skeleton className="w-full aspect-[3/4]" />
      <CardContent className="space-y-3 pt-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-1 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2 items-stretch">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}
