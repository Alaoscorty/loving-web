
'use client';

import { useMemo } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { WomanProfileCard } from '@/components/woman-profile-card';
import { WomanProfileCardSkeleton } from '@/components/woman-profile-card-skeleton';
import type { UserProfile } from '@/types/user';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Heart } from 'lucide-react';

export default function ManFavoritesPage() {
  const firestore = useFirestore();
  const { userProfile, loading: loadingUser } = useUser();

  const favoritesQuery = useMemo(() => {
    if (!firestore || !userProfile?.favorites || userProfile.favorites.length === 0) {
      return null;
    }
    // Firestore 'in' queries are limited to 30 items. We slice to prevent an error.
    return query(collection(firestore, 'users'), where('__name__', 'in', userProfile.favorites.slice(0, 30)));
  }, [firestore, userProfile?.favorites]);

  const { data: profiles, loading: loadingProfiles, error } = useCollection<UserProfile>(favoritesQuery);
  
  const isLoading = loadingUser || (userProfile?.favorites && userProfile.favorites.length > 0 && loadingProfiles);

  if (isLoading) {
    return (
      <div className="flex-1 p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight font-headline text-man-primary">Mes Favoris</h1>
          <p className="text-muted-foreground mt-1">Retrouvez ici les profils que vous avez mis de côté.</p>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <WomanProfileCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline text-man-primary">Mes Favoris</h1>
        <p className="text-muted-foreground mt-1">Retrouvez ici les profils que vous avez mis de côté.</p>
      </header>
      
      {error && (
        <div className="text-center py-10 px-4 rounded-md border border-destructive bg-destructive/10 text-destructive-foreground">
          <h3 className="font-semibold">Une erreur est survenue</h3>
          <p className="text-sm">Impossible de charger vos favoris pour le moment. Veuillez réessayer plus tard.</p>
        </div>
      )}

      {!error && (!profiles || profiles.length === 0) && (
        <Alert>
            <Heart className="h-4 w-4" />
            <AlertTitle>Aucun favori</AlertTitle>
            <AlertDescription>
                Vous n'avez encore ajouté aucun profil à vos favoris. Parcourez les profils et cliquez sur le cœur pour les ajouter ici.
            </AlertDescription>
        </Alert>
      )}

      {!error && profiles && profiles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {profiles.map((profile) => (
                <WomanProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
      )}
    </div>
  );
}
