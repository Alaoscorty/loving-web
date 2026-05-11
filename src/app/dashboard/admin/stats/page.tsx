'use client';

import { useMemo } from 'react';
import { collection, query, limit } from 'firebase/firestore';
import { useFirestore, useCollection, useUser } from '@/firebase';
import type { UserProfile } from '@/types/user';
import type { Rendezvous } from '@/types/rendezvous';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    Users, 
    Heart, 
    Banknote, 
    TrendingUp, 
    CheckCircle2, 
    Clock,
    Activity
} from 'lucide-react';
import { 
    PieChart, 
    Pie, 
    Cell, 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip, 
    Legend 
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminStatsPage() {
  const firestore = useFirestore();
  const { userProfile, loading: authLoading } = useUser();

  const usersQuery = useMemo(() => {
    if (!firestore || !userProfile || userProfile.role !== 'admin') return null;
    return query(collection(firestore, 'users'), limit(500));
  }, [firestore, userProfile]);

  const rdvQuery = useMemo(() => {
    if (!firestore || !userProfile || userProfile.role !== 'admin') return null;
    return query(collection(firestore, 'rendezvous'), limit(500));
  }, [firestore, userProfile]);

  const { data: users, loading: loadingUsers } = useCollection<UserProfile>(usersQuery);
  const { data: rendezvous, loading: loadingRdv } = useCollection<Rendezvous>(rdvQuery);

  const stats = useMemo(() => {
    if (!users || !rendezvous || users.length === 0) return null;

    const menCount = users.filter(u => u?.role === 'man').length;
    const womenCount = users.filter(u => u?.role === 'woman').length;

    const completedRdv = rendezvous.filter(r => r?.status === 'completed').length;
    const pendingRdv = rendezvous.filter(r => r?.status === 'pending' || r?.status === 'waiting_payment_validation').length;
    const cancelledRdv = rendezvous.filter(r => r?.status === 'cancelled' || r?.status === 'declined').length;

    const totalRevenue = completedRdv * 2000;

    const roleData = [
      { name: 'Hommes', value: menCount, fill: 'hsl(var(--man-primary))' },
      { name: 'Femmes', value: womenCount, fill: 'hsl(var(--woman-primary))' },
    ];

    const rdvData = [
      { name: 'Complétés', count: completedRdv },
      { name: 'En attente', count: pendingRdv },
      { name: 'Annulés', count: cancelledRdv },
    ];

    return {
      totalUsers: users.length,
      menCount,
      womenCount,
      totalRevenue,
      completedRdv,
      pendingRdv,
      cancelledRdv,
      roleData,
      rdvData
    };
  }, [users, rendezvous]);

  if (authLoading) {
    return (
        <div className="p-8 space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  if (userProfile?.role !== 'admin') {
      return <div className="p-8 text-center font-headline text-muted-foreground">Accès restreint.</div>;
  }

  if (loadingUsers || loadingRdv) {
    return (
      <div className="p-4 md:p-8 space-y-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight font-headline text-primary flex items-center gap-3">
          <Activity className="w-8 h-8" /> Statistiques
        </h1>
        <p className="text-muted-foreground">Activité globale de la plateforme Loving.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Utilisateurs" value={stats?.totalUsers || 0} icon={<Users className="text-blue-500" />} description="Membres inscrits" />
        <StatsCard title="Revenus" value={`${(stats?.totalRevenue || 0).toLocaleString()} FCFA`} icon={<Banknote className="text-green-500" />} description="Basé sur les RDV" />
        <StatsCard title="RDV Réussis" value={stats?.completedRdv || 0} icon={<CheckCircle2 className="text-primary" />} description="Rencontres terminées" />
        <StatsCard title="En attente" value={stats?.pendingRdv || 0} icon={<Clock className="text-orange-500" />} description="Propositions actives" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-3xl border-none bg-card/50 backdrop-blur-sm shadow-xl p-6">
          <h3 className="font-headline font-bold mb-4 flex items-center gap-2"><TrendingUp className="text-accent" /> Répartition des genres</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats?.roleData || []} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {stats?.roleData?.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-3xl border-none bg-card/50 backdrop-blur-sm shadow-xl p-6">
          <h3 className="font-headline font-bold mb-4 flex items-center gap-2"><Heart className="text-primary" /> Statuts des RDV</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.rdvData || []}>
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, description }: { title: string, value: string | number, icon: React.ReactNode, description: string }) {
    return (
        <Card className="rounded-3xl border-none bg-card/50 backdrop-blur-sm shadow-lg p-6">
            <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{title}</span>
                <div className="p-2 bg-muted/50 rounded-xl">{icon}</div>
            </div>
            <div className="text-2xl font-bold font-headline">{value}</div>
            <p className="text-[10px] text-muted-foreground mt-1">{description}</p>
        </Card>
    );
}
