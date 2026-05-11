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
import { Calendar, Check, MapPin, User, Users, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import type { Rendezvous } from '@/types/rendezvous';
import type { UserProfile } from '@/types/user';
import { AdminValidationCardSkeleton } from './admin-validation-card-skeleton';

type Props = {
  rendezvous: Rendezvous & { id: string };
  onValidate: (rendezvousId: string, approved: boolean) => void;
  isProcessing: boolean;
};

export function AdminValidationCard({ rendezvous, onValidate, isProcessing }: Props) {
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
            <AlertDescription>Impossible de charger le profil d'un ou des deux participants.</AlertDescription>
        </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <Users />
            <CardTitle>Validation pour {manProfile.name} & {womanProfile.name}</CardTitle>
        </div>
        <CardDescription>
          Rendez-vous proposé le {format(new Date(rendezvous.createdAt), "d MMMM yyyy", { locale: fr })}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
            <div className="flex items-start gap-3 text-sm">
                <Calendar className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                    <p className="font-semibold text-foreground">Date du RDV</p>
                    <p className="text-muted-foreground">{format(new Date(rendezvous.proposedDate), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}</p>
                </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                    <p className="font-semibold text-foreground">Lieu</p>
                    <p className="text-muted-foreground">{rendezvous.location}</p>
                </div>
            </div>
             <div className="flex items-center gap-4">
                <Avatar>
                    <AvatarImage src={manProfile.photoUrl} />
                    <AvatarFallback>{manProfile.name[0]}</AvatarFallback>
                </Avatar>
                <span>{manProfile.name}</span>
            </div>
            <div className="flex items-center gap-4">
                 <Avatar>
                    <AvatarImage src={womanProfile.photoUrl} />
                    <AvatarFallback>{womanProfile.name[0]}</AvatarFallback>
                </Avatar>
                <span>{womanProfile.name}</span>
            </div>
        </div>
        <div>
            <p className="font-semibold text-foreground mb-2">Selfie de preuve</p>
            {rendezvous.selfieProofUrl ? (
                 <Dialog>
                    <DialogTrigger asChild>
                        <Image 
                            src={rendezvous.selfieProofUrl}
                            alt="Selfie de preuve"
                            width={250}
                            height={250}
                            className="rounded-md object-cover cursor-pointer aspect-square"
                        />
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader className="sr-only">
                          <DialogTitle>Selfie de preuve - {manProfile.name} & {womanProfile.name}</DialogTitle>
                        </DialogHeader>
                        <Image 
                            src={rendezvous.selfieProofUrl}
                            alt="Selfie de preuve en grand"
                            width={800}
                            height={800}
                            className="rounded-md object-contain"
                        />
                    </DialogContent>
                 </Dialog>
            ) : (
                <div className="aspect-square w-[250px] bg-muted rounded-md flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Aucune image</p>
                </div>
            )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="destructive" onClick={() => onValidate(rendezvous.id, false)} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
            Rejeter
        </Button>
        <Button variant="secondary" onClick={() => onValidate(rendezvous.id, true)} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Approuver
        </Button>
      </CardFooter>
    </Card>
  );
}