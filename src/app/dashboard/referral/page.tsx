'use client';

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { completeQuest } from '@/lib/firebase-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Share2, Copy, Users, Gift, Trophy, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

import { getReferralStats } from '@/lib/firebase-actions';
import { useEffect } from 'react';
export default function ReferralPage() {
  const { userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isCopying, setIsCopying] = useState(false);

  const [referralStats, setReferralStats] = useState({ totalReferrals: 0, validatedReferrals: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (userProfile?.uid) {
        const stats = await getReferralStats({ firestore, userId: userProfile.uid });
        setReferralStats(stats);
        
        // Compléter la quête si 5 parrainés validés sont atteints
        if (stats.validatedReferrals >= 5 && userProfile && !userProfile.completedQuests?.includes('ambassador_badge')) {
          try {
            await completeQuest({ firestore, userId: userProfile.uid, questId: 'ambassador_badge', points: 100 });
          } catch (e) {
            console.error('Erreur lors de la complétude de la quête:', e);
          }
        }
      }
      setIsLoading(false);
    };

    fetchStats();
  }, [userProfile?.uid, firestore, userProfile?.completedQuests]);
  const referralCode = userProfile?.uid?.slice(0, 8).toUpperCase() || 'LOVING-2024';
  const referralLink = `https://loving-web-five.vercel.app/register?ref=${referralCode}`;

  const handleCopy = () => {
  const progressPercentage = Math.min((referralStats.validatedReferrals / 5) * 100, 100);
  const isAmbassador = referralStats.validatedReferrals >= 5;
    setIsCopying(true);
    navigator.clipboard.writeText(referralLink);
    toast({
      title: 'Lien copié !',
      description: 'Partagez-le avec vos proches pour gagner des points.',
    });
    
    // Simuler la complétion de la quête si c'est la première fois
    if (userProfile && !userProfile.completedQuests?.includes('invite_friend')) {
        completeQuest({ firestore, userId: userProfile.uid, questId: 'invite_friend', points: 20 });
    }

    setTimeout(() => setIsCopying(false), 2000);
  };

  const steps = [
    { title: "Partagez votre lien", desc: "Envoyez votre lien unique à vos amis célibataires.", icon: <Share2 className="w-5 h-5" /> },
    { title: "Ils s'inscrivent", desc: "Vos amis créent un profil complet sur Loving.", icon: <Users className="w-5 h-5" /> },
    { title: "Gagnez des points", desc: "Recevez +20 XP dès qu'un ami valide son premier RDV.", icon: <Gift className="w-5 h-5" /> },
  ];
    { title: "Gagnez des points", desc: "Recevez +20 XP par parrain, +100 bonus si 5 RDV validés.", icon: <Gift className="w-5 h-5" /> },
  return (
    <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tighter font-headline text-primary">Parrainage Loving</h1>
        <p className="text-muted-foreground text-lg">Invitez vos amis et soyez récompensé pour chaque nouvelle connexion.</p>
      </header>
        <p className="text-muted-foreground text-lg">
          Invitez vos amis et soyez récompensé pour chaque nouvelle connexion.
          {isAmbassador && <span className="text-primary font-bold ml-2">🎉 Vous êtes Ambassadeur !</span>}
        </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step, i) => (
            <Card key={i} className="border-none bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl">
                <CardContent className="pt-8 text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                        {step.icon}
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-bold">{step.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>

      <Card className="rounded-[2.5rem] border-none bg-gradient-to-br from-primary/10 via-card to-accent/10 shadow-2xl overflow-hidden relative border border-white/5">
        <div className="absolute top-0 right-0 p-10 opacity-5">
            <Trophy className="w-40 h-40" />
        </div>
        <CardHeader className="p-8 md:p-12 text-center md:text-left">
          <CardTitle className="text-3xl font-headline mb-2">Votre lien de parrainage</CardTitle>
          <CardDescription className="text-base">Copiez et envoyez ce lien pour parrainer vos amis.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 md:p-12 pt-0 space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
                <Input 
                    value={referralLink} 
                    readOnly 
                    className="h-14 pl-4 pr-12 rounded-2xl bg-background/50 border-white/10 font-medium"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-primary uppercase">CODE: {referralCode}</div>
            </div>
            <Button onClick={handleCopy} className="h-14 px-8 rounded-2xl font-bold shadow-lg shadow-primary/20" disabled={isCopying}>
              {isCopying ? <CheckCircle2 className="mr-2 h-5 w-5" /> : <Copy className="mr-2 h-5 w-5" />}
              {isCopying ? "Copié !" : "Copier le lien"}
            </Button>
          </div>

          <Alert className="bg-primary/5 border-primary/20 rounded-2xl">
            <Trophy className="h-5 w-5 text-primary" />
            <AlertTitle className="font-bold">Objectif Ambassadeur</AlertTitle>
            <AlertDescription className="text-sm">
                Parrainez 5 amis pour débloquer le badge exclusif <span className="font-bold text-primary">"Ambassadeur Loving"</span> et gagner 100 XP bonus.
            </AlertDescription>
                {isAmbassador ? (
                  <span>Félicitations ! Vous avez débloqué le badge exclusif <span className="font-bold">"Ambassadeur Loving"</span> et gagné 100 XP bonus. 🎁</span>
                ) : (
                  <span>Parrainez 5 amis avec RDV validé pour débloquer le badge exclusif <span className="font-bold">"Ambassadeur Loving"</span> et gagner 100 XP bonus.</span>
                )}

          <div className="space-y-3">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <span>Progression : 0 / 5 amis</span>
                <span>0%</span>
                <span>Progression : {referralStats.validatedReferrals} / 5 amis (RDV validés)</span>
                <span>{Math.round(progressPercentage)}%</span>
          </div>
            <Progress value={progressPercentage} className="h-3 rounded-full" />
      </Card>

          {referralStats.totalReferrals > 0 && (
            <div className="pt-4 border-t border-white/10">
              <p className="text-sm text-muted-foreground mb-2">
                <span className="font-semibold">Total d'inscrits :</span> {referralStats.totalReferrals}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">Amis avec RDV validés :</span> {referralStats.validatedReferrals}
              </p>
            </div>
          )}

      <footer className="text-center pt-8">
        <p className="text-xs text-muted-foreground italic">
            * Les points sont crédités une fois que votre ami a complété son premier rendez-vous validé par un selfie.
        </p>
            * Les points (+20 XP par ami) sont crédités dès que votre ami complète son premier rendez-vous validé. Débloquez le badge Ambassadeur avec 5 amis validés (+100 XP bonus).
    </div>
  );
}
