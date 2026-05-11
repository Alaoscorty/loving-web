
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserProfile } from '@/types/user';
import { Heart, Loader2, MapPin, Sparkles, Verified, MessageCircle, Phone, Lock, Zap, CreditCard, Banknote } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ProposeRendezvousDialog } from './propose-rendezvous-dialog';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { cn, isUserOnline } from '@/lib/utils';
import { toggleFavorite, getOrCreateConversation, unlockWhatsAppNumber, WHATSAPP_UNLOCK_FEE_FCFA, WHATSAPP_UNLOCK_FEE_XP } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { collection, query, where } from 'firebase/firestore';

type WomanProfileCardProps = {
  profile: UserProfile & { id: string };
};

export function WomanProfileCard({ profile }: WomanProfileCardProps) {
  const { user, userProfile: manProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isRdvOpen, setIsRdvOpen] = useState(false);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [isUnlockOpen, setIsUnlockOpen] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  
  const [isFavorite, setIsFavorite] = useState(manProfile?.favorites?.includes(profile.id) || false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  
  useEffect(() => {
    setIsFavorite(manProfile?.favorites?.includes(profile.id) || false);
  }, [manProfile, profile.id]);

  const rdvQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'rendezvous'),
        where('manUid', '==', user.uid),
        where('womanUid', '==', profile.id)
    );
  }, [firestore, user, profile.id]);

  const { data: rendezvous } = useCollection<any>(rdvQuery);
  
  const hasValidRendezvous = useMemo(() => {
      return rendezvous?.some(r => ['accepted', 'completed'].includes(r.status));
  }, [rendezvous]);

  const isNumberUnlocked = useMemo(() => {
      return manProfile?.unlockedNumbers?.includes(profile.id);
  }, [manProfile, profile.id]);

  const womanPlaceholders = PlaceHolderImages.filter(p => p.id.startsWith('woman-profile-'));
  const photo = profile.photoUrl || womanPlaceholders[Math.floor(Math.random() * womanPlaceholders.length)].imageUrl;
  const online = isUserOnline(profile.lastActive);
  const isUnlockedPack = manProfile?.unlockedContacts?.includes(profile.id);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !firestore || manProfile?.role !== 'man') return;
    setIsTogglingFavorite(true);
    try {
        const newFavoriteStatus = await toggleFavorite({ firestore, manUid: user.uid, womanUid: profile.id });
        setIsFavorite(newFavoriteStatus);
        toast({ title: newFavoriteStatus ? 'Ajouté aux favoris' : 'Retiré des favoris' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
        setIsTogglingFavorite(false);
    }
  };

  const handleDirectChat = async (e: React.MouseEvent) => {
      e.preventDefault();
      if (!user || !firestore) return;
      setIsOpeningChat(true);
      try {
          await getOrCreateConversation(firestore, user.uid, profile.id);
          router.push('/dashboard/messages');
      } catch (e) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de lancer le chat.' });
      } finally {
          setIsOpeningChat(false);
      }
  }

  const handleUnlockNumber = async (method: 'xp' | 'cash') => {
      if (!user || !firestore) return;
      setIsUnlocking(true);
      try {
          await unlockWhatsAppNumber({ firestore, userId: user.uid, targetUid: profile.id, paymentMethod: method });
          toast({ title: 'Numéro débloqué ! 📱' });
          setIsUnlockOpen(false);
      } catch (e: any) {
          toast({ variant: 'destructive', title: 'Erreur', description: e.message });
      } finally {
          setIsUnlocking(false);
      }
  }

  return (
    <Card className={cn(
        "flex flex-col overflow-hidden rounded-[1.5rem] md:rounded-[2rem] border-none shadow-lg hover:shadow-2xl transition-all duration-500 group bg-card/40 backdrop-blur-md border border-white/5",
        profile.isVerified && "ring-1 ring-blue-500/30"
    )}>
      <CardHeader className="p-0 relative">
        <Link href={`/dashboard/man/browse/${profile.id}`} className="block overflow-hidden aspect-[4/5] relative">
          <Image
            src={photo}
            alt={profile.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-1000"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80" />
        </Link>
        
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
           <Badge className="bg-man-primary/80 backdrop-blur-md text-white border-none shadow-lg px-2 py-0.5 text-[8px] font-bold">
              <Sparkles className="w-2.5 h-2.5 mr-1" /> {profile.level || 'Bronze'}
           </Badge>
           {profile.isVerified && (
               <Badge className="bg-blue-500/80 backdrop-blur-md text-white border-none shadow-lg px-2 py-0.5 text-[8px] font-bold flex items-center gap-1">
                   <Verified className="w-2.5 h-2.5 fill-white" /> CERTIFIÉ
               </Badge>
           )}
           {online && (
               <div className="flex items-center gap-1 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-full w-fit">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[8px] font-bold text-white uppercase tracking-wider">En ligne</span>
               </div>
           )}
        </div>

        {manProfile?.role === 'man' && (
          <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
            <button 
                onClick={handleToggleFavorite}
                disabled={isTogglingFavorite}
                className="p-2 rounded-full bg-black/30 backdrop-blur-md hover:bg-white/20 transition-all border border-white/10"
            >
                {isTogglingFavorite 
                    ? <Loader2 className="w-3 h-3 animate-spin text-white" />
                    : <Heart className={cn("w-3.5 h-3.5 transition-colors", isFavorite ? "fill-red-500 text-red-500" : "text-white")} />
                }
            </button>
          </div>
        )}

        <div className="absolute bottom-2 left-3 right-3 text-white">
            <CardTitle className="font-headline text-lg md:text-xl tracking-tighter mb-0.5 flex items-center gap-1.5">
                {profile.name}
                {profile.isVerified && <Verified className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />}
            </CardTitle>
            <div className="flex items-center gap-1 text-white/80 text-[9px] font-bold uppercase tracking-widest">
              <MapPin className="w-2.5 h-2.5 text-man-primary" />
              {profile.city}
            </div>
        </div>

        <div className="absolute top-1/2 right-2 -translate-y-1/2 flex flex-col items-center gap-0.5 z-10">
            <div className="p-1.5 rounded-xl bg-primary/20 backdrop-blur-xl border border-primary/30 flex flex-col items-center shadow-lg">
                <Heart className="w-3.5 h-3.5 text-primary fill-primary animate-pulse" />
                <span className="text-[10px] font-black text-white">{profile.likesCount || 0}</span>
            </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-3 px-3 space-y-3">
        <p className="text-[10px] md:text-xs text-foreground/70 line-clamp-2 leading-relaxed italic border-l-2 border-man-primary/30 pl-2">
          "{profile.bio || "Découvrez mon univers..."}"
        </p>

        <div className="p-2 bg-muted/20 rounded-xl border border-white/5">
            {isNumberUnlocked || hasValidRendezvous ? (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-green-500 font-bold">
                        <Phone className="w-3 h-3" />
                        <span className="text-[11px] font-mono">{profile.whatsappNumber || 'Privé'}</span>
                    </div>
                    <Badge className="bg-green-500 text-[8px] h-4">DÉBLOQUÉ</Badge>
                </div>
            ) : (
                <button 
                    onClick={() => setIsUnlockOpen(true)}
                    className="flex items-center justify-between w-full group text-[9px] font-bold uppercase text-muted-foreground hover:text-primary transition-colors"
                >
                    <div className="flex items-center gap-1.5">
                        <Lock className="w-3 h-3" />
                        <span>WhatsApp</span>
                    </div>
                    <span className="text-primary opacity-60 group-hover:opacity-100">Débloquer (500 F)</span>
                </button>
            )}
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0">
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button variant="outline" className="rounded-xl border-man-primary/20 h-9 text-[10px] font-bold" asChild>
              <Link href={`/dashboard/man/browse/${profile.id}`}>Détails</Link>
          </Button>
          
          {hasValidRendezvous || isUnlockedPack ? (
              <Button className="rounded-xl bg-green-500 hover:bg-green-600 h-9 shadow-lg font-bold text-[10px] gap-1.5" onClick={handleDirectChat} disabled={isOpeningChat}>
                  {isOpeningChat ? <Loader2 className="animate-spin w-3 h-3" /> : <MessageCircle className="w-3 h-3" />}
                  Chat
              </Button>
          ) : (
              <Button className="rounded-xl bg-primary h-9 shadow-lg font-bold text-[10px]" onClick={() => setIsRdvOpen(true)} disabled={manProfile?.role !== 'man'}>
                  Inviter
              </Button>
          )}
        </div>
      </CardFooter>

      {/* DIALOGS */}
      <Dialog open={isRdvOpen} onOpenChange={setIsRdvOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem] p-0 overflow-hidden">
            <ProposeRendezvousDialog womanProfile={profile} onProposalSent={() => setIsRdvOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={isUnlockOpen} onOpenChange={setIsUnlockOpen}>
        <DialogContent className="rounded-[2rem] sm:max-w-md">
            <div className="max-h-[80vh] overflow-y-auto px-4 py-6 scrollbar-hide">
                <DialogHeader>
                    <DialogTitle className="text-xl font-headline flex items-center gap-2">
                        <Phone className="text-primary" /> Débloquer le contact
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Accédez directement au numéro de {profile.name} pour discuter sans limites.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-6 space-y-6">
                    <div className="grid grid-cols-2 gap-3">
                        <Button 
                            variant="outline" 
                            className="h-16 rounded-xl flex flex-col gap-1 border-primary/20"
                            onClick={() => handleUnlockNumber('xp')}
                            disabled={isUnlocking}
                        >
                            <Zap className="w-4 h-4 text-primary fill-primary" />
                            <span className="text-[10px] font-bold">{WHATSAPP_UNLOCK_FEE_XP} XP</span>
                        </Button>
                        <Button 
                            className="h-16 rounded-xl flex flex-col gap-1 shadow-lg shadow-primary/20"
                            onClick={() => handleUnlockNumber('cash')}
                            disabled={isUnlocking}
                        >
                            <CreditCard className="w-4 h-4" />
                            <span className="text-[10px] font-bold">{WHATSAPP_UNLOCK_FEE_FCFA} FCFA</span>
                        </Button>
                    </div>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
