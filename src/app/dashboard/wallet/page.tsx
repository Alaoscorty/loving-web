
'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useStorage, useCollection } from '@/firebase';
import { createWithdrawalRequest, POINTS_CONVERSION_RATE, MIN_WITHDRAWAL_POINTS, WITHDRAWAL_FEE_PERCENTAGE, submitDonationRequest, purchaseContactPack, CONTACT_PACK_FEE_FCFA, CONTACT_PACK_FEE_XP } from '@/lib/firebase-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Banknote, History, ArrowRightLeft, Info, Loader2, CheckCircle2, Clock, XCircle, ShieldAlert, Heart, Gift, Camera, Users, Sparkles, Zap, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { collection, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SuccessView } from '@/components/success-view';

export default function WalletPage() {
  const { userProfile, user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  
  const [pointsToConvert, setPointsToConvert] = useState<string>('');
  const [paymentInfo, setPaymentInfo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Donation state
  const [donationAmount, setDonationAmount] = useState<string>('');
  const [donationFile, setDonationFile] = useState<File | null>(null);
  const [isDonating, setIsDonating] = useState(false);
  const [isDonationOpen, setIsDonationOpen] = useState(false);

  // Contact Pack state
  const [isBuyingPack, setIsBuyingPack] = useState(false);
  const [showPackSuccess, setShowPackSuccess] = useState(false);

  const withdrawalsQuery = useMemo(() => {
    if (!firestore || !userProfile) return null;
    return query(
      collection(firestore, 'withdrawals'),
      where('userId', '==', userProfile.uid)
    );
  }, [firestore, userProfile]);

  const { data: rawWithdrawals, loading } = useCollection<any>(withdrawalsQuery);

  // Tri côté client
  const withdrawals = useMemo(() => {
    if (!rawWithdrawals) return [];
    return [...rawWithdrawals].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [rawWithdrawals]);

  const handleWithdraw = async () => {
    const points = parseInt(pointsToConvert);
    if (!userProfile || isNaN(points) || points < MIN_WITHDRAWAL_POINTS || points > (userProfile.points || 0) || !paymentInfo) {
      toast({ 
        variant: 'destructive', 
        title: 'Erreur', 
        description: `Minimum ${MIN_WITHDRAWAL_POINTS} points requis et solde suffisant.` 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createWithdrawalRequest({
        firestore,
        userId: userProfile.uid,
        userName: userProfile.name,
        points,
        paymentInfo,
      });
      toast({ title: 'Demande envoyée !', description: 'Votre demande sera traitée sous 48h.' });
      setPointsToConvert('');
      setPaymentInfo('');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDonation = async () => {
      if (!userProfile || !firestore || !storage || !donationAmount || !donationFile) return;
      setIsDonating(true);
      try {
          await submitDonationRequest({
              firestore,
              storage,
              userId: userProfile.uid,
              userName: userProfile.name,
              amount: parseInt(donationAmount),
              proofFile: donationFile
          });
          toast({ title: 'Don transmis !', description: 'L\'administrateur validera votre récompense sous peu.' });
          setIsDonationOpen(false);
          setDonationAmount('');
          setDonationFile(null);
      } catch (e: any) {
          toast({ variant: 'destructive', title: 'Erreur', description: e.message });
      } finally {
          setIsDonating(false);
      }
  }

  const handlePurchasePack = async (method: 'fcfa' | 'xp') => {
      if (!user || !firestore) return;
      setIsBuyingPack(true);
      try {
          await purchaseContactPack({ firestore, userId: user.uid, paymentMethod: method });
          setShowPackSuccess(true);
      } catch (e: any) {
          toast({ variant: 'destructive', title: 'Erreur', description: e.message || 'Impossible d\'acheter le pack.' });
      } finally {
          setIsBuyingPack(false);
      }
  }

  const currentCashValue = (userProfile?.points || 0) * POINTS_CONVERSION_RATE;
  const requestedGrossValue = parseInt(pointsToConvert || '0') * POINTS_CONVERSION_RATE;
  const requestedNetValue = requestedGrossValue * (1 - WITHDRAWAL_FEE_PERCENTAGE);

  if (showPackSuccess) {
      return (
          <SuccessView 
            title="Contacts Débloqués ! 📱"
            message="Vous avez débloqué 20 profils exclusifs. Retrouvez-les avec le badge 'DÉBLOQUÉ' et commencez à discuter directement."
            onBack={() => setShowPackSuccess(false)}
          />
      );
  }

  return (
    <div className="flex-1 p-3 md:p-8 max-w-5xl mx-auto w-full space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 md:space-y-2 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter font-headline text-primary flex items-center justify-center md:justify-start gap-2 md:gap-3">
                <Wallet className="w-8 h-8 md:w-10 md:h-10" /> Mon Portefeuille
            </h1>
            <p className="text-muted-foreground text-sm md:text-lg">Gérez vos points et vos retraits. (Frais : {WITHDRAWAL_FEE_PERCENTAGE * 100}%)</p>
        </div>
        
        <Dialog open={isDonationOpen} onOpenChange={setIsDonationOpen}>
            <DialogTrigger asChild>
                <Button className="h-12 md:h-14 px-6 md:px-8 rounded-xl md:rounded-2xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20 font-bold gap-2 text-xs md:text-sm">
                    <Heart className="w-4 h-4 md:w-5 md:h-5 fill-current" /> Faire un don & Gagner
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2rem] md:rounded-[2.5rem] sm:max-w-md max-w-[95vw]">
                <DialogHeader>
                    <DialogTitle className="text-xl md:text-2xl font-headline flex items-center gap-2">
                        <Gift className="text-accent" /> Soutenir Loving
                    </DialogTitle>
                    <DialogDescription className="text-xs md:text-sm">
                        Faites un don et recevez un <strong>Coffre Mystère</strong> en récompense !
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 md:space-y-6 py-2 md:py-4">
                    <Alert className="bg-muted border-none rounded-xl md:rounded-2xl">
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-[10px] md:text-sm leading-relaxed">
                            Envoyez votre don au : <br/>
                            <span className="font-bold text-primary">+229 0151563219</span> ou <span className="font-bold text-primary">+229 0144104328</span>
                        </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-3 md:space-y-4">
                        <div className="space-y-1.5 md:space-y-2">
                            <label className="text-[10px] md:text-xs font-bold uppercase ml-1">Montant (FCFA)</label>
                            <Input 
                                type="number" 
                                placeholder="Ex: 5000" 
                                value={donationAmount}
                                onChange={(e) => setDonationAmount(e.target.value)}
                                className="h-10 md:h-12 rounded-lg md:rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5 md:space-y-2">
                            <label className="text-[10px] md:text-xs font-bold uppercase ml-1">Preuve du transfert</label>
                            <Input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => setDonationFile(e.target.files?.[0] || null)}
                                className="h-10 md:h-12 rounded-lg md:rounded-xl"
                            />
                        </div>
                    </div>

                    <Button 
                        className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl font-bold bg-accent" 
                        disabled={isDonating || !donationAmount || !donationFile}
                        onClick={handleDonation}
                    >
                        {isDonating ? <Loader2 className="animate-spin mr-2" /> : <Camera className="mr-2 h-4 w-4" />}
                        Envoyer ma preuve
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <Card className="lg:col-span-1 rounded-3xl md:rounded-[2.5rem] border-none bg-gradient-to-br from-primary to-accent text-white shadow-xl md:shadow-2xl overflow-hidden relative p-6 md:p-8">
            <div className="absolute top-0 right-0 p-4 md:p-8 opacity-10">
                <Banknote className="w-24 h-24 md:w-32 md:h-32" />
            </div>
            <div className="space-y-4 md:space-y-6 relative z-10">
                <p className="text-[10px] md:text-sm font-bold uppercase tracking-widest opacity-80">Solde disponible</p>
                <div className="space-y-1">
                    <p className="text-4xl md:text-5xl font-bold tracking-tighter">{userProfile?.points || 0} XP</p>
                    <p className="text-lg md:text-xl font-medium opacity-90">≈ {currentCashValue.toLocaleString()} FCFA</p>
                </div>
                <Badge className="bg-white/20 text-white border-none px-3 py-1 text-[10px] md:text-xs">
                    1 point = {POINTS_CONVERSION_RATE} FCFA
                </Badge>
            </div>
        </Card>

        {userProfile?.role === 'man' && (
            <Card className="lg:col-span-2 rounded-3xl md:rounded-[2.5rem] border-none bg-man-primary/10 backdrop-blur-md shadow-xl border border-man-primary/20 overflow-hidden relative group">
                <div className="absolute -right-4 -top-4 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                    <Users className="w-32 h-32 md:w-40 md:h-40 text-man-primary" />
                </div>
                <CardHeader className="p-6 md:p-8">
                    <CardTitle className="text-xl md:text-2xl font-headline flex items-center gap-2">
                        <Sparkles className="text-man-primary h-5 w-5 md:h-6 md:w-6" /> Pack 20 Contacts
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">Débloquez 20 profils au hasard pour discuter <strong>gratuitement</strong>.</CardDescription>
                </CardHeader>
                <CardContent className="px-6 md:px-8 pb-4">
                    <div className="p-3 md:p-4 bg-background/50 rounded-xl md:rounded-2xl border border-man-primary/10">
                        <ul className="space-y-1.5 md:space-y-2">
                            <li className="flex items-center gap-2 text-[10px] md:text-xs font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-man-primary" /> Accès direct au chat sans RDV
                            </li>
                            <li className="flex items-center gap-2 text-[10px] md:text-xs font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-man-primary" /> Idéal pour briser la glace rapidement
                            </li>
                        </ul>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-2 md:gap-3 p-6 md:p-8 pt-0">
                    <Button 
                        onClick={() => handlePurchasePack('xp')}
                        disabled={isBuyingPack || (userProfile?.points || 0) < CONTACT_PACK_FEE_XP}
                        variant="secondary"
                        className="flex-1 h-11 md:h-14 rounded-xl md:rounded-2xl font-bold text-xs md:text-lg border-man-primary/30"
                    >
                        {isBuyingPack ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Zap className="mr-2 h-4 w-4 text-man-primary fill-man-primary" />}
                        {CONTACT_PACK_FEE_XP} XP
                    </Button>
                    <Button 
                        onClick={() => handlePurchasePack('fcfa')}
                        disabled={isBuyingPack}
                        className="flex-[2] h-11 md:h-14 rounded-xl md:rounded-2xl bg-man-primary hover:bg-man-primary/90 text-white font-bold text-xs md:text-lg shadow-xl"
                    >
                        {isBuyingPack ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Banknote className="mr-2 h-4 w-4" />}
                        {CONTACT_PACK_FEE_FCFA} FCFA
                    </Button>
                </CardFooter>
            </Card>
        )}

        <Card className="lg:col-span-1 rounded-3xl md:rounded-[2.5rem] border-none bg-accent/5 backdrop-blur-md shadow-lg border border-accent/20 flex flex-col items-center justify-center p-6 md:p-8 text-center space-y-4 group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 group-hover:rotate-0 transition-transform">
                <PlusCircle className="w-20 h-20 md:w-24 md:h-24 text-accent" />
            </div>
            <div className="w-12 h-12 md:w-16 md:h-16 bg-accent/10 rounded-full flex items-center justify-center shadow-inner">
                <Zap className="w-6 h-6 md:w-8 md:h-8 text-accent fill-accent" />
            </div>
            <div className="space-y-1 relative z-10">
                <h3 className="font-bold text-lg md:text-xl">Recharger mes XP</h3>
                <p className="text-[10px] md:text-xs text-muted-foreground leading-relaxed">Faites un don pour soutenir Loving et recevez des récompenses XP.</p>
            </div>
            <Button 
                onClick={() => setIsDonationOpen(true)}
                className="w-full h-10 md:h-12 rounded-xl bg-accent hover:bg-accent/90 font-bold shadow-lg text-xs md:text-sm"
            >
                Acheter maintenant
            </Button>
        </Card>

        <Card className="lg:col-span-2 rounded-3xl md:rounded-[2.5rem] border-none bg-card/40 backdrop-blur-md shadow-xl border border-white/5">
            <CardHeader className="p-6 md:p-8">
                <CardTitle className="font-headline text-xl md:text-2xl flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5 md:w-6 md:h-6 text-primary" /> Demander un retrait
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">Minimum : {MIN_WITHDRAWAL_POINTS} points ({MIN_WITHDRAWAL_POINTS * POINTS_CONVERSION_RATE} FCFA)</CardDescription>
            </CardHeader>
            <CardContent className="px-6 md:px-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-1.5 md:space-y-2">
                        <label className="text-[10px] md:text-xs font-bold uppercase text-muted-foreground ml-1">Points à convertir</label>
                        <Input 
                            type="number" 
                            placeholder={`Ex: ${MIN_WITHDRAWAL_POINTS}`}
                            value={pointsToConvert}
                            onChange={(e) => setPointsToConvert(e.target.value)}
                            className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-background/50 border-white/10 text-lg md:text-xl font-bold"
                        />
                        {pointsToConvert && (
                            <div className="mt-2 p-3 bg-muted/30 rounded-xl space-y-1">
                                <p className="text-[9px] md:text-[10px] text-muted-foreground font-bold uppercase">Net estimé :</p>
                                <p className="text-xs md:text-sm font-bold text-primary">{requestedNetValue.toLocaleString()} FCFA <span className="text-[8px] md:text-[10px] text-muted-foreground font-normal">(après frais 20%)</span></p>
                            </div>
                        )}
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                        <label className="text-[10px] md:text-xs font-bold uppercase text-muted-foreground ml-1">Numéro MoMo / Airtel</label>
                        <Input 
                            placeholder="Ex: +229 01XXXXXXXX"
                            value={paymentInfo}
                            onChange={(e) => setPaymentInfo(e.target.value)}
                            className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-background/50 border-white/10 text-sm md:text-base"
                        />
                    </div>
                </div>
                
                <div className="p-3 md:p-4 bg-orange-500/5 rounded-xl md:rounded-2xl border border-orange-500/10 flex items-start gap-3 md:gap-4">
                    <ShieldAlert className="w-4 h-4 md:w-5 md:h-5 text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] md:text-xs text-muted-foreground leading-relaxed">
                        <strong>Important :</strong> Une commission de 20% est appliquée pour couvrir les frais de service et les taxes de transfert mobile.
                    </p>
                </div>
            </CardContent>
            <CardFooter className="p-6 md:p-8 pt-0">
                <Button 
                    className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl font-bold text-sm md:text-lg shadow-lg"
                    disabled={isSubmitting || !pointsToConvert || parseInt(pointsToConvert) < MIN_WITHDRAWAL_POINTS || !paymentInfo}
                    onClick={handleWithdraw}
                >
                    {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4 md:h-5 md:w-5" /> : <Banknote className="mr-2 h-4 w-4 md:h-5 md:w-5" />}
                    Confirmer le retrait
                </Button>
            </CardFooter>
        </Card>
      </div>

      <section className="space-y-4 md:space-y-6">
        <h2 className="text-xl md:text-2xl font-bold font-headline flex items-center justify-center md:justify-start gap-2 md:gap-3 px-2">
            <History className="text-muted-foreground w-5 h-5 md:w-6 md:h-6" /> Historique des transactions
        </h2>
        <div className="grid grid-cols-1 gap-3 md:gap-4">
            {loading ? (
                Array.from({ length: 3 }).map((_, i) => <Card key={i} className="h-20 animate-pulse bg-muted/20 rounded-2xl" />)
            ) : withdrawals?.length === 0 ? (
                <div className="text-center py-12 md:py-20 bg-muted/10 rounded-[2rem] md:rounded-[2.5rem] border-2 border-dashed">
                    <Clock className="mx-auto h-10 w-10 md:h-12 md:w-12 text-muted-foreground opacity-20" />
                    <p className="mt-4 text-sm md:text-base text-muted-foreground">Aucune transaction pour le moment.</p>
                </div>
            ) : (
                withdrawals?.map((w: any) => (
                    <Card key={w.id} className="rounded-xl md:rounded-2xl border-none bg-card/40 backdrop-blur-md shadow-md p-3 md:p-4 flex items-center justify-between gap-3 md:gap-4">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className={`p-2.5 md:p-3 rounded-lg md:rounded-xl ${w.status === 'processed' ? 'bg-green-500/10 text-green-600' : w.status === 'rejected' ? 'bg-red-500/10 text-red-600' : 'bg-orange-500/10 text-orange-600'}`}>
                                {w.status === 'processed' ? <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" /> : w.status === 'rejected' ? <XCircle className="h-4 w-4 md:h-5 md:w-5" /> : <Clock className="h-4 w-4 md:h-5 md:w-5" />}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-xs md:text-sm truncate">Retrait de {w.amount.toLocaleString()} F</p>
                                <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase font-bold tracking-tighter truncate">
                                    {format(new Date(w.createdAt), 'dd MMMM à HH:mm', { locale: fr })}
                                </p>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <Badge variant="outline" className={`capitalize font-bold text-[8px] md:text-[10px] px-2 py-0.5 ${w.status === 'processed' ? 'border-green-500/30 text-green-600 bg-green-500/5' : w.status === 'rejected' ? 'border-red-500/30 text-red-600 bg-red-500/5' : 'border-orange-500/30 text-orange-600 bg-orange-500/5'}`}>
                                {w.status === 'processed' ? 'Effectué' : w.status === 'rejected' ? 'Rejeté' : 'Attente'}
                            </Badge>
                            <p className="text-[8px] md:text-[10px] text-muted-foreground mt-1">{w.points} XP</p>
                        </div>
                    </Card>
                ))
            )}
        </div>
      </section>
    </div>
  );
}
