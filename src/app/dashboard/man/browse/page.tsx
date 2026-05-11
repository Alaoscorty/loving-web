
'use client';

import { useMemo, useState } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { WomanProfileCard } from '@/components/woman-profile-card';
import { WomanProfileCardSkeleton } from '@/components/woman-profile-card-skeleton';
import type { UserProfile } from '@/types/user';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function BrowsePage() {
  const firestore = useFirestore();
  const { userProfile } = useUser();
  const [searchCity, setSearchCity] = useState('');
  const [sortBy, setSortBy] = useState('rating');

  const womenQuery = useMemo(() => {
    if (!firestore || !userProfile) return null;
    return query(collection(firestore, 'users'), where('role', '==', 'woman'));
  }, [firestore, userProfile]);

  const { data: allProfiles, loading } = useCollection<UserProfile>(womenQuery);

  const filteredProfiles = useMemo(() => {
    if (!allProfiles) return [];
    
    return allProfiles
      .filter(p => !searchCity || p.city?.toLowerCase().includes(searchCity.toLowerCase()))
      .sort((a, b) => {
          if (a.isVerified && !b.isVerified) return -1;
          if (!a.isVerified && b.isVerified) return 1;

          if (sortBy === 'rating') {
              const ratingA = a.rating || 0;
              const ratingB = b.rating || 0;
              if (ratingA !== ratingB) return ratingB - ratingA;
          }
          
          if (sortBy === 'points') {
              return (b.points || 0) - (a.points || 0);
          }

          return 0;
      });
  }, [allProfiles, searchCity, sortBy]);

  return (
    <div className="flex-1 p-3 md:p-8 max-w-[1600px] mx-auto w-full">
      <header className="mb-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2">
                <Badge variant="outline" className="text-man-primary border-man-primary/20 bg-man-primary/5 px-4 py-1 rounded-full uppercase tracking-tighter font-bold text-[10px]">
                    Exploration Exclusive
                </Badge>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tighter font-headline leading-tight">
                    Découvrir les <span className="text-primary italic">profils</span>
                </h1>
                <p className="text-muted-foreground text-sm max-w-md font-medium">
                    Les membres certifiés et les mieux notés apparaissent en priorité.
                </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative flex-1 sm:w-[250px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Ville..." 
                        className="pl-10 h-12 bg-card/50 border-white/5 shadow-xl rounded-xl focus-visible:ring-man-primary backdrop-blur-md"
                        value={searchCity}
                        onChange={(e) => setSearchCity(e.target.value)}
                    />
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-12 w-full sm:w-[180px] rounded-xl bg-card/50 border-white/5 shadow-xl backdrop-blur-md font-bold text-xs">
                        <SelectValue placeholder="Trier par" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="rating" className="font-bold">⭐ Meilleures Notes</SelectItem>
                        <SelectItem value="points" className="font-bold">💎 Plus de Points</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-6">
        {loading && Array.from({ length: 12 }).map((_, i) => <WomanProfileCardSkeleton key={i} />)}
        
        {!loading && filteredProfiles.map((profile) => (
          <div key={profile.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <WomanProfileCard profile={profile} />
          </div>
        ))}
      </div>

      {!loading && filteredProfiles.length === 0 && (
          <div className="py-20 text-center bg-muted/10 rounded-[3rem] border-2 border-dashed">
              <p className="text-muted-foreground font-medium">Aucun profil ne correspond à vos critères.</p>
          </div>
      )}
    </div>
  );
}
