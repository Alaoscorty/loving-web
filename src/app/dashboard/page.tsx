
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { useUser, useFirestore, useCollection, useDoc } from "@/firebase";
import { DailyQuests } from "@/components/daily-quests";
import { StoriesFeed } from "@/components/stories-feed";
import { PostFeed } from "@/components/post-feed";
import { MysteryBox } from "@/components/mystery-box";
import { WheelOfFortune } from "@/components/wheel-of-fortune";
import { cn } from "@/lib/utils";
import { handleUserStreakAndSwipes, boostProfile, BOOST_PROFILE_XP, claimBirthdayBonus, BIRTHDAY_BONUS_XP, CONTACT_PACK_FEE_XP } from "@/lib/firebase-actions";
import { 
    Zap, 
    Sparkles, 
    TrendingUp, 
    ChevronRight, 
    LayoutDashboard, 
    UserCircle, 
    Image as ImageIcon, 
    Settings, 
    MessageSquare, 
    Gamepad2,
    Star,
    Loader2,
    Heart,
    Cake,
    Wallet
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { collection, query, where, limit, doc } from 'firebase/firestore';
import type { UserProfile } from '@/types/user';
import { WomanProfileCard } from '@/components/woman-profile-card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WomanProfileForm } from '@/components/woman-profile-form';
import { ManProfileForm } from '@/components/man-profile-form';
import { SettingsView } from '@/components/dashboard/settings-view';
import { ImageView } from '@/components/dashboard/image-view';
import { MessagesView } from '@/components/dashboard/messages-view';
import { GamesView } from '@/components/dashboard/games-view';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { InvitedPostsFeed } from '@/components/invited-posts-feed';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { SocialFollowModal } from '@/components/social-follow-modal';

function AcceptedRdvMiniCard({ rdv }: { rdv: any }) {
    const firestore = useFirestore();
    const womanRef = doc(firestore, 'users', rdv.womanUid);
    const { data: woman, loading } = useDoc<any>(womanRef);

    if (loading) return <Skeleton className="h-24 w-full rounded-3xl" />;
    if (!woman) return null;

    return (
        <Card className="rounded-[1.5rem] border-none bg-card/40 backdrop-blur-md p-3 flex items-center gap-3 shadow-lg hover:bg-card/60 transition-all border border-white/5 group">
            <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={woman.photoUrl} className="object-cover" />
                    <AvatarFallback>{woman.name[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-background" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-xs truncate">{woman.name}</p>
                <p className="text-[9px] text-muted-foreground truncate uppercase tracking-tighter">{rdv.location}</p>
                <div className="mt-1.5 flex gap-2">
                    <Button size="sm" variant="secondary" className="h-6 text-[8px] font-bold rounded-full flex-1" asChild>
                        <Link href="/dashboard/messages">Chat</Link>
                    </Button>
                </div>
            </div>
        </Card>
    );
}

function AcceptedRendezvousSection() {
    const { userProfile } = useUser();
    const firestore = useFirestore();

    const q = useMemo(() => {
        if (!firestore || !userProfile || userProfile.role !== 'man') return null;
        return query(
            collection(firestore, 'rendezvous'),
            where('manUid', '==', userProfile.uid),
            where('status', '==', 'accepted'),
            limit(4)
        );
    }, [firestore, userProfile]);

    const { data: rendezvous, loading } = useCollection<any>(q);

    if (userProfile?.role !== 'man' || (!loading && (!rendezvous || rendezvous.length === 0))) return null;

    return (
        <section className="space-y-4 animate-in fade-in duration-700">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-lg md:text-2xl font-bold font-headline flex items-center gap-2 tracking-tighter">
                    <Heart className="w-5 h-5 text-primary fill-primary" /> 
                    RDV Acceptés
                </h2>
                <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/5 h-8 rounded-full text-xs" asChild>
                    <Link href="/dashboard/man/rendezvous">Tout voir</Link>
                </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
                ) : (
                    rendezvous.map((rdv: any) => (
                        <AcceptedRdvMiniCard key={rdv.id} rdv={rdv} />
                    ))
                )}
            </div>
        </section>
    );
}

export default function DashboardPage() {
  const { userProfile, loading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isBoosting, setIsBoosting] = useState(false);
  const [showBirthday, setShowBirthday] = useState(false);

  useEffect(() => {
    if (userProfile?.uid && firestore) {
      handleUserStreakAndSwipes(firestore, userProfile.uid);
      
      if (userProfile.birthDate) {
          const birthDate = new Date(userProfile.birthDate);
          const today = new Date();
          const isBirthday = birthDate.getDate() === today.getDate() && birthDate.getMonth() === today.getMonth();
          const bonusClaimedThisYear = userProfile.birthdayBonusLastClaimedYear === today.getFullYear();
          
          if (isBirthday && !bonusClaimedThisYear) {
              setShowBirthday(true);
          }
      }
    }
  }, [userProfile?.uid, firestore, userProfile?.birthDate, userProfile?.birthdayBonusLastClaimedYear]);

  const recommendedQuery = useMemo(() => {
    if (!firestore || !userProfile || userProfile.role !== 'man') return null;
    return query(collection(firestore, 'users'), where('role', '==', 'woman'), limit(4));
  }, [firestore, userProfile]);

  const { data: recommendedProfiles, loading: loadingRecs } = useCollection<UserProfile>(recommendedQuery);

  const handleBoost = async () => {
      if (!userProfile || !firestore) return;
      setIsBoosting(true);
      try {
          await boostProfile({ firestore, userId: userProfile.uid });
          toast({ title: "Profil Boosté ! 🚀", description: "Vous apparaîtrez en tête de liste pendant 24h." });
      } catch (e: any) {
          toast({ variant: "destructive", title: "Erreur", description: e.message });
      } finally {
          setIsBoosting(false);
      }
  };

  const handleClaimBirthday = async () => {
      if (!userProfile || !firestore) return;
      try {
          await claimBirthdayBonus(firestore, userProfile.uid);
          toast({ title: "Joyeux Anniversaire ! 🎂", description: `Vous avez reçu ${BIRTHDAY_BONUS_XP} XP de cadeau.` });
          setShowBirthday(false);
      } catch (e) {
          console.error(e);
      }
  }

  const isBoosted = userProfile?.boostExpiresAt && new Date(userProfile.boostExpiresAt) > new Date();

  const getRoleSpecificColorClass = () => {
    if (loading) return '';
    switch (userProfile?.role) {
      case 'woman': return 'text-woman-primary';
      case 'man': return 'text-man-primary';
      default: return 'text-primary';
    }
  }

  const isLowXp = (userProfile?.points || 0) < CONTACT_PACK_FEE_XP;

  if (loading) {
    return (
        <div className="flex-1 p-4 md:p-8 space-y-8">
            <Skeleton className="h-12 w-64" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Skeleton className="lg:col-span-2 h-[600px] rounded-3xl" />
                <Skeleton className="h-[400px] rounded-3xl" />
            </div>
        </div>
    );
  }

  return (
    <div className="flex-1 p-3 md:p-6 lg:p-10 max-w-[1600px] mx-auto w-full space-y-8">
      <MysteryBox />
      <SocialFollowModal />
      
      <Dialog open={showBirthday} onOpenChange={setShowBirthday}>
          <DialogContent className="sm:max-w-md text-center rounded-[2rem]">
              <DialogHeader>
                  <DialogTitle className="text-2xl font-headline flex items-center justify-center gap-3">
                      <Cake className="w-8 h-8 text-primary animate-bounce" />
                      Joyeux Anniversaire !
                  </DialogTitle>
                  <DialogDescription>
                      L'équipe Loving vous souhaite le meilleur. Voici un petit cadeau pour vous !
                  </DialogDescription>
              </DialogHeader>
              <div className="py-8 flex flex-col items-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse" />
                    <p className="text-6xl font-black text-primary relative z-10">+{BIRTHDAY_BONUS_XP}</p>
                    <p className="text-sm font-bold uppercase tracking-widest text-primary/60">Points XP</p>
                  </div>
              </div>
              <DialogFooter>
                  <Button onClick={handleClaimBirthday} className="w-full h-12 rounded-xl text-lg font-bold shadow-xl shadow-primary/20">
                      Merci Loving ! 🎁
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 animate-in fade-in duration-700">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tighter font-headline leading-tight">
            {`Hello, `}
            <span className={cn(getRoleSpecificColorClass())}>{userProfile?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-muted-foreground text-xs md:text-lg font-medium">
             {userProfile?.role === 'woman' 
                ? "Prête à recevoir de nouvelles invitations ?" 
                : "Prêt pour de nouvelles connexions authentiques ?"}
          </p>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
            {isLowXp && (
                <Button 
                    asChild 
                    variant="destructive" 
                    className="h-10 md:h-12 px-3 md:px-5 rounded-xl flex gap-2 items-center shadow-lg shadow-destructive/20 animate-pulse shrink-0"
                >
                    <Link href="/dashboard/wallet">
                        <Wallet className="w-4 h-4 md:w-5 md:h-5" />
                        <div className="text-left leading-none">
                            <p className="text-[8px] font-bold uppercase opacity-70 tracking-widest">Besoin de XP ?</p>
                            <p className="text-[10px] font-bold">Acheter 💎</p>
                        </div>
                    </Link>
                </Button>
            )}

            {isBoosted ? (
                <Badge className="h-10 md:h-12 px-3 md:px-5 rounded-xl flex gap-2 items-center bg-accent text-white shadow-lg animate-pulse shrink-0">
                    <Zap className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                    <div className="text-left leading-none">
                        <p className="text-[8px] font-bold uppercase opacity-70 tracking-widest">Boosté</p>
                        <p className="text-[10px] font-bold">Actif</p>
                    </div>
                </Badge>
            ) : (
                <Button 
                    variant="outline" 
                    className="h-10 md:h-12 px-3 md:px-5 rounded-xl flex gap-2 items-center border-accent/20 hover:bg-accent/5 text-accent shadow-sm shrink-0"
                    onClick={handleBoost}
                    disabled={isBoosting}
                >
                    {isBoosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 md:w-5 md:h-5" />}
                    <div className="text-left leading-none">
                        <p className="text-[8px] font-bold uppercase opacity-70 tracking-widest">Boost Profil</p>
                        <p className="text-[10px] font-bold">{BOOST_PROFILE_XP} XP</p>
                    </div>
                </Button>
            )}
            <div className="p-2 md:p-3 h-10 md:h-12 flex items-center gap-3 md:gap-4 bg-primary/5 border border-primary/10 rounded-xl backdrop-blur-md shrink-0 shadow-lg shadow-primary/5">
                <div className="text-right leading-none">
                    <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-tighter">Points</p>
                    <p className="text-xs md:text-lg font-bold text-primary">{userProfile?.points ?? 0}</p>
                </div>
                <div className="h-6 w-px bg-primary/20" />
                <div className="text-left leading-none">
                    <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-tighter">Rang</p>
                    <p className="text-xs md:text-lg font-bold text-accent">{userProfile?.level ?? 'Bronze'}</p>
                </div>
            </div>
        </div>
      </header>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0 scrollbar-hide sticky top-0 md:relative z-40 bg-background/80 backdrop-blur-xl py-2">
            <TabsList className="bg-muted/50 p-1 h-12 md:h-14 rounded-xl w-max min-w-full md:min-w-0 flex gap-1 border border-white/5 shadow-inner">
                <TabsTrigger value="overview" className="rounded-lg h-full data-[state=active]:bg-card data-[state=active]:shadow-lg transition-all duration-300 gap-2 px-4 md:px-6">
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="text-[10px] md:text-sm font-bold uppercase tracking-widest">Accueil</span>
                </TabsTrigger>
                <TabsTrigger value="messages" className="rounded-lg h-full data-[state=active]:bg-card data-[state=active]:shadow-lg transition-all duration-300 gap-2 px-4 md:px-6">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-[10px] md:text-sm font-bold uppercase tracking-widest">Chat</span>
                </TabsTrigger>
                <TabsTrigger value="games" className="rounded-lg h-full data-[state=active]:bg-card data-[state=active]:shadow-lg transition-all duration-300 gap-2 px-4 md:px-6">
                    <Gamepad2 className="w-4 h-4" />
                    <span className="text-[10px] md:text-sm font-bold uppercase tracking-widest">Jeux</span>
                </TabsTrigger>
                <TabsTrigger value="profile" className="rounded-lg h-full data-[state=active]:bg-card data-[state=active]:shadow-lg transition-all duration-300 gap-2 px-4 md:px-6">
                    <UserCircle className="w-4 h-4" />
                    <span className="text-[10px] md:text-sm font-bold uppercase tracking-widest">Profil</span>
                </TabsTrigger>
                <TabsTrigger value="images" className="rounded-lg h-full data-[state=active]:bg-card data-[state=active]:shadow-lg transition-all duration-300 gap-2 px-4 md:px-6">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-[10px] md:text-sm font-bold uppercase tracking-widest">Galerie</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="rounded-lg h-full data-[state=active]:bg-card data-[state=active]:shadow-lg transition-all duration-300 gap-2 px-4 md:px-6">
                    <Settings className="w-4 h-4" />
                    <span className="text-[10px] md:text-sm font-bold uppercase tracking-widest">Réglages</span>
                </TabsTrigger>
            </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 outline-none">
            <section className="animate-in fade-in duration-700 delay-100 px-1">
                <StoriesFeed />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
                <div className="lg:col-span-8 space-y-10">
                    {userProfile?.role === 'man' && (
                        <>
                            <AcceptedRendezvousSection />
                            <InvitedPostsFeed />

                            <section className="space-y-6 animate-in fade-in duration-500">
                                <div className="flex items-center justify-between px-1">
                                    <h2 className="text-xl md:text-3xl font-bold font-headline flex items-center gap-3 tracking-tighter">
                                        <Sparkles className="w-5 h-5 md:w-8 md:h-8 text-man-primary" /> 
                                        Pour vous
                                    </h2>
                                    <Button variant="ghost" size="sm" className="text-man-primary font-bold hover:bg-man-primary/5 h-8 md:h-10 px-3 md:px-4 rounded-full text-xs md:text-sm" asChild>
                                        <Link href="/dashboard/man/browse" className="flex items-center gap-2">
                                            Tout voir <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                                        </Link>
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                                    {loadingRecs ? (
                                        Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] w-full rounded-2xl md:rounded-3xl" />)
                                    ) : (
                                        recommendedProfiles?.map(profile => (
                                            <div key={profile.id} className="hover:translate-y-[-5px] transition-transform duration-500">
                                                <WomanProfileCard profile={profile} />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        </>
                    )}

                    <section className="space-y-6 animate-in fade-in duration-1000 delay-200">
                        <h2 className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2 px-1">
                            <Star className="w-3 h-3 md:w-4 md:h-4 text-primary fill-primary" /> Fil d'Actualité
                        </h2>
                        <PostFeed />
                    </section>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <WheelOfFortune />
                    <DailyQuests />
                    
                    <Card className="rounded-[2.5rem] border-none bg-card/40 backdrop-blur-md overflow-hidden shadow-xl border border-white/5">
                        <CardHeader className="bg-muted/30 p-8">
                        <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" /> Visibilité du profil
                        </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                    <p className="font-bold text-lg">Statut : Optimal</p>
                                </div>
                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 px-3 py-1 font-bold text-[10px]">EN LIGNE</Badge>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                                    <span className="text-muted-foreground">Progression {userProfile?.level}</span>
                                    <span className="text-primary">{(userProfile?.points || 0) % 200}/200 XP</span>
                                </div>
                                <div className="h-3 w-full bg-muted/50 rounded-full overflow-hidden p-1 shadow-inner">
                                    <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000 ease-out" style={{ width: `${((userProfile?.points || 0) % 200) / 2}%` }} />
                                </div>
                            </div>
                        </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TabsContent>

        <TabsContent value="messages" className="animate-in fade-in slide-in-from-bottom-8 duration-700 outline-none h-full min-h-[60vh] md:min-h-[70vh]">
            <MessagesView />
        </TabsContent>

        <TabsContent value="games" className="animate-in fade-in slide-in-from-bottom-8 duration-700 outline-none">
            <GamesView />
        </TabsContent>

        <TabsContent value="profile" className="animate-in fade-in slide-in-from-bottom-8 duration-700 outline-none">
            {userProfile?.role === 'woman' ? (
                <WomanProfileForm userProfile={userProfile as any} />
            ) : (
                <ManProfileForm userProfile={userProfile as any} />
            )}
        </TabsContent>

        <TabsContent value="images" className="animate-in fade-in slide-in-from-bottom-8 duration-700 outline-none">
            <ImageView userProfile={userProfile as any} />
        </TabsContent>

        <TabsContent value="settings" className="animate-in fade-in slide-in-from-bottom-8 duration-700 outline-none">
            <SettingsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
