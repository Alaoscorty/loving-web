
'use client';

import { useMemo, useState } from 'react';
import { collection, query, where, limit } from 'firebase/firestore';
import { useFirestore, useCollection, useUser } from '@/firebase';
import type { UserProfile } from '@/types/user';
import { SwipeCard } from '@/components/swipe/swipe-card';
import { Loader2, Heart, X, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { recordSwipe } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function DiscoverPage() {
  const firestore = useFirestore();
  const { userProfile, user } = useUser();
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch profiles that haven't been swiped yet (ideally)
  // For simplicity, we just fetch 30 women.
  const womenQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('role', '==', 'woman'), limit(30));
  }, [firestore]);

  const { data: profiles, loading } = useCollection<UserProfile>(womenQuery);

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!user || !firestore || !profiles || !profiles[currentIndex]) return;
    
    const targetProfile = profiles[currentIndex];
    try {
        await recordSwipe(firestore, user.uid, targetProfile.id, direction);
        setCurrentIndex(prev => prev + 1);
        
        if (direction === 'right') {
            toast({
                title: "Liké !",
                description: `Vous avez liké ${targetProfile.name}.`,
            });
        }
    } catch (e: any) {
        toast({
            variant: 'destructive',
            title: 'Limite atteinte',
            description: e.message,
        });
    }
  };

  if (loading) {
    return (
        <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-man-primary" />
        </div>
    );
  }

  const currentProfile = profiles ? profiles[currentIndex] : null;
  const swipesLeft = userProfile?.swipesRemaining ?? 0;

  return (
    <div className="flex-1 flex flex-col items-center p-4 md:p-8 bg-background min-h-full">
      <header className="sticky top-0 z-50 flex items-center justify-center w-full py-4 mb-4">
         <Badge variant="secondary" className="h-10 px-4 rounded-full bg-card/80 backdrop-blur-md shadow-lg flex gap-2 items-center border-man-primary/20">
            <Zap className="w-4 h-4 text-man-primary fill-man-primary" />
            <span className="font-bold">{userProfile?.isVerified ? 'Swipes illimités' : `${swipesLeft} swipes restants`}</span>
         </Badge>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[450px] gap-8">
        {currentProfile ? (
          <>
            <div className="relative w-full aspect-[3/4] animate-in zoom-in-95 duration-500">
               <SwipeCard profile={currentProfile} />
            </div>
            
            <div className="flex justify-center gap-8 pb-8">
                <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-20 h-20 rounded-full border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-xl hover:scale-110 active:scale-95"
                    onClick={() => handleSwipe('left')}
                >
                    <X className="w-10 h-10" />
                </Button>
                <Button 
                    size="lg" 
                    className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 text-white transition-all shadow-xl shadow-green-500/20 hover:scale-110 active:scale-95"
                    onClick={() => handleSwipe('right')}
                >
                    <Heart className="w-10 h-10 fill-current" />
                </Button>
            </div>
          </>
        ) : (
          <div className="text-center space-y-6 animate-in fade-in duration-700 py-20">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-12 h-12 text-primary" />
              </div>
              <div className="space-y-2">
                  <h2 className="text-3xl font-bold font-headline">Plus de profils ?</h2>
                  <p className="text-muted-foreground max-w-xs mx-auto">Vous avez parcouru tous les profils disponibles pour aujourd'hui. Revenez demain pour de nouvelles rencontres !</p>
              </div>
              <Button variant="outline" className="rounded-full h-12 px-8" onClick={() => setCurrentIndex(0)}>
                  Recommencer le tour
              </Button>
          </div>
        )}
      </div>
    </div>
  );
}
