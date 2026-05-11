'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    ShieldCheck, 
    BarChart3, 
    Banknote, 
    ShieldAlert, 
    MessageSquare, 
    Verified, 
    Users,
    Activity,
    Lock,
    Gift,
    Camera,
    Wallet,
    Info,
    CheckCircle2,
    Clock
} from 'lucide-react';
import { 
    RENDEZVOUS_FEE_FCFA, 
    BADGE_PREMIUM_FEE_FCFA,
    WITHDRAWAL_FEE_PERCENTAGE,
    POINTS_CONVERSION_RATE
} from '@/lib/firebase-actions';

export default function AdminGuidePage() {
  const responsibilities = [
    {
      title: "Gestion des Paiements",
      icon: <Wallet className="w-6 h-6 text-green-500" />,
      content: `Validez les captures d'écran des frais de RDV (${RENDEZVOUS_FEE_FCFA} FCFA). Votre validation débloque le statut 'payé' et permet la suite du flux.`,
      path: "/dashboard/admin/payments"
    },
    {
      title: "Validations de Rencontres",
      icon: <Camera className="w-6 h-6 text-primary" />,
      content: "Vérifiez les selfies de preuve et la géolocalisation. Cette validation déclenche le statut 'complété' et les récompenses XP.",
      path: "/dashboard/admin/validations"
    },
    {
      title: "Plaintes & Médiation",
      icon: <ShieldAlert className="w-6 h-6 text-destructive" />,
      content: "Surveillez les avis négatifs et les signalements. Vous avez le pouvoir d'ouvrir une conversation directe pour résoudre les conflits.",
      path: "/dashboard/admin/complaints"
    },
    {
      title: "Certification Premium",
      icon: <Verified className="w-6 h-6 text-blue-500" />,
      content: `Traitez les demandes de Badge Bleu (${BADGE_PREMIUM_FEE_FCFA} FCFA). Vérifiez le virement avant d'activer la certification pour 30 jours.`,
      path: "/dashboard/admin/verifications"
    }
  ];

  return (
    <div className="flex-1 p-4 md:p-10 max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
            <Lock className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold font-headline tracking-tighter">Console Administrative</h1>
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">
            Vous êtes le modérateur et le banquier de la plateforme. Votre réactivité garantit la confiance des utilisateurs et la rentabilité du système.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {responsibilities.map((task, i) => (
            <Card key={i} className="rounded-3xl border-none bg-card/40 backdrop-blur-md shadow-xl border border-white/5 overflow-hidden">
                <CardHeader className="flex flex-row items-center gap-4 bg-muted/20 p-6">
                    <div className="p-3 rounded-xl bg-background shadow-sm">
                        {task.icon}
                    </div>
                    <CardTitle className="text-lg font-headline">{task.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                        {task.content}
                    </p>
                    <Badge variant="outline" className="text-[9px] border-primary/20 text-primary uppercase font-bold tracking-widest">Action Requise</Badge>
                </CardContent>
            </Card>
        ))}
      </div>

      <section className="space-y-6">
         <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
            <Gift className="text-accent" /> Gestion des Dons & Coffres
         </h2>
         <Card className="rounded-[2.5rem] border-none bg-accent/5 p-8 border border-accent/10">
            <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Lorsqu'un utilisateur fait un don (MoMo/Airtel), vérifiez la preuve dans la section dédiée. Votre validation crée automatiquement un document spécial qui débloque un <strong>Coffre Mystère</strong> sur son dashboard.
                    </p>
                    <Badge className="bg-accent text-white">Nouveauté</Badge>
                </div>
                <div className="w-32 h-32 bg-background rounded-3xl flex items-center justify-center shadow-inner">
                    <Gift className="w-16 h-16 text-accent animate-bounce" />
                </div>
            </div>
         </Card>
      </section>

      <section className="space-y-6">
         <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
            <Activity className="text-blue-500" /> Flux Financier (Retraits)
         </h2>
         <Card className="rounded-[2.5rem] border-none bg-blue-500/5 p-8 md:p-12 border border-blue-500/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
                <div className="space-y-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold mx-auto md:mx-0 shadow-lg">1</div>
                    <h4 className="font-bold text-sm">Prélèvement Auto</h4>
                    <p className="text-[10px] text-muted-foreground">Le système déduit automatiquement <strong>{WITHDRAWAL_FEE_PERCENTAGE * 100}%</strong> de frais de plateforme sur chaque demande.</p>
                </div>
                <div className="space-y-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold mx-auto md:mx-0 shadow-lg">2</div>
                    <h4 className="font-bold text-sm">Virement Manuel</h4>
                    <p className="text-[10px] text-muted-foreground">Effectuez le virement MoMo/Airtel du montant <strong>net</strong> affiché dans votre console de gestion des retraits.</p>
                </div>
                <div className="space-y-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold mx-auto md:mx-0 shadow-lg">3</div>
                    <h4 className="font-bold text-sm">Confirmation</h4>
                    <p className="text-[10px] text-muted-foreground">Cliquez sur 'Payé'. Une notification de succès est immédiatement envoyée à l'utilisateur.</p>
                </div>
            </div>
         </Card>
      </section>

      <Card className="rounded-[2.5rem] border-none bg-primary/5 p-8 border border-primary/10">
        <div className="flex items-center gap-4 mb-4">
            <BarChart3 className="text-primary w-8 h-8" />
            <h3 className="font-bold font-headline text-xl">Surveillance Intelligence Artificielle</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
            Utilisez la page <strong>Surveillance Chat</strong> pour analyser les échanges. Notre IA détecte les comportements inappropriés et génère des résumés de conversations pour vous faire gagner du temps lors des médiations.
        </p>
      </Card>

      <footer className="flex justify-between items-center px-4">
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-2">
            <Clock className="w-3 h-3" /> Loving Admin v1.2
        </p>
        <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            <span className="text-[10px] font-bold text-green-600">SYSTÈME OPÉRATIONNEL</span>
        </div>
      </footer>
    </div>
  );
}
