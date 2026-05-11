
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calendar, Check, MapPin, MessageSquare, X, Loader2, MessageCircle, Camera, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { RendezvousConfirmationFlow } from '@/components/rendezvous-confirmation-flow';

import type { Rendezvous } from '@/types/rendezvous';
import type { UserProfile } from '@/types/user';
import { updateRendezvousStatus } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import { RendezvousProposalCardSkeleton } from './rendezvous-proposal-card-skeleton';
import { ReviewDialog } from './review-dialog';

type RendezvousProposalCardProps = {
  rendezvous: Rendezvous & { id: string };
};

const statusConfig = {
    pending: { label: 'En attente', color: 'bg-yellow-500', icon: <Loader2 className="h-4 w-4 animate-spin" /> },
    accepted: { label: 'Accepté', color: 'bg-green-500', icon: <Check className="h-4 w-4" /> },
    declined: { label: 'Refusé', color: 'bg-red-500', icon: <X className="h-4 w-4" /> },
    completed: { label: 'Terminé', color: 'bg-blue-500', icon: <Check className="h-4 w-4" /> },
    cancelled: { label: 'Annulé', color: 'bg-gray-500', icon: <X className="h-4 w-4" /> },
}

export function RendezvousProposalCard({ rendezvous }: RendezvousProposalCardProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<'accept' | 'decline' | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const manProfileRef = doc(firestore, 'users', rendezvous.manUid);
  const { data: manProfile, loading: loadingMan } = useDoc<UserProfile>(manProfileRef);

  const handleUpdateStatus = async (status: 'accepted' | 'declined') => {
    setIsLoading(status);
    try {
        await updateRendezvousStatus({ firestore, rendezvousId: rendezvous.id, status });
        toast({
            title: `Rendez-vous ${status === 'accepted' ? 'accepté' : 'refusé'}`,
            description: `La proposition a été mise à jour.`
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Erreur',
            description: error.message || 'Impossible de mettre à jour le statut.'
        });
    } finally {
        setIsLoading(null);
    }
  };

  if (loadingMan) {
    return <RendezvousProposalCardSkeleton />;
  }

  if (!manProfile) {
    return (
        <Alert variant="destructive">
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>Impossible de charger le profil de l'expéditeur.</AlertDescription>
        </Alert>
    )
  }

  const currentStatus = statusConfig[rendezvous.status];
  const isChatAvailable = rendezvous.status === 'accepted' || rendezvous.status === 'completed';
  const isCompleted = rendezvous.status === 'completed';
  const canConfirmRdv = rendezvous.status === 'accepted';

  return (
    <Card className="rounded-[2rem] border-none shadow-lg overflow-hidden bg-card/40 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-start gap-4">
        <Avatar className="w-12 h-12 border-2 border-primary/20">
          <AvatarImage src={manProfile.photoUrl} alt={manProfile.name} />
          <AvatarFallback>{manProfile.name?.[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-lg font-headline">Proposition de {manProfile.name}</CardTitle>
          <CardDescription className="text-xs">
            Reçue le {format(new Date(rendezvous.createdAt), "d MMMM yyyy", { locale: fr })}
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
        {rendezvous.notes && (
             <div className="p-4 bg-primary/5 rounded-2xl italic text-sm border border-primary/10">
                "{rendezvous.notes}"
            </div>
        )}
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
                        targetUid={manProfile.id}
                        targetName={manProfile.name}
                        onComplete={() => setIsReviewOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        )}
        {rendezvous.status === 'pending' && (
            <>
                <Button variant="ghost" className="rounded-xl text-destructive hover:bg-destructive/10" onClick={() => handleUpdateStatus('declined')} disabled={!!isLoading}>
                    {isLoading === 'decline' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                    Décliner
                </Button>
                <Button className="rounded-xl bg-primary shadow-md px-8" onClick={() => handleUpdateStatus('accepted')} disabled={!!isLoading}>
                    {isLoading === 'accept' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Accepter
                </Button>
            </>
        )}
        {canConfirmRdv && (
             <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
                <DialogTrigger asChild>
                    <Button variant="secondary" className="rounded-xl px-6">
                        <Camera className="mr-2 h-4 w-4" />
                        Valider RDV
                    </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2.5rem]">
                    <RendezvousConfirmationFlow rendezvous={rendezvous} onFlowComplete={() => setIsConfirming(false)} />
                </DialogContent>
            </Dialog>
        )}
        {isChatAvailable && (
            <Button className="rounded-xl bg-primary" asChild>
                <Link href="/dashboard/messages">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Chat
                </Link>
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
