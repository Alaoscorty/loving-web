
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2, CreditCard, Banknote, AlertCircle, Info, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useStorage } from '@/firebase';
import { proposeRendezvous, RENDEZVOUS_FEE_FCFA, RENDEZVOUS_FEE_XP } from '@/lib/firebase-actions';
import { createFedaPayTransaction } from '@/lib/fedapay';
import { useToast } from '@/hooks/use-toast';
import { SuccessView } from './success-view';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { UserProfile } from '@/types/user';

const formSchema = z.object({
  proposedDate: z.date({
    required_error: 'Veuillez sélectionner une date.',
  }),
  proposedTime: z.string().min(1, 'L\'heure est requise.'),
  location: z.string().min(3, 'Le lieu doit contenir au moins 3 caractères.'),
  notes: z.string().default(''),
  paymentMethod: z.enum(['fedapay', 'offline', 'xp'], {
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

type ProposeRendezvousFormValues = z.infer<typeof formSchema>;

type Props = {
  womanProfile: UserProfile & { id: string };
  onProposalSent: () => void;
};

export function ProposeRendezvousDialog({ womanProfile, onProposalSent }: Props) {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'info' | 'payment'>('info');
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<ProposeRendezvousFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        proposedDate: addDays(new Date(), 7),
        proposedTime: '19:00',
        location: '',
        notes: '',
        paymentMethod: 'fedapay',
    }
  });

  const paymentMethod = form.watch('paymentMethod');

  async function onSubmit(values: ProposeRendezvousFormValues) {
    if (!user || !firestore || !storage) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Vous devez être connecté.' });
      return;
    }
    setIsLoading(true);
    try {
      const [hours, minutes] = values.proposedTime.split(':').map(Number);
      const combinedDate = new Date(values.proposedDate);
      combinedDate.setHours(hours, minutes);

      let transactionId: string | undefined;
      if (values.paymentMethod === 'fedapay') {
        const payment = await createFedaPayTransaction({
          amount: RENDEZVOUS_FEE_FCFA,
          description: `Frais de RDV Loving avec ${womanProfile.name}`,
          customerEmail: user.email || '',
          customerName: userProfile?.name || 'Client Loving',
          reference: `rdv-${user.uid}-${womanProfile.id}-${Date.now()}`,
        });
        transactionId = payment.transactionId || payment.id;
        window.open(payment.url, '_blank');
        toast({ title: 'Redirection FedaPay...', description: 'Finalisez le paiement dans l’onglet qui vient de s’ouvrir.' });
      }

      await proposeRendezvous({
        firestore,
        storage,
        manUid: user.uid,
        womanUid: womanProfile.id,
        data: {
            proposedDate: combinedDate,
            location: values.location,
            notes: values.notes,
        },
        paymentMethod: values.paymentMethod,
        paymentProofFile: values.paymentProof?.[0],
        paymentTransactionId: transactionId,
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
                title="Invitation envoyée !"
                message={`Votre proposition de rendez-vous pour le ${format(form.getValues('proposedDate'), 'dd MMMM', { locale: fr })} a bien été transmise à ${womanProfile.name}.`}
                onBack={onProposalSent}
              />
          </div>
      );
  }

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto px-4 py-4 scrollbar-hide">
      <DialogHeader>
        <DialogTitle className="font-headline text-2xl">Inviter {womanProfile.name}</DialogTitle>
        <DialogDescription>
          {step === 'info' ? 'Étape 1 : Détails du rendez-vous' : `Étape 2 : Paiement des frais (${RENDEZVOUS_FEE_FCFA} FCFA)`}
        </DialogDescription>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {step === 'info' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="proposedDate"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel className="font-bold">Date du RDV</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                    <div className="relative group cursor-pointer">
                                        <Input 
                                            readOnly
                                            value={field.value ? format(field.value, 'dd MMMM yyyy', { locale: fr }) : ""}
                                            placeholder="Choisir une date"
                                            className="rounded-xl h-12 border-primary/20 bg-background cursor-pointer group-hover:border-primary/50 transition-colors pr-10"
                                        />
                                        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 text-primary" />
                                    </div>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={(date) => {
                                            if (date) {
                                                field.onChange(date);
                                            }
                                        }}
                                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="proposedTime"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold">Heure</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input type="time" {...field} className="rounded-xl h-12 pl-10 border-primary/20" />
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-bold">Lieu du rendez-vous</FormLabel>
                        <FormControl>
                            <Input placeholder="Ex: Restaurant Le Pacha, Cotonou" {...field} className="rounded-xl h-12 border-primary/20" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-bold">Note personnelle (optionnel)</FormLabel>
                        <FormControl>
                        <Textarea
                            placeholder="Pourquoi ce lieu ? Un message pour l'inviter..."
                            className="rounded-xl min-h-[80px] border-primary/20"
                            {...field}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <Button type="button" className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20" onClick={async () => {
                    const isValid = await form.trigger(['proposedDate', 'proposedTime', 'location']);
                    if (isValid) setStep('payment');
                }}>
                    Continuer vers le paiement
                </Button>
              </div>
          ) : (
              <div className="space-y-6">
                <Alert className="bg-primary/10 border-primary/20 rounded-2xl">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertTitle className="font-bold">Frais de proposition</AlertTitle>
                    <AlertDescription className="text-sm">
                        Des frais de {RENDEZVOUS_FEE_FCFA} FCFA (ou {RENDEZVOUS_FEE_XP} XP) sont requis pour envoyer cette proposition.
                    </AlertDescription>
                </Alert>

                <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormLabel className="font-bold">Choisir le mode de règlement</FormLabel>
                        <FormControl>
                            <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-2"
                            >
                            <div className="flex items-center space-x-3 space-y-0 rounded-2xl border p-4 cursor-pointer hover:bg-muted transition-colors">
                                <RadioGroupItem value="xp" id="rdv-xp" />
                                <Label htmlFor="rdv-xp" className="flex items-center gap-3 cursor-pointer w-full">
                                    <div className="p-2 rounded-xl bg-accent/10 text-accent">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm">Payer en XP ({RENDEZVOUS_FEE_XP} XP)</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Disponible : {userProfile?.points || 0} XP</p>
                                    </div>
                                </Label>
                            </div>
                            <div className="flex items-center space-x-3 space-y-0 rounded-2xl border p-4 cursor-pointer hover:bg-muted transition-colors">
                                <RadioGroupItem value="fedapay" id="rdv-fedapay" />
                                <Label htmlFor="rdv-fedapay" className="flex items-center gap-3 cursor-pointer w-full">
                                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                        <CreditCard className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm">FedaPay (Carte / MoMo)</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-tighter font-medium">Automatique & Sécurisé</p>
                                    </div>
                                </Label>
                            </div>
                            <div className="flex items-center space-x-3 space-y-0 rounded-2xl border p-4 cursor-pointer hover:bg-muted transition-colors">
                                <RadioGroupItem value="offline" id="rdv-offline" />
                                <Label htmlFor="rdv-offline" className="flex items-center gap-3 cursor-pointer w-full">
                                    <div className="p-2 rounded-xl bg-green-500/10 text-green-600">
                                        <Banknote className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm">Transfert Manuel</p>
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
                            <AlertTitle className="font-bold">Action Requise</AlertTitle>
                            <AlertDescription className="text-xs">
                                Envoyez {RENDEZVOUS_FEE_FCFA} FCFA au +229 0151563219 et téléchargez la capture du reçu.
                            </AlertDescription>
                        </Alert>
                        <FormField
                            control={form.control}
                            name="paymentProof"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="font-bold">Preuve du dépôt</FormLabel>
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

                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setStep('info')}>
                        Précédent
                    </Button>
                    <Button type="submit" className="flex-[2] h-14 rounded-2xl font-bold text-lg shadow-lg" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {paymentMethod === 'fedapay' ? `Payer ${RENDEZVOUS_FEE_FCFA} FCFA` : paymentMethod === 'xp' ? 'Utiliser mes XP' : 'Envoyer ma demande'}
                    </Button>
                </div>
              </div>
          )}
        </form>
      </Form>
    </div>
  );
}
