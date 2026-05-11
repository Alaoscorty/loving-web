
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    Search, 
    Heart, 
    Wallet, 
    ShieldCheck, 
    Zap, 
    Users, 
    QrCode,
    Camera,
    Gift,
    Ticket,
    Info,
    Trophy,
    RefreshCw,
    Sparkles
} from 'lucide-react';
import { 
    RENDEZVOUS_FEE_FCFA, 
    RENDEZVOUS_FEE_XP, 
    POINTS_CONVERSION_RATE, 
    WHEEL_SPIN_COST,
    BOOST_PROFILE_XP,
    CONTACT_PACK_FEE_FCFA,
    CONTACT_PACK_FEE_XP
} from '@/lib/firebase-actions';

export default function ManGuidePage() {
  const steps = [
    {
      title: "Exploration & Visibilité",
      icon: <Users className="w-6 h-6 text-man-primary" />,
      content: "Parcourez les profils certifiés. Utilisez vos 20 swipes quotidiens. Passez en Premium pour des swipes illimités et une priorité d'affichage.",
      badge: "Exploration"
    },
    {
      title: "L'Invitation Exclusive",
      icon: <Heart className="w-6 h-6 text-primary" />,
      content: `Proposez un lieu et une date précise. Chaque invitation coûte ${RENDEZVOUS_FEE_FCFA} FCFA ou ${RENDEZVOUS_FEE_XP} XP. L'élégance commence par le respect du temps.`,
      badge: "Engagement"
    },
    {
      title: "Validation & Sécurité",
      icon: <QrCode className="w-6 h-6 text-blue-500" />,
      content: "Lors du RDV, montrez votre QR Code. Une fois scanné, votre présence est validée géographiquement pour garantir une sécurité mutuelle.",
      badge: "Confiance"
    },
    {
      title: "Selfie & Récompense",
      icon: <Camera className="w-6 h-6 text-green-500" />,
      content: "Prenez un selfie ensemble pour terminer. Une fois validé par l'admin, vous recevez des XP et débloquez un Coffre Mystère !",
      badge: "Fidélité"
    }
  ];

  return (
    <div className="flex-1 p-4 md:p-10 max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
      <header className="space-y-4 text-center md:text-left">
        <Badge variant="outline" className="text-man-primary border-man-primary/20 bg-man-primary/5 px-4 py-1 rounded-full uppercase tracking-widest font-bold text-[10px]">
            Manuel de l'Expérience Homme
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tighter">Comment briller sur <span className="text-primary italic">Loving</span> ?</h1>
        <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
            Loving n'est pas une application de rencontre ordinaire. C'est un club privé où la courtoisie et l'action concrète sont les clés du succès.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {steps.map((step, i) => (
            <Card key={i} className="rounded-[2.5rem] border-none bg-card/40 backdrop-blur-md shadow-xl border border-white/5 overflow-hidden group hover:translate-y-[-5px] transition-all duration-500">
                <CardHeader className="flex flex-row items-center gap-4 bg-muted/10 p-8">
                    <div className="p-4 rounded-2xl bg-background shadow-inner group-hover:scale-110 transition-transform">
                        {step.icon}
                    </div>
                    <div>
                        <CardTitle className="text-xl font-headline">{step.title}</CardTitle>
                        <Badge variant="secondary" className="text-[9px] uppercase tracking-tighter">{step.badge}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        {step.content}
                    </p>
                </CardContent>
            </Card>
        ))}
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-3xl border-none bg-primary/5 p-6 space-y-4 border border-primary/10">
            <Ticket className="w-8 h-8 text-primary" />
            <h3 className="font-bold">La Roue (1500 XP)</h3>
            <p className="text-xs text-muted-foreground">Tentez votre chance chaque jour pour {WHEEL_SPIN_COST} XP. Le jackpot peut changer votre expérience !</p>
        </Card>
        <Card className="rounded-3xl border-none bg-man-primary/5 p-6 space-y-4 border border-man-primary/10">
            <Sparkles className="w-8 h-8 text-man-primary" />
            <h3 className="font-bold">Pack Contacts</h3>
            <p className="text-xs text-muted-foreground">Achetez 20 contacts pour {CONTACT_PACK_FEE_FCFA} FCFA ou {CONTACT_PACK_FEE_XP} XP et discutez en direct avec elles sans payer par message.</p>
        </Card>
        <Card className="rounded-3xl border-none bg-accent/5 p-6 space-y-4 border border-accent/10">
            <Trophy className="w-8 h-8 text-accent" />
            <h3 className="font-bold">Parrainage Réel</h3>
            <p className="text-xs text-muted-foreground">Gagnez 20 XP dès qu'un ami parrainé valide son tout premier rendez-vous réel sur Loving.</p>
        </Card>
      </section>

      <section className="bg-gradient-to-br from-man-primary/20 to-accent/10 rounded-[3rem] p-8 md:p-16 space-y-8 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-10 opacity-5">
            <Wallet className="w-64 h-64" />
         </div>
         <div className="relative z-10 max-w-2xl space-y-6">
            <h2 className="text-3xl font-bold font-headline">L'Économie Loving</h2>
            <div className="space-y-4">
                <div className="flex items-start gap-4">
                    <div className="mt-1 w-2 h-2 rounded-full bg-man-primary" />
                    <p className="text-sm"><strong>XP = CASH :</strong> Vos points sont précieux. 1 XP = {POINTS_CONVERSION_RATE} FCFA. Retrait possible dès 2000 XP.</p>
                </div>
                <div className="flex items-start gap-4">
                    <div className="mt-1 w-2 h-2 rounded-full bg-man-primary" />
                    <p className="text-sm"><strong>Tarifs Réduits :</strong> Inviter une femme ne coûte plus que 500 FCFA ou 30 XP !</p>
                </div>
                <div className="flex items-start gap-4">
                    <div className="mt-1 w-2 h-2 rounded-full bg-man-primary" />
                    <p className="text-sm"><strong>Pack Contacts :</strong> Débloquez 20 profils pour seulement {CONTACT_PACK_FEE_XP} XP.</p>
                </div>
            </div>
         </div>
      </section>

      <footer className="text-center py-10">
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-muted/50 border text-xs font-medium italic">
            <Info className="w-4 h-4 text-primary" />
            Besoin d'aide ? L'administrateur est disponible 24/7 via le chat de support.
        </div>
      </footer>
    </div>
  );
}
