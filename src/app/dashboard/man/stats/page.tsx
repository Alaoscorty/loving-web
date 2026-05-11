'use client';

import { useMemo } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    TrendingUp, 
    Heart, 
    Zap, 
    Star, 
    CheckCircle2, 
    Clock,
    Activity,
    BarChart3
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

export default function ManStatsPage() {
  const firestore = useFirestore();
  const { userProfile, loading: authLoading } = useUser();

  const rdvQuery = useMemo(() => {
    if (!firestore || !userProfile || userProfile.role !== 'man') return null;
    return query(collection(firestore, 'rendezvous'), where('manUid', '==', userProfile.uid));
  }, [firestore, userProfile]);

  const { data: rendezvous, loading: loadingRdv } = useCollection<any>(rdvQuery);

  const stats = useMemo(() => {
    if (!rendezvous) return null;

    const total = rendezvous.length;
    const completed = rendezvous.filter(r => r.status === 'completed').length;
    const accepted = rendezvous.filter(r => r.status === 'accepted').length;
    const declined = rendezvous.filter(r => r.status === 'declined').length;
    const pending = rendezvous.filter(r => r.status === 'pending').length;

    const successRate = total > 0 ? Math.round(((completed + accepted) / total) * 100) : 0;

    const rdvData = [
      { name: 'Acceptés/Finis', value: completed + accepted, fill: 'hsl(var(--primary))' },
      { name: 'En attente', value: pending, fill: 'hsl(var(--man-primary))' },
      { name: 'Refusés', value: declined, fill: 'hsl(var(--muted-foreground))' },
    ].filter(d => d.value > 0);

    return {
      total,
      completed,
      successRate,
      pending,
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
        <h1 className="text-4xl font-bold tracking-tighter font-headline text-man-primary flex items-center gap-3">
          <BarChart3 className="w-10 h-10" /> Mes Statistiques
        </h1>
        <p className="text-muted-foreground text-lg">Analysez votre impact et optimisez vos chances de succès.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Invitations" value={stats?.total || 0} icon={<Heart className="text-primary" />} description="Total envoyé" />
        <StatsCard title="Succès" value={`${stats?.successRate || 0}%`} icon={<TrendingUp className="text-green-500" />} description="Taux d'acceptation" />
        <StatsCard title="Points XP" value={userProfile?.points || 0} icon={<Zap className="text-man-primary fill-man-primary" />} description="Solde actuel" />
        <StatsCard title="Note Moyenne" value={`${userProfile?.rating?.toFixed(1) || '5.0'}/5`} icon={<Star className="text-yellow-500 fill-yellow-500" />} description="Avis des femmes" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 rounded-[3rem] border-none bg-card/40 backdrop-blur-md shadow-xl p-8 border border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-headline font-bold flex items-center gap-2">
                <Activity className="text-man-primary" /> Statuts de vos propositions
            </h3>
            <Badge variant="outline" className="rounded-full">{stats?.total} Total</Badge>
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
                    Pas assez de données pour générer un graphique.
                </div>
            )}
          </div>
        </Card>

        <Card className="rounded-[3rem] border-none bg-man-primary/5 p-8 border border-man-primary/10 flex flex-col justify-center text-center space-y-6">
            <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto shadow-xl">
                <CheckCircle2 className="w-10 h-10 text-man-primary" />
            </div>
            <div className="space-y-2">
                <h4 className="text-2xl font-bold font-headline">{stats?.completed || 0}</h4>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">RDV Réels validés</p>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                "Chaque rendez-vous validé par selfie renforce votre score de confiance et votre visibilité."
            </p>
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
