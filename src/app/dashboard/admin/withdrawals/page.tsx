
'use client';

import { useMemo, useState } from 'react';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Banknote, CheckCircle2, XCircle, Loader2, Clock, User, Phone } from 'lucide-react';
import { processWithdrawal } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminWithdrawalsPage() {
  const firestore = useFirestore();
  const { userProfile } = useUser();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const withdrawalsQuery = useMemo(() => {
    if (!firestore || userProfile?.role !== 'admin') return null;
    return query(collection(firestore, 'withdrawals'), orderBy('createdAt', 'desc'), limit(100));
  }, [firestore, userProfile]);

  const { data: withdrawals, loading } = useCollection<any>(withdrawalsQuery);

  const handleProcess = async (id: string, approved: boolean) => {
    if (!firestore) return;
    setProcessingId(id);
    try {
        await processWithdrawal({ firestore, withdrawalId: id, approved });
        toast({ title: approved ? 'Virement marqué comme effectué' : 'Demande rejetée' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
        setProcessingId(null);
    }
  }

  if (userProfile?.role !== 'admin') return <div className="p-8">Accès restreint.</div>;

  return (
    <div className="flex-1 p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline text-primary flex items-center gap-2">
            <Banknote className="text-green-500" /> Gestion des Retraits
        </h1>
        <p className="text-muted-foreground mt-1">Validez les paiements après avoir effectué le virement manuel.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}><CardHeader><Skeleton className="h-12 w-full" /></CardHeader></Card>
            ))
        ) : withdrawals?.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-muted/20 rounded-3xl border-2 border-dashed">
                <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                <p className="mt-4 text-muted-foreground">Aucune demande de retrait.</p>
            </div>
        ) : (
            withdrawals?.map((w: any) => (
                <Card key={w.id} className={`overflow-hidden border-none shadow-xl ${w.status === 'pending' ? 'ring-2 ring-orange-500/20 bg-orange-500/5' : 'bg-card/40'}`}>
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 p-4">
                        <div className="flex items-center gap-2">
                            <Clock className={`w-4 h-4 ${w.status === 'pending' ? 'text-orange-500' : 'text-muted-foreground'}`} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                {format(new Date(w.createdAt), 'dd/MM/yy HH:mm')}
                            </span>
                        </div>
                        <Badge variant="secondary" className="bg-primary/10 text-primary text-xs font-bold">
                            {w.amount.toLocaleString()} FCFA
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-sm">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="font-bold">{w.userName}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm p-3 bg-background/50 rounded-xl border border-white/5">
                                <Phone className="w-4 h-4 text-green-500" />
                                <span className="font-mono font-bold text-primary">{w.paymentInfo}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted-foreground">
                            <span>Points convertis</span>
                            <span className="text-foreground">{w.points} XP</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex gap-2 border-t p-4">
                        {w.status === 'pending' ? (
                            <>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1 text-destructive"
                                    onClick={() => handleProcess(w.id, false)}
                                    disabled={processingId === w.id}
                                >
                                    <XCircle className="w-4 h-4 mr-1" /> Rejeter
                                </Button>
                                <Button 
                                    size="sm" 
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                                    onClick={() => handleProcess(w.id, true)}
                                    disabled={processingId === w.id}
                                >
                                    {processingId === w.id ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                                    Payé
                                </Button>
                            </>
                        ) : (
                            <div className="w-full text-center">
                                <Badge className={w.status === 'processed' ? 'bg-green-500' : 'bg-red-500'}>
                                    {w.status === 'processed' ? 'TERMINE' : 'REJETE'}
                                </Badge>
                                {w.processedAt && (
                                    <p className="text-[9px] text-muted-foreground mt-2">Traité le {format(new Date(w.processedAt), 'dd/MM/yy')}</p>
                                )}
                            </div>
                        )}
                    </CardFooter>
                </Card>
            ))
        )}
      </div>
    </div>
  );
}
