'use client';

import { useMemo } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { useUser, useFirestore, useCollection } from '@/firebase';
import type { Rendezvous } from '@/types/rendezvous';
import { ManRendezvousCard } from '@/components/man-rendezvous-card';
import { ManRendezvousCardSkeleton } from '@/components/man-rendezvous-card-skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CalendarClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ManRendezvousPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const rendezvousQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'rendezvous'),
      where('manUid', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: rawRendezvous, loading, error } = useCollection<Rendezvous>(rendezvousQuery);

  // Tri côté client
  const allRendezvous = useMemo(() => {
    if (!rawRendezvous) return [];
    return [...rawRendezvous].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [rawRendezvous]);

  const pendingCount = useMemo(() => allRendezvous.filter(r => r.status === 'pending').length || 0, [allRendezvous]);

  const renderRendezvousList = (rendezvousList: (Rendezvous & { id: string })[]) => {
    if (loading) {
      return Array.from({ length: 3 }).map((_, i) => <ManRendezvousCardSkeleton key={i} />);
    }
    if (!rendezvousList || rendezvousList.length === 0) {
      return (
        <Alert>
          <CalendarClock className="h-4 w-4" />
          <AlertTitle>Aucune proposition</AlertTitle>
          <AlertDescription>Vous n'avez aucune proposition de rendez-vous dans cette catégorie pour le moment.</AlertDescription>
        </Alert>
      );
    }
    return rendezvousList.map((rdv) => <ManRendezvousCard key={rdv.id} rendezvous={rdv} />);
  };

  return (
    <div className="flex-1 p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline text-man-primary">Mes Propositions de RDV</h1>
        <p className="text-muted-foreground mt-1">Suivez le statut de vos propositions de rendez-vous envoyées.</p>
      </header>

      {error && (
        <div className="text-center py-10 px-4 rounded-md border border-destructive bg-destructive/10 text-destructive-foreground">
          <h3 className="font-semibold">Une erreur est survenue</h3>
          <p className="text-sm">Impossible de charger vos propositions pour le moment. Veuillez réessayer plus tard.</p>
        </div>
      )}

      {!error && (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="pending">
              En attente
              {pendingCount > 0 && <Badge className="ml-2">{pendingCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="accepted">Acceptés</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-6 space-y-4">
            {renderRendezvousList(allRendezvous)}
          </TabsContent>
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
