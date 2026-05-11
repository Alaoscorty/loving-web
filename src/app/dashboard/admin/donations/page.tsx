
'use client';

import { useMemo, useState } from 'react';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, CheckCircle2, XCircle, Loader2, User, Banknote, ImageIcon } from 'lucide-react';
import { validateDonation } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';

export default function AdminDonationsPage() {
  const firestore = useFirestore();
  const { userProfile } = useUser();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const donationsQuery = useMemo(() => {
    if (!firestore || userProfile?.role !== 'admin') return null;
    return query(collection(firestore, 'donations'), orderBy('createdAt', 'desc'));
  }, [firestore, userProfile]);

  const { data: donations, loading } = useCollection<any>(donationsQuery);

  const handleProcess = async (id: string, approved: boolean) => {
    if (!firestore) return;
    setProcessingId(id);
    try {
        await validateDonation({ firestore, donationId: id, approved });
        toast({ title: approved ? 'Don validé et récompense envoyée' : 'Don rejeté' });
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
            <Gift className="text-accent" /> Gestion des Dons
        </h1>
        <p className="text-muted-foreground mt-1">Validez les dons et envoyez les Coffres Mystères.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-3xl" />)
        ) : donations?.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-muted/20 rounded-3xl border-2 border-dashed">
                <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                <p className="mt-4 text-muted-foreground">Aucun don reçu.</p>
            </div>
        ) : (
            donations?.map((donation: any) => (
                <Card key={donation.id} className={`overflow-hidden border-none shadow-xl ${donation.status === 'pending' ? 'ring-2 ring-accent/20 bg-accent/5' : 'bg-card/40 backdrop-blur-md'}`}>
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-background rounded-lg">
                                <User className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-bold">{donation.userName}</CardTitle>
                                <CardDescription className="text-[10px]">
                                    {format(new Date(donation.createdAt), 'dd/MM/yy HH:mm')}
                                </CardDescription>
                            </div>
                        </div>
                        <Badge className="bg-accent text-white font-bold">{donation.amount} FCFA</Badge>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="w-full gap-2 rounded-xl">
                                    <ImageIcon className="w-4 h-4" /> Voir la preuve
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Preuve de Don - {donation.userName}</DialogTitle>
                                </DialogHeader>
                                <div className="relative aspect-video w-full mt-4 rounded-xl overflow-hidden border">
                                    <Image src={donation.proofUrl} alt="Preuve don" fill className="object-contain bg-muted" />
                                </div>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                    <CardFooter className="flex gap-2 border-t p-4 bg-muted/5">
                        {donation.status === 'pending' ? (
                            <>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1 text-destructive"
                                    onClick={() => handleProcess(donation.id, false)}
                                    disabled={processingId === donation.id}
                                >
                                    <XCircle className="w-4 h-4 mr-1" /> Rejeter
                                </Button>
                                <Button 
                                    size="sm" 
                                    className="flex-1 bg-accent hover:bg-accent/90 text-white"
                                    onClick={() => handleProcess(donation.id, true)}
                                    disabled={processingId === donation.id}
                                >
                                    {processingId === donation.id ? <Loader2 className="animate-spin" /> : <Gift className="w-4 h-4 mr-1" />}
                                    Offrir Coffre
                                </Button>
                            </>
                        ) : (
                            <div className="w-full text-center">
                                <Badge className={donation.status === 'approved' ? 'bg-green-500' : 'bg-red-500'}>
                                    {donation.status === 'approved' ? 'VALIDE' : 'REJETE'}
                                </Badge>
                                {donation.validatedAt && (
                                    <p className="text-[9px] text-muted-foreground mt-2">Traité le {format(new Date(donation.validatedAt), 'dd/MM/yy')}</p>
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
