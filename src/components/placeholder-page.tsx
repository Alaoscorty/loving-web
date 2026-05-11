import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PlaceholderPage({ title, description }: { title: string, description?: string }) {
  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{description || 'Cette page est en cours de construction.'}</p>
        </CardContent>
      </Card>
    </div>
  );
}
