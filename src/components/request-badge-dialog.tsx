
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, CreditCard, Banknote, AlertCircle, Info, Verified } from 'lucide-react';
import { useUser, useFirestore, useStorage } from '@/firebase';
import { requestVerification } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import { createFedaPayTransaction } from '@/lib/fedapay';
import { SuccessView } from './success-view';

import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  paymentMethod: z.enum(['fedapay', 'offline'], {
    required_error: "Veuillez choisir un mode de paiement.",
  }),
  paymentProof: z.any().optional(),
}).refine((data) => {
    if (data.paymentMethod === 'offline' && (!data.paymentProof || data.paymentProof.length === 0)) {
        return false;
    }
    return true;
}, {
    message: "La capture d'écran est obligatoire pour le paiement hors ligne.",
    path: ["paymentProof"],
});

type RequestBadgeFormValues = z.infer<typeof formSchema>;

export function RequestBadgeDialog({ onComplete }: { onComplete: () => void }) {
  const { userProfile } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<RequestBadgeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        paymentMethod: 'fedapay',
    }
  });

  const paymentMethod = form.watch('paymentMethod');

  async function onSubmit(values: RequestBadgeFormValues) {
    if (!userProfile || !firestore || !storage) return;
    setIsLoading(true);
    try {
      if (values.paymentMethod === 'fedapay') {
          const payment = await createFedaPayTransaction({
              amount: 15000,
              description: `Badge Bleu Loving - ${userProfile.name}`,
              customerEmail: userProfile.email,
              customerName: userProfile.name
          });
          
          window.open(payment.url, '_blank');
          toast({ title: "Redirection FedaPay...", description: "Finalisez le paiement dans l'onglet qui vient de s'ouvrir." });
      }

      await requestVerification({
        firestore,
        storage,
        userId: userProfile.uid,
        paymentMethod: values.paymentMethod,
        paymentProofFile: values.paymentProof?.[0],
      });

      setShowSuccess(true);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (showSuccess) {
      return (
          <div className="max-h-[80vh] overflow-y-auto scrollbar-hide">
              <SuccessView 
                title="Demande transmise !"
                message={paymentMethod === 'fedapay' 
                    ? "Votre paiement a été initialisé. Votre badge sera activé dès confirmation automatique." 
                    : "L'administrateur vérifiera votre preuve de paiement manuelle sous peu."}
                onBack={onComplete}
              />
          </div>
      );
  }

  return (
    <div className="space-y-6 py-4 max-h-[80vh] overflow-y-auto px-4 scrollbar-hide">
      <DialogHeader>
        <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <Verified className="text-blue-500 fill-blue-500" /> Badge Bleu Loving
        </DialogTitle>
        <DialogDescription>
            Obtenez votre certification officielle pour 15 000 FCFA / mois.
        </DialogDescription>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Alert className="bg-blue-500/10 border-blue-500/20 rounded-2xl">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertTitle className="font-bold text-blue-500">Paiement requis</AlertTitle>
            <AlertDescription className="text-sm leading-relaxed">
                Montant : 15 000 FCFA. Ce badge booste votre visibilité et débloque des fonctionnalités exclusives pour 30 jours.
            </AlertDescription>
          </Alert>

          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
                <FormItem className="space-y-3">
                <FormLabel className="font-bold">Mode de paiement</FormLabel>
                <FormControl>
                    <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-2"
                    >
                    <div className="flex items-center space-x-3 space-y-0 rounded-2xl border p-4 cursor-pointer hover:bg-muted transition-colors">
                        <RadioGroupItem value="fedapay" id="badge-fedapay" />
                        <Label htmlFor="badge-fedapay" className="flex items-center gap-3 cursor-pointer w-full">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <CreditCard className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-sm">FedaPay (Recommandé)</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-tighter font-medium">MoMo, VISA, Mastercard</p>
                            </div>
                        </Label>
                    </div>
                    <div className="flex items-center space-x-3 space-y-0 rounded-2xl border p-4 cursor-pointer hover:bg-muted transition-colors">
                        <RadioGroupItem value="offline" id="badge-offline" />
                        <Label htmlFor="badge-offline" className="flex items-center gap-3 cursor-pointer w-full">
                            <div className="p-2 rounded-xl bg-green-500/10 text-green-600">
                                <Banknote className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-sm">Dépôt Manuel</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-tighter font-medium">+229 0151563219</p>
                            </div>
                        </Label>
                    </div>
                    </RadioGroup>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
          />

          {paymentMethod === 'offline' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <Alert variant="destructive" className="rounded-2xl border-none shadow-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="font-bold">Preuve requise</AlertTitle>
                    <AlertDescription className="text-xs">
                        Envoyez 15 000 FCFA sur le +229 0151563219, puis téléchargez la capture d'écran du transfert.
                    </AlertDescription>
                </Alert>
                <FormField
                    control={form.control}
                    name="paymentProof"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="font-bold">Capture du transfert</FormLabel>
                        <FormControl>
                            <Input 
                                type="file" 
                                accept="image/*" 
                                className="rounded-xl h-12"
                                onChange={(e) => {
                                    field.onChange(e.target.files);
                                }}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
          )}

          <DialogFooter>
            <Button type="submit" className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/20" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {paymentMethod === 'fedapay' ? 'Payer avec FedaPay' : 'Envoyer ma demande'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </div>
  );
}
