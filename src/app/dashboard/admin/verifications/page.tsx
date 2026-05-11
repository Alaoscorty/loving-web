
'use client';

import { useMemo, useState } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore, useCollection, useUser } from '@/firebase';
import type { UserProfile } from '@/types/user';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Verified, CheckCircle2, XCircle, Loader2, Banknote, ImageIcon, MessageSquare } from 'lucide-react';
import { toggleUserVerification } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

export default function AdminVerificationsPage() {
  const firestore = useFirestore();
  const { userProfile } = useUser();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [userToReject, setUserToReject] = useState<string | null>(null);

  const pendingQuery = useMemo(() => {
    if (!firestore || userProfile?.role !== 'admin') return null;
    return query(collection(firestore, 'users'), where('verificationStatus', '==', 'pending'));
  }, [firestore, userProfile]);

  const { data: pendingUsers, loading } = useCollection<UserProfile>(pendingQuery);

  const handleVerify = async (userId: string, active: boolean) => {
    if (!firestore) return;
    setProcessingId(userId);
    try {
        await toggleUserVerification(firestore, userId, active, !active ? rejectionReason : undefined);
        toast({ title: active ? 'Badge activé !' : 'Demande rejetée' });
        setIsRejectDialogOpen(false);
        setRejectionReason('');
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
            <Verified className="text-blue-500 fill-blue-500" /> Demandes de Certification
        </h1>
        <p className="text-muted-foreground mt-1">Validez les badges bleus après réception du paiement (15 000 FCFA).</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}><CardHeader><Skeleton className="h-12 w-full" /></CardHeader></Card>
            ))
        ) : pendingUsers?.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-muted/20 rounded-3xl border-2 border-dashed">
                <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                <p className="mt-4 text-muted-foreground font-medium">Aucune demande en attente.</p>
            </div>
        ) : (
            pendingUsers?.map((user) => (
                <Card key={user.uid} className="overflow-hidden border-none shadow-xl bg-card/40 backdrop-blur-md ring-1 ring-white/5">
                    <CardHeader className="flex flex-row items-center gap-4 bg-blue-500/5 p-4 border-b">
                        <Avatar className="h-10 w-10 border-2 border-background">
                            <AvatarImage src={user.photoUrl} className="object-cover" />
                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <CardTitle className="text-sm font-bold">{user.name}</CardTitle>
                            <CardDescription className="text-[10px] uppercase font-bold tracking-widest">{user.role}</CardDescription>
                        </div>
                        <Badge className="bg-blue-500 text-white font-black">15 000 F</Badge>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Banknote className="w-3 h-3 text-green-500" />
                            <span className="font-mono">{user.email}</span>
                        </div>
                        
                        {user.verificationProofUrl ? (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-full gap-2 rounded-xl border-blue-500/20 text-blue-600 bg-blue-500/5 font-bold">
                                        <ImageIcon className="w-4 h-4" /> Voir la preuve
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl rounded-3xl overflow-hidden">
                                    <DialogHeader>
                                        <DialogTitle className="font-headline">Preuve de paiement - {user.name}</DialogTitle>
                                    </DialogHeader>
                                    <div className="relative aspect-video w-full mt-4 rounded-2xl overflow-hidden border bg-muted">
                                        <Image src={user.verificationProofUrl} alt="Preuve badge" fill className="object-contain" />
                                    </div>
                                </DialogContent>
                            </Dialog>
                        ) : (
                            <div className="p-3 bg-muted/30 rounded-xl text-center">
                                <p className="text-[10px] text-muted-foreground italic">Paiement FedaPay ou direct (aucune capture)</p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex gap-2 border-t pt-4 bg-muted/5 p-4">
                        <Dialog open={isRejectDialogOpen && userToReject === user.uid} onOpenChange={(o) => {
                            if(!o) { setIsRejectDialogOpen(false); setUserToReject(null); setRejectionReason(''); }
                        }}>
                            <DialogTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="flex-1 text-destructive hover:bg-destructive/10 rounded-xl font-bold"
                                    onClick={() => { setUserToReject(user.uid); setIsRejectDialogOpen(true); }}
                                >
                                    <XCircle className="w-4 h-4 mr-2" /> Refuser
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-[2rem] sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="font-headline text-2xl flex items-center gap-2">
                                        <MessageSquare className="text-destructive" /> Motif du refus
                                    </DialogTitle>
                                    <CardDescription>Expliquez à l'utilisateur pourquoi son badge a été refusé.</CardDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    <Input 
                                        placeholder="Ex: Image floue, montant incorrect..." 
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        className="rounded-xl h-12"
                                    />
                                </div>
                                <DialogFooter>
                                    <Button 
                                        variant="destructive" 
                                        className="w-full h-12 rounded-xl font-bold"
                                        disabled={!rejectionReason.trim() || processingId === user.uid}
                                        onClick={() => handleVerify(user.uid, false)}
                                    >
                                        Confirmer le refus
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Button 
                            size="sm" 
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white shadow-lg rounded-xl font-bold"
                            onClick={() => handleVerify(user.uid, true)}
                            disabled={processingId === user.uid}
                        >
                            {processingId === user.uid ? <Loader2 className="animate-spin" /> : <Verified className="w-4 h-4 mr-2" />}
                            Activer
                        </Button>
                    </CardFooter>
                </Card>
            ))
        )}
      </div>
    </div>
  );
}
