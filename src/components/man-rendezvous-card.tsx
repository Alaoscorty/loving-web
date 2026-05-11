
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calendar, Check, MapPin, MessageSquare, X, Loader2, Ban, MessageCircle, QrCode, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import type { Rendezvous } from '@/types/rendezvous';
import type { UserProfile } from '@/types/user';
import { useToast } from '@/hooks/use-toast';
import { ManRendezvousCardSkeleton } from './man-rendezvous-card-skeleton';
import { cancelRendezvous } from '@/lib/firebase-actions';
import { ReviewDialog } from './review-dialog';


type ManRendezvousCardProps = {
  rendezvous: Rendezvous & { id: string };
};

const statusConfig = {
    pending: { label: 'En attente', color: 'bg-yellow-500', icon: <Loader2 className="h-4 w-4 animate-spin" /> },
    accepted: { label: 'Accepté', color: 'bg-green-500', icon: <Check className="h-4 w-4" /> },
    declined: { label: 'Refusé', color: 'bg-red-500', icon: <X className="h-4 w-4" /> },
    completed: { label: 'Terminé', color: 'bg-blue-500', icon: <Check className="h-4 w-4" /> },
    cancelled: { label: 'Annulé', color: 'bg-gray-500', icon: <X className="h-4 w-4" /> },
}

export function ManRendezvousCard({ rendezvous }: ManRendezvousCardProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const womanProfileRef = doc(firestore, 'users', rendezvous.womanUid);
  const { data: womanProfile, loading: loadingWoman } = useDoc<UserProfile>(womanProfileRef);

  const handleCancel = async () => {
    if (!firestore) return;
    setIsCancelling(true);
    try {
        await cancelRendezvous({ firestore, rendezvousId: rendezvous.id });
        toast({
            title: 'Rendez-vous annulé',
            description: `Votre proposition a été annulée.`
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Erreur',
            description: error.message || 'Impossible d\'annuler le rendez-vous.'
        });
    } finally {
        setIsCancelling(false);
    }
  }

  if (loadingWoman) {
    return <ManRendezvousCardSkeleton />;
  }

  if (!womanProfile) {
    return (
        <Alert variant="destructive">
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>Impossible de charger le profil de la destinataire.</AlertDescription>
        </Alert>
    )
  }

  const currentStatus = statusConfig[rendezvous.status];
  const isAccepted = rendezvous.status === 'accepted' || rendezvous.status === 'completed';
  const isCompleted = rendezvous.status === 'completed';
  const canBeCancelled = rendezvous.status === 'pending' || rendezvous.status === 'accepted';
  const showQrButton = rendezvous.status === 'accepted' && !rendezvous.qrCodeScanned;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${rendezvous.id}&qzone=1`;

  return (
    <Card className="rounded-[2rem] border-none shadow-lg overflow-hidden bg-card/40 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-start gap-4">
        <Avatar className="w-12 h-12 border-2 border-primary/20">
          <AvatarImage src={womanProfile.photoUrl} alt={womanProfile.name} />
          <AvatarFallback>{womanProfile.name?.[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-lg font-headline">Proposition à {womanProfile.name}</CardTitle>
          <CardDescription className="text-xs">
            Envoyée le {format(new Date(rendezvous.createdAt), "d MMMM yyyy", { locale: fr })}
          </CardDescription>
        </div>
        <Badge className={`${currentStatus.color} text-white rounded-full px-4 py-1 text-[10px] font-bold uppercase`}>
            {currentStatus.label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 text-sm p-3 bg-muted/20 rounded-2xl">
                <Calendar className="w-4 h-4 mt-0.5 text-primary" />
                <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Date & Heure</p>
                    <p className="font-semibold">{format(new Date(rendezvous.proposedDate), "EEEE d MMM à HH:mm", { locale: fr })}</p>
                </div>
            </div>
            <div className="flex items-start gap-3 text-sm p-3 bg-muted/20 rounded-2xl">
                <MapPin className="w-4 h-4 mt-0.5 text-primary" />
                <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Lieu</p>
                    <p className="font-semibold">{rendezvous.location}</p>
                </div>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t p-4 bg-muted/5">
          {isCompleted && (
              <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="rounded-xl border-yellow-500/20 text-yellow-600 hover:bg-yellow-500/10">
                        <Star className="mr-2 h-4 w-4 fill-yellow-500" />
                        Donner mon avis
                    </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2.5rem] sm:max-w-md">
                    <ReviewDialog 
                        rendezvousId={rendezvous.id}
                        targetUid={womanProfile.id}
                        targetName={womanProfile.name}
                        onComplete={() => setIsReviewOpen(false)}
                    />
                </DialogContent>
              </Dialog>
          )}
          {showQrButton && (
             <Dialog>
                <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl">
                    <QrCode className="mr-2 h-4 w-4" />
                    QR Code
                </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xs rounded-[2rem]">
                <DialogHeader>
                    <DialogTitle>Validation RDV</DialogTitle>
                    <DialogDescription>
                        Montrez ce code à {womanProfile.name}.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-center p-4 bg-white rounded-2xl">
                    <Image src={qrCodeUrl} alt={`QR Code`} width={200} height={200} />
                </div>
                </DialogContent>
            </Dialog>
          )}
          {isAccepted && (
            <Button className="rounded-xl bg-primary shadow-md" asChild>
                <Link href="/dashboard/messages">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Chat
                </Link>
            </Button>
          )}
          {canBeCancelled && (
            <Button variant="ghost" className="rounded-xl text-destructive hover:bg-destructive/10" onClick={handleCancel} disabled={isCancelling}>
                {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
                Annuler
            </Button>
          )}
      </CardFooter>
    </Card>
  );
}
