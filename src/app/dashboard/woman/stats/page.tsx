'use client';

import { useMemo } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    Wallet, 
    Heart, 
    Zap, 
    Star, 
    CheckCircle2, 
    Users,
    Activity,
    BarChart3,
    ArrowUpRight
} from 'lucide-react';
import { 
    PieChart, 
    Pie, 
    Cell, 
    ResponsiveContainer, 
    Tooltip, 
    Legend 
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { WOMAN_RDV_REWARD_XP, POINTS_CONVERSION_RATE } from '@/lib/firebase-actions';

export default function WomanStatsPage() {
  const firestore = useFirestore();
  const { userProfile, loading: authLoading } = useUser();

  const rdvQuery = useMemo(() => {
    if (!firestore || !userProfile || userProfile.role !== 'woman') return null;
    return query(collection(firestore, 'rendezvous'), where('womanUid', '==', userProfile.uid));
  }, [firestore, userProfile]);

  const { data: rendezvous, loading: loadingRdv } = useCollection<any>(rdvQuery);

  const stats = useMemo(() => {
    if (!rendezvous) return null;

    const totalRequests = rendezvous.length;
    const completed = rendezvous.filter(r => r.status === 'completed').length;
    const accepted = rendezvous.filter(r => r.status === 'accepted').length;
    const pending = rendezvous.filter(r => r.status === 'pending').length;

    const potentialEarnings = completed * WOMAN_RDV_REWARD_XP;

    const rdvData = [
      { name: 'Complétés', value: completed, fill: 'hsl(var(--woman-primary))' },
      { name: 'Acceptés', value: accepted, fill: 'hsl(var(--primary))' },
      { name: 'En attente', value: pending, fill: 'hsl(var(--muted-foreground))' },
    ].filter(d => d.value > 0);

    return {
      totalRequests,
      completed,
      potentialEarnings,
      rdvData
    };
  }, [rendezvous]);

  if (authLoading || loadingRdv) {
    return (
      <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)}
        </div>
        <Skeleton className="h-[400px] w-full rounded-[3rem]" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-10 animate-in fade-in duration-500">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tighter font-headline text-woman-primary flex items-center gap-3">
          <BarChart3 className="w-10 h-10" /> Ma Performance
        </h1>
        <p className="text-muted-foreground text-lg">Suivez l'évolution de vos gains et de votre popularité sur Loving.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Gains RDV" value={`${(stats?.potentialEarnings || 0).toLocaleString()} XP`} icon={<Wallet className="text-green-500" />} description="Générés par les rencontres" />
        <StatsCard title="Invitations" value={stats?.totalRequests || 0} icon={<Heart className="text-primary" />} description="Reçues au total" />
        <StatsCard title="Solde Total" value={userProfile?.points || 0} icon={<Zap className="text-woman-primary fill-woman-primary" />} description="XP convertibles" />
        <StatsCard title="Note Star" value={`${userProfile?.rating?.toFixed(1) || '5.0'}/5`} icon={<Star className="text-yellow-500 fill-yellow-500" />} description="Moyenne des avis" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 rounded-[3rem] border-none bg-card/40 backdrop-blur-md shadow-xl p-8 border border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-headline font-bold flex items-center gap-2">
                <Activity className="text-woman-primary" /> État de vos sollicitations
            </h3>
            <Badge variant="outline" className="rounded-full">{stats?.totalRequests} Reçues</Badge>
          </div>
          
          <div className="h-[300px]">
            {stats?.rdvData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={stats.rdvData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                    {stats.rdvData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm">
                    Aucune donnée d'invitation pour le moment.
                </div>
            )}
          </div>
        </Card>

        <Card className="rounded-[3rem] border-none bg-gradient-to-br from-woman-primary/10 to-accent/5 p-8 border border-woman-primary/10 flex flex-col justify-center space-y-6">
            <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center shadow-lg">
                <ArrowUpRight className="w-8 h-8 text-woman-primary" />
            </div>
            <div className="space-y-1">
                <h4 className="text-lg font-bold font-headline">Valeur Estimée</h4>
                <p className="text-3xl font-black text-primary">{(userProfile?.points || 0) * POINTS_CONVERSION_RATE} FCFA</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Conversion Cash</p>
            </div>
            <div className="p-4 bg-background/50 rounded-2xl border border-white/5 text-[10px] text-muted-foreground italic leading-relaxed">
                "Chaque selfie validé vous rapporte {WOMAN_RDV_REWARD_XP} XP immédiatement. Continuez à être réactive !"
            </div>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, description }: { title: string, value: string | number, icon: React.ReactNode, description: string }) {
    return (
        <Card className="rounded-3xl border-none bg-card/40 backdrop-blur-md shadow-lg p-6 border border-white/5 group hover:translate-y-[-4px] transition-all">
            <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{title}</span>
                <div className="p-2 bg-background rounded-xl shadow-inner group-hover:scale-110 transition-transform">{icon}</div>
            </div>
            <div className="text-3xl font-black font-headline">{value}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">{description}</p>
        </Card>
    );
}
