'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    Heart, 
    Star, 
    Zap, 
    Image as ImageIcon, 
    CheckCircle2, 
    MessageSquare,
    Gift,
    Gamepad2,
    CalendarCheck,
    Award,
    RefreshCw,
    ShieldCheck
} from 'lucide-react';
import { POINTS_CONVERSION_RATE } from '@/lib/firebase-actions';

export default function WomanGuidePage() {
  const steps = [
    {
      title: "Visibilité Dynamique",
      icon: <ImageIcon className="w-6 h-6 text-woman-primary" />,
      content: "Ajoutez des photos récentes. Attention : les photos et posts expirent après 5 mois pour que le réseau reste authentique et frais.",
      badge: "Profil"
    },
    {
      title: "Contrôle des Invitations",
      icon: <CalendarCheck className="w-6 h-6 text-primary" />,
      content: "Recevez des propositions concrètes (Lieu/Date). Vous décidez d'accepter, de décliner ou de discuter avant de vous engager.",
      badge: "Liberté"
    },
    {
      title: "Validation de Rencontre",
      icon: <ShieldCheck className="w-6 h-6 text-blue-500" />,
      content: "Scannez le QR code de l'homme et prenez un selfie ensemble. Cette preuve géolocalisée vous rapporte instantanément des points XP.",
      badge: "Sécurité"
    },
    {
      title: "Monétisation Douce",
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      content: `Convertissez vos XP accumulés en argent réel (1 XP = ${POINTS_CONVERSION_RATE} FCFA). Votre temps et votre présence ont de la valeur.`,
      badge: "Gains"
    }
  ];

  return (
    <div className="flex-1 p-4 md:p-10 max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
      <header className="space-y-4 text-center md:text-left">
        <Badge variant="outline" className="text-woman-primary border-woman-primary/20 bg-woman-primary/5 px-4 py-1 rounded-full uppercase tracking-widest font-bold text-[10px]">
            Guide de l'Expérience Femme
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tighter">Votre sécurité, votre <span className="text-primary italic">valeur</span>.</h1>
        <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
            Sur Loving, vous n'êtes pas un simple profil. Vous êtes au centre d'une expérience sécurisée, valorisante et lucrative.
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

      <section className="bg-gradient-to-br from-woman-primary/20 to-accent/10 rounded-[3rem] p-8 md:p-16 space-y-10 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-10 opacity-5">
            <Gift className="w-64 h-64" />
         </div>
         <div className="relative z-10 max-w-2xl space-y-6">
            <h2 className="text-3xl font-bold font-headline">Avantages & Récompenses</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 bg-background/50 rounded-2xl space-y-2 border border-white/5 backdrop-blur-sm">
                    <h4 className="font-bold flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-green-500" /> Sécurité 100%</h4>
                    <p className="text-[10px] text-muted-foreground">Validation par selfie et géolocalisation pour chaque rendez-vous réel.</p>
                </div>
                <div className="p-6 bg-background/50 rounded-2xl space-y-2 border border-white/5 backdrop-blur-sm">
                    <h4 className="font-bold flex items-center gap-2 text-sm"><Gamepad2 className="w-4 h-4 text-woman-primary" /> Jeux & Points</h4>
                    <p className="text-[10px] text-muted-foreground">Participez aux quiz et sondages créés par les hommes pour gagner des XP.</p>
                </div>
                <div className="p-6 bg-background/50 rounded-2xl space-y-2 border border-white/5 backdrop-blur-sm">
                    <h4 className="font-bold flex items-center gap-2 text-sm"><Star className="w-4 h-4 text-yellow-500" /> Promotion Gratuite</h4>
                    <p className="text-[10px] text-muted-foreground">Les meilleures notes augmentent votre visibilité gratuitement en tête de liste.</p>
                </div>
                <div className="p-6 bg-background/50 rounded-2xl space-y-2 border border-white/5 backdrop-blur-sm">
                    <h4 className="font-bold flex items-center gap-2 text-sm"><MessageSquare className="w-4 h-4 text-blue-500" /> Médiation Admin</h4>
                    <p className="text-[10px] text-muted-foreground">Un problème ? L'administrateur intervient en direct pour résoudre tout litige.</p>
                </div>
            </div>
         </div>
      </section>

      <footer className="text-center py-10">
        <p className="text-xs text-muted-foreground italic">
            * Note importante : Vos photos de galerie et publications s'effacent automatiquement après 5 mois pour garantir la qualité du réseau.
        </p>
      </footer>
    </div>
  );
}
