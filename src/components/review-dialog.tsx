
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Star, Loader2, AlertCircle, MessageSquare } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { submitReview } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  stars: z.number().min(1).max(5),
  text: z.string().min(10, 'L\'avis doit contenir au moins 10 caractères.'),
  isComplaint: z.boolean().default(false),
});

type Props = {
  rendezvousId: string;
  targetUid: string;
  targetName: string;
  onComplete: () => void;
};

export function ReviewDialog({ rendezvousId, targetUid, targetName, onComplete }: Props) {
  const { userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      stars: 5,
      text: '',
      isComplaint: false,
    }
  });

  const stars = form.watch('stars');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!userProfile || !firestore) return;
    setIsLoading(true);
    try {
      await submitReview({
        firestore,
        review: {
          fromUid: userProfile.uid,
          fromName: userProfile.name,
          targetUid,
          targetName,
          rendezvousId,
          stars: values.stars,
          text: values.text,
          isComplaint: values.isComplaint,
          createdAt: new Date().toISOString(),
        }
      });

      toast({
        title: values.isComplaint ? 'Signalement envoyé' : 'Avis enregistré !',
        description: 'Merci pour votre retour.',
      });
      onComplete();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Une erreur est survenue.' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-headline text-2xl">Avis sur {targetName}</DialogTitle>
        <DialogDescription>
          Comment s'est passé votre rendez-vous ? Votre avis aide la communauté.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => form.setValue('stars', i)}
                  className="transition-transform active:scale-90"
                >
                  <Star
                    className={cn(
                      "w-10 h-10 transition-colors",
                      i <= stars ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground opacity-30"
                    )}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm font-bold text-muted-foreground">
              {stars === 1 && "Très déçu"}
              {stars === 2 && "Déçu"}
              {stars === 3 && "Correct"}
              {stars === 4 && "Bien"}
              {stars === 5 && "Excellent !"}
            </p>
          </div>

          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Votre commentaire</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Partagez votre expérience..."
                    className="min-h-[100px] rounded-2xl"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-2xl border border-destructive/10">
            <div className="space-y-0.5">
              <Label htmlFor="complaint-mode" className="text-destructive font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Signaler un problème
              </Label>
              <p className="text-[10px] text-muted-foreground">L'administrateur sera alerté immédiatement.</p>
            </div>
            <FormField
              control={form.control}
              name="isComplaint"
              render={({ field }) => (
                <FormControl>
                  <Switch
                    id="complaint-mode"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              )}
            />
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full h-14 rounded-2xl font-bold" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : "Envoyer mon avis"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
