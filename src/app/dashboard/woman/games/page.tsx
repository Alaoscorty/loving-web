'use client';

import { useMemo } from 'react';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import type { Game } from '@/types/game';
import { GameCard } from '@/components/game-card';
import { GameCardSkeleton } from '@/components/game-card-skeleton';

export default function WomanGamesPage() {
  const firestore = useFirestore();

  const gamesQuery = useMemo(() => {
    if (!firestore) return null;
    // Fetch the 20 most recent games
    return query(collection(firestore, 'games'), orderBy('createdAt', 'desc'), limit(20));
  }, [firestore]);

  const { data: games, loading, error } = useCollection<Game>(gamesQuery);

  return (
    <div className="flex-1 p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline text-woman-primary">Participer à un jeu</h1>
        <p className="text-muted-foreground mt-1">Découvrez les jeux créés par les hommes et tentez de gagner des points !</p>
      </header>

      {error && (
        <div className="text-center py-10 px-4 rounded-md border border-destructive bg-destructive/10 text-destructive-foreground">
          <h3 className="font-semibold">Une erreur est survenue</h3>
          <p className="text-sm">Impossible de charger les jeux pour le moment. Veuillez réessayer plus tard.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && Array.from({ length: 6 }).map((_, i) => <GameCardSkeleton key={i} />)}
        
        {!loading && games?.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

       {!loading && games?.length === 0 && (
         <div className="text-center col-span-full py-10 px-4 rounded-md border border-dashed">
            <h3 className="font-semibold">Aucun jeu disponible</h3>
            <p className="text-sm text-muted-foreground">Aucun jeu n'a été créé pour le moment. Revenez bientôt !</p>
        </div>
       )}
    </div>
  );
}
