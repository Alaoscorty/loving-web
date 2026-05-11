import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type AuthCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footerContent: React.ReactNode;
  className?: string;
};

export function AuthCard({ title, description, children, footerContent, className }: AuthCardProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2">
            <Icons.logo className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold font-headline text-foreground">Loving</span>
          </Link>
        </div>
        <Card className={cn('w-full', className)}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
          <CardFooter className="flex-col items-center justify-center text-sm">
            {footerContent}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
