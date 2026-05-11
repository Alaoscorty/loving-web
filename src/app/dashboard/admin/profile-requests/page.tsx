'use client';

import { useMemo, useState } from 'react';
import { collection, query, where, getDoc, doc, updateDoc } from 'firebase/firestore';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, CheckCircle2, XCircle, Loader2, User, MessageSquare, Info } from 'lucide-react';
import { createSubProfile, createNotification } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminProfileRequestsPage() {
  const firestore = useFirestore();
  const { userProfile } = useUser();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const requestsQuery = useMemo(() => {
    if (!firestore || userProfile?.role !== 'admin') return null;
    return query(collection(firestore, 'profileRequests'), where('status', '==', 'pending'));
  }, [firestore, userProfile]);

  const { data: rawRequests, loading } = useCollection<any>(requestsQuery);

  // Tri côté client
  const requests = useMemo(() => {
    if (!rawRequests) return [];
    return [...rawRequests].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [rawRequests]);

  const handleProcess = async (requestId: string, approved: boolean) => {
    if (!firestore) return;
    setProcessingId(requestId);
    try {
        const reqRef = doc(firestore, 'profileRequests', requestId);
        const snap = await getDoc(reqRef);
        const data = snap.data() as any;

        if (approved) {
            const ownerSnap = await getDoc(doc(firestore, 'users', data.ownerUid));
            const owner = ownerSnap.data() as any;
            
            await createSubProfile({
                firestore,
                ownerUid: data.ownerUid,
                role: data.role,
                name: data.name,
                email: owner.email
            });

            await createNotification({
                firestore,
                recipientUid: data.ownerUid,
                title: "Demande approuvée ! 🎉",
                message: `Votre nouveau profil "${data.name}" a été créé avec succès.`,
                type: 'selfie_validated',
                link: '/dashboard/settings'
            });
        } else {
            await createNotification({
                firestore,
                recipientUid: data.ownerUid,
                title: "Demande de profil refusée ❌",
                message: `Votre demande pour le profil "${data.name}" n'a pas été acceptée par l'administrateur.`,
                type: 'rendezvous_declined'
            });
        }

        await updateDoc(reqRef, { status: approved ? 'approved' : 'rejected' });
        toast({ title: approved ? 'Demande approuvée et profil créé' : 'Demande rejetée' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
        setProcessingId(null);
    }
  }

  if (userProfile?.role !== 'admin') return <div className="p-8">Accès restreint.</div>;

  return (
    <div className="flex-1 p-4 md:p-8 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline text-primary flex items-center gap-2">
            <UserPlus className="text-primary" /> Demandes de Profils
        </h1>
        <p className="text-muted-foreground mt-1">Validez les demandes de création de profils supplémentaires.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-3xl" />)
        ) : requests?.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-muted/20 rounded-3xl border-2 border-dashed">
                <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                <p className="mt-4 text-muted-foreground">Aucune demande en attente.</p>
            </div>
        ) : (
            requests?.map((req: any) => (
                <Card key={req.id} className="overflow-hidden border-none shadow-xl bg-card/40 backdrop-blur-md ring-1 ring-white/5">
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-background rounded-lg">
                                <User className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-bold">{req.name}</CardTitle>
                                <CardDescription className="text-[10px]">
                                    {format(new Date(req.createdAt), 'dd/MM/yy HH:mm')}
                                </CardDescription>
                            </div>
                        </div>
                        <Badge variant="outline" className={req.role === 'man' ? 'text-man-primary' : 'text-woman-primary'}>
                            {req.role === 'man' ? 'HOMME' : 'FEMME'}
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" /> Raison invoquée :
                            </p>
                            <p className="text-xs italic bg-muted/30 p-3 rounded-xl">"{req.reason}"</p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <Info className="w-3 h-3" /> Propriétaire : {req.ownerUid.slice(0,8)}...
                        </div>
                    </CardContent>
                    <CardFooter className="flex gap-2 border-t p-4 bg-muted/5">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-destructive hover:bg-destructive/10 rounded-xl"
                            onClick={() => handleProcess(req.id, false)}
                            disabled={processingId === req.id}
                        >
                            <XCircle className="w-4 h-4 mr-1" /> Rejeter
                        </Button>
                        <Button 
                            size="sm" 
                            className="flex-1 bg-primary hover:bg-primary/90 rounded-xl"
                            onClick={() => handleProcess(req.id, true)}
                            disabled={processingId === req.id}
                        >
                            {processingId === req.id ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                            Approuver
                        </Button>
                    </CardFooter>
                </Card>
            ))
        )}
      </div>
    </div>
  );
}
