
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, MapPin, Briefcase, Users, Heart, Sparkles, Star, CheckCircle2, Info, MessageSquare, Zap, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ProposeRendezvousDialog } from '@/components/propose-rendezvous-dialog';
import { SuperLikeDialog } from '@/components/super-like-dialog';
import { useState, Suspense, useMemo } from 'react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { isAfter, subMonths } from 'date-fns';

export default function WomanProfileDetailPage() {
  const { userId } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { userProfile: manProfile } = useUser();
  const [isRdvOpen, setIsRdvOpen] = useState(false);
  const [isSuperLikeOpen, setIsSuperLikeOpen] = useState(false);

  const profileRef = doc(firestore, 'users', userId as string);
  const { data: profile, loading, error } = useDoc<UserProfile>(profileRef);

  // Filtrer les photos de moins de 5 mois
  const activePhotos = useMemo(() => {
    if (!profile?.secondaryPhotos) return [];
    const fiveMonthsAgo = subMonths(new Date(), 5);
    return profile.secondaryPhotos.filter(photo => {
        if (!photo.createdAt) return true;
        return isAfter(new Date(photo.createdAt), fiveMonthsAgo);
    });
  }, [profile?.secondaryPhotos]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-32 rounded-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Skeleton className="lg:col-span-1 h-[450px] rounded-[3rem]" />
           <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-16 w-1/2" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-40 w-full rounded-3xl" />
           </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return <div className="p-8 text-center py-20 font-headline text-xl">Profil non trouvé.</div>;
  }

  const womanPlaceholders = PlaceHolderImages.filter(p => p.id.startsWith('woman-profile-'));
  const photo = profile.photoUrl || womanPlaceholders[Math.floor(Math.random() * womanPlaceholders.length)].imageUrl;

  return (
    <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full animate-in fade-in duration-500">
      <Button variant="ghost" className="mb-6 gap-2 hover:bg-transparent pl-0 text-muted-foreground hover:text-primary" onClick={() => router.back()}>
        <ChevronLeft className="w-5 h-5" /> Retour
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column */}
        <div className="space-y-6">
          <div className="relative aspect-[3/4] w-full rounded-[3rem] overflow-hidden shadow-2xl border-4 border-card group">
            <Image 
                src={photo} 
                alt={profile.name} 
                fill 
                priority
                className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
                <Badge className="bg-man-primary/90 text-white border-none px-5 py-2 text-sm shadow-xl backdrop-blur-md rounded-full">
                    <Sparkles className="w-4 h-4 mr-2" /> {profile.level || 'Bronze'}
                </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
              <Dialog open={isRdvOpen} onOpenChange={setIsRdvOpen}>
                <DialogTrigger asChild>
                    <Button className="w-full h-16 text-lg rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90" disabled={manProfile?.role !== 'man'}>
                        <Heart className="mr-2 h-6 w-6 fill-current" /> Proposer un RDV
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-[2.5rem]">
                    <ProposeRendezvousDialog 
                        womanProfile={profile}
                        onProposalSent={() => setIsRdvOpen(false)}
                    />
                </DialogContent>
              </Dialog>

              <Dialog open={isSuperLikeOpen} onOpenChange={setIsSuperLikeOpen}>
                <DialogTrigger asChild>
                    <Button variant="secondary" className="w-full h-14 rounded-2xl border-man-primary/20" disabled={manProfile?.role !== 'man'}>
                        <Zap className="mr-2 h-5 w-5 text-man-primary fill-man-primary" /> Super Like IA
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-[2.5rem]">
                    <SuperLikeDialog 
                        womanProfile={profile}
                        onComplete={() => setIsSuperLikeOpen(false)}
                    />
                </DialogContent>
              </Dialog>
          </div>

          <Card className="bg-card/40 border-none backdrop-blur-sm rounded-[2rem]">
            <CardContent className="p-8 space-y-5">
               <div className="flex items-center gap-4 text-sm">
                  <div className="w-10 h-10 rounded-full bg-man-primary/10 flex items-center justify-center text-man-primary">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Localisation</p>
                    <p className="font-semibold">{profile.city || 'Non renseigné'}</p>
                  </div>
               </div>
               {profile.profession && (
                   <div className="flex items-center gap-4 text-sm">
                        <div className="w-10 h-10 rounded-full bg-man-primary/10 flex items-center justify-center text-man-primary">
                            <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Profession</p>
                            <p className="font-semibold">{profile.profession}</p>
                        </div>
                   </div>
               )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-10">
            <header className="space-y-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-6xl font-bold font-headline tracking-tighter">{profile.name}</h1>
                    {profile.isVerified && <CheckCircle2 className="w-10 h-10 text-primary" />}
                </div>
                <div className="flex flex-wrap gap-4 text-muted-foreground font-medium">
                    <p className="flex items-center gap-2"><Calendar className="w-5 h-5" /> Membre depuis {new Date(profile.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                    {profile.rating && <p className="flex items-center gap-2 text-yellow-500"><Star className="w-5 h-5 fill-current" /> {profile.rating.toFixed(1)}/5</p>}
                </div>
            </header>

            <section className="space-y-6">
                <h3 className="text-2xl font-bold font-headline flex items-center gap-3">
                    <Info className="text-man-primary w-6 h-6" /> À propos
                </h3>
                <div className="text-lg leading-relaxed text-foreground/80 whitespace-pre-wrap bg-card/20 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-sm italic">
                    "{profile.bio || "Cette utilisatrice n'a pas encore rédigé sa biographie."}"
                </div>
            </section>

            {/* Galerie Filtrée */}
            {activePhotos.length > 0 && (
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold font-headline flex items-center gap-3">
                            <ImageIcon className="text-man-primary w-6 h-6" /> Galerie Photos
                        </h3>
                        <Badge variant="outline" className="text-[10px] font-bold opacity-60"><Clock className="w-3 h-3 mr-1" /> Max 5 mois</Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {activePhotos.map((photo, i) => (
                            <div key={i} className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-lg border border-white/5">
                                <Image src={photo.url} alt={`Photo ${i}`} fill className="object-cover" />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {profile.hobbies && profile.hobbies.length > 0 && (
                <section className="space-y-4">
                    <h3 className="text-2xl font-bold font-headline flex items-center gap-3">
                        <Sparkles className="text-man-primary w-6 h-6" /> Centres d'intérêt
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {profile.hobbies.map((hobby, i) => (
                            <Badge key={i} variant="secondary" className="px-6 py-3 rounded-full bg-card hover:bg-man-primary/10 transition-colors text-sm font-semibold border-none shadow-sm">
                                {hobby}
                            </Badge>
                        ))}
                    </div>
                </section>
            )}

            <footer className="pt-12 border-t border-white/5 flex flex-col md:flex-row gap-8 md:items-center justify-between">
                <div className="flex items-center gap-5">
                    <Avatar className="h-20 w-20 border-4 border-primary/20 p-1">
                        <AvatarImage src={photo} className="rounded-full object-cover" />
                        <AvatarFallback className="text-2xl">{profile.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-bold text-2xl tracking-tight">Inspiré par {profile.name} ?</p>
                        <p className="text-muted-foreground font-medium">Faites le premier pas avec élégance.</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-14 px-8 rounded-full border-man-primary text-man-primary hover:bg-man-primary/5" onClick={() => setIsSuperLikeOpen(true)}>
                        Super Like IA
                    </Button>
                </div>
            </footer>
        </div>
      </div>
    </div>
  );
}
