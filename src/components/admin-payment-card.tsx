'use client';

import Image from 'next/image';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Banknote, Check, User, X, Loader2, Calendar, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import type { Rendezvous } from '@/types/rendezvous';
import type { UserProfile } from '@/types/user';
import { AdminValidationCardSkeleton } from './admin-validation-card-skeleton';

type Props = {
  rendezvous: Rendezvous & { id: string };
  onValidate: (rendezvousId: string, approved: boolean) => void;
  isProcessing: boolean;
};

export function AdminPaymentCard({ rendezvous, onValidate, isProcessing }: Props) {
  const firestore = useFirestore();

  const manProfileRef = doc(firestore, 'users', rendezvous.manUid);
  const { data: manProfile, loading: loadingMan } = useDoc<UserProfile>(manProfileRef);
  
  const womanProfileRef = doc(firestore, 'users', rendezvous.womanUid);
  const { data: womanProfile, loading: loadingWoman } = useDoc<UserProfile>(womanProfileRef);

  if (loadingMan || loadingWoman) {
    return <AdminValidationCardSkeleton />;
  }

  if (!manProfile || !womanProfile) {
    return (
        <Alert variant="destructive">
            <AlertTitle>Erreur de données</AlertTitle>
            <AlertDescription>Impossible de charger les profils.</AlertDescription>
        </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <Banknote className="text-green-500" />
            <CardTitle>Preuve de paiement de {manProfile.name}</CardTitle>
        </div>
        <CardDescription>
          Montant : 2000 FCFA | Reçu le {format(new Date(rendezvous.updatedAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
             <div className="p-3 bg-muted rounded-md space-y-2">
                <p className="text-sm font-semibold">Détails du RDV proposé :</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(rendezvous.proposedDate), "PPP à HH:mm", { locale: fr })}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {rendezvous.location}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    Destinataire : {womanProfile.name}
                </div>
             </div>
             <div className="flex items-center gap-4">
                <Avatar>
                    <AvatarImage src={manProfile.photoUrl} />
                    <AvatarFallback>{manProfile.name[0]}</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                    <p className="font-medium">{manProfile.name}</p>
                    <p className="text-xs text-muted-foreground">{manProfile.email}</p>
                </div>
            </div>
        </div>
        <div>
            <p className="font-semibold text-foreground mb-2 text-sm">Capture d'écran (Preuve)</p>
            {rendezvous.paymentProofUrl ? (
                 <Dialog>
                    <DialogTrigger asChild>
                        <div className="relative aspect-[16/9] w-full max-w-[300px] cursor-pointer group">
                             <Image 
                                src={rendezvous.paymentProofUrl}
                                alt="Capture d'écran paiement"
                                fill
                                className="rounded-md object-cover border"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                                <p className="text-white text-xs font-bold">Agrandir</p>
                            </div>
                        </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader className="sr-only">
                          <DialogTitle>Preuve de paiement de {manProfile.name}</DialogTitle>
                        </DialogHeader>
                        <div className="relative h-[80vh] w-full">
                            <Image 
                                src={rendezvous.paymentProofUrl}
                                alt="Capture d'écran paiement grand format"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </DialogContent>
                 </Dialog>
            ) : (
                <div className="aspect-video w-full max-w-[300px] bg-muted rounded-md flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Aucune image</p>
                </div>
            )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t pt-4">
        <Button variant="destructive" size="sm" onClick={() => onValidate(rendezvous.id, false)} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
            Rejeter
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onValidate(rendezvous.id, true)} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Valider le paiement
        </Button>
      </CardFooter>
    </Card>
  );
}