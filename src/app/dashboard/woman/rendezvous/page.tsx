
'use client';

import { useMemo } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { useUser, useFirestore, useCollection } from '@/firebase';
import type { Rendezvous } from '@/types/rendezvous';
import { RendezvousProposalCard } from '@/components/rendezvous-proposal-card';
import { RendezvousProposalCardSkeleton } from '@/components/rendezvous-proposal-card-skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, Info, Wallet, CheckCircle2, Camera, QrCode } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { WOMAN_RDV_REWARD_XP } from '@/lib/firebase-actions';

export default function WomanRendezvousPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const rendezvousQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'rendezvous'),
      where('womanUid', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: rawRendezvous, loading, error } = useCollection<Rendezvous>(rendezvousQuery);

  // Tri côté client pour éviter l'erreur d'indexation composite
  const allRendezvous = useMemo(() => {
    if (!rawRendezvous) return [];
    return [...rawRendezvous].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [rawRendezvous]);

  const pendingCount = useMemo(() => allRendezvous.filter(r => r.status === 'pending').length || 0, [allRendezvous]);

  const renderRendezvousList = (rendezvousList: (Rendezvous & { id: string })[]) => {
    if (loading) {
      return Array.from({ length: 3 }).map((_, i) => <RendezvousProposalCardSkeleton key={i} />);
    }
    if (!rendezvousList || rendezvousList.length === 0) {
      return (
        <Alert>
          <CalendarClock className="h-4 w-4" />
          <AlertTitle>Aucune demande</AlertTitle>
          <AlertDescription>Il n'y a aucune demande de rendez-vous dans cette catégorie pour le moment.</AlertDescription>
        </Alert>
      );
    }
    return rendezvousList.map((rdv) => <RendezvousProposalCard key={rdv.id} rendezvous={rdv} />);
  };

  return (
    <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
      <header className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight font-headline text-woman-primary">Mes demandes de Rendez-vous</h1>
        <p className="text-muted-foreground text-lg">Gérez les invitations et gagnez des points pour chaque rencontre réelle.</p>
      </header>

      {/* BLOC D'INSTRUCTIONS POUR GAGNER DE L'ARGENT */}
      <Card className="rounded-[2.5rem] border-none bg-gradient-to-br from-woman-primary/10 via-card to-accent/10 shadow-2xl overflow-hidden relative border border-white/5">
          <CardContent className="p-8 md:p-12 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-woman-primary text-white rounded-2xl shadow-lg">
                      <Wallet className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-headline font-bold">Comment gagner {WOMAN_RDV_REWARD_XP} XP ?</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3 p-6 bg-background/40 rounded-3xl backdrop-blur-md border border-white/5">
                      <div className="w-10 h-10 rounded-full bg-woman-primary/20 text-woman-primary flex items-center justify-center font-bold">1</div>
                      <h4 className="font-bold text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Acceptez le RDV</h4>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">Discutez avec l'invité et acceptez la proposition de lieu et d'heure qui vous convient.</p>
                  </div>
                  <div className="space-y-3 p-6 bg-background/40 rounded-3xl backdrop-blur-md border border-white/5">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold">2</div>
                      <h4 className="font-bold text-sm flex items-center gap-2"><QrCode className="w-4 h-4" /> Validez sur place</h4>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">Lors de la rencontre, scannez son QR Code et prenez un selfie ensemble comme preuve de présence.</p>
                  </div>
                  <div className="space-y-3 p-6 bg-background/40 rounded-3xl backdrop-blur-md border border-white/5">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center font-bold">3</div>
                      <h4 className="font-bold text-sm flex items-center gap-2"><Camera className="w-4 h-4" /> Gagnez instantanément</h4>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">Envoyez le selfie. Vous recevez **{WOMAN_RDV_REWARD_XP} XP** dès l'envoi, convertibles en argent réel dans votre portefeuille.</p>
                  </div>
              </div>
              
              <Alert className="bg-primary/5 border-primary/20 rounded-2xl">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-xs italic">
                      Note : L'administrateur valide manuellement chaque selfie. En cas de fraude, vos points seront retirés et votre compte suspendu.
                  </AlertDescription>
              </Alert>
          </CardContent>
      </Card>

      {error && (
        <div className="text-center py-10 px-4 rounded-md border border-destructive bg-destructive/10 text-destructive-foreground">
          <h3 className="font-semibold">Une erreur est survenue</h3>
          <p className="text-sm">Impossible de charger les demandes pour le moment. Veuillez réessayer plus tard.</p>
        </div>
      )}

      {!error && (
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="bg-muted/50 p-1.5 h-14 rounded-2xl w-full sm:w-max flex gap-1.5 border border-white/5">
            <TabsTrigger value="pending" className="rounded-xl h-full data-[state=active]:bg-card px-6 font-bold">
              En attente
              {pendingCount > 0 && <Badge className="ml-2 bg-woman-primary">{pendingCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="accepted" className="rounded-xl h-full data-[state=active]:bg-card px-6 font-bold">Acceptés</TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl h-full data-[state=active]:bg-card px-6 font-bold">Historique</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="mt-6 space-y-4">
            {renderRendezvousList(allRendezvous.filter(r => r.status === 'pending'))}
          </TabsContent>
          <TabsContent value="accepted" className="mt-6 space-y-4">
            {renderRendezvousList(allRendezvous.filter(r => r.status === 'accepted' || r.status === 'completed'))}
          </TabsContent>
          <TabsContent value="history" className="mt-6 space-y-4">
            {renderRendezvousList(allRendezvous.filter(r => r.status === 'declined' || r.status === 'cancelled'))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
