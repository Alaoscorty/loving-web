'use client';

import { useMemo, useState } from 'react';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, MessageCircle, Star, ShieldAlert, CheckCircle2, Loader2, User, ChevronRight } from 'lucide-react';
import { getOrCreateConversation } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { Review } from '@/types/review';
import { cn } from '@/lib/utils';

export default function AdminComplaintsPage() {
  const firestore = useFirestore();
  const { userProfile, activeProfileId } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [openingChat, setOpeningChat] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const complaintsQuery = useMemo(() => {
    if (!firestore || userProfile?.role !== 'admin') return null;
    return query(
      collection(firestore, 'reviews'),
      where('isComplaint', '==', true)
    );
  }, [firestore, userProfile]);

  const { data: rawComplaints, loading } = useCollection<Review>(complaintsQuery);

  // Tri côté client
  const complaints = useMemo(() => {
    if (!rawComplaints) return [];
    return [...rawComplaints].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [rawComplaints]);

  const handleStartChat = async (targetUid: string) => {
    if (!firestore || !activeProfileId) return;
    setOpeningChat(targetUid);
    try {
        await getOrCreateConversation(firestore, activeProfileId, targetUid);
        toast({ title: 'Redirection vers le chat...', description: 'Ouverture de la discussion sécurisée.' });
        router.push('/dashboard/messages');
    } catch (e) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'ouvrir la conversation.' });
    } finally {
        setOpeningChat(null);
    }
  }

  const handleResolve = async (id: string) => {
      if (!firestore) return;
      setProcessingId(id);
      try {
          await updateDoc(doc(firestore, 'reviews', id), { status: 'resolved' });
          toast({ title: 'Litige marqué comme résolu' });
      } finally {
          setProcessingId(null);
      }
  }

  if (userProfile?.role !== 'admin') return <div className="p-8 text-center text-muted-foreground">Accès restreint.</div>;

  return (
    <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full animate-in fade-in duration-500">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight font-headline text-primary flex items-center gap-3">
            <ShieldAlert className="text-destructive w-10 h-10" /> Centre de Litiges
        </h1>
        <p className="text-muted-foreground mt-2">Gérez les plaintes et initiez des médiations directes.</p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-3xl" />)
        ) : complaints?.length === 0 ? (
            <div className="py-20 text-center bg-muted/20 rounded-[3rem] border-2 border-dashed border-white/10">
                <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 opacity-20" />
                <p className="mt-4 text-muted-foreground font-headline text-xl">Tout est calme sur Loving !</p>
            </div>
        ) : (
            complaints?.map((review) => (
                <Card key={review.id} className={cn(
                    "rounded-[2.5rem] border-none shadow-xl overflow-hidden ring-1 ring-white/5 transition-all",
                    review.status === 'resolved' ? "bg-card/20 opacity-70" : "bg-card/40 backdrop-blur-md"
                )}>
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-destructive/10 text-destructive rounded-2xl">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold">Signalement de {review.fromName}</CardTitle>
                                <CardDescription className="text-xs uppercase font-bold tracking-widest flex items-center gap-2">
                                    Contre {review.targetName} • {format(new Date(review.createdAt), 'dd MMMM à HH:mm', { locale: fr })}
                                </CardDescription>
                            </div>
                        </div>
                        <Badge variant="outline" className={cn(
                            "px-4 py-1 rounded-full font-bold",
                            review.status === 'resolved' ? "text-green-500 border-green-500/20" : "text-orange-500 border-orange-500/20 animate-pulse"
                        )}>
                            {review.status === 'resolved' ? 'RÉSOLU' : 'À TRAITER'}
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="p-6 bg-background/50 rounded-3xl italic text-base leading-relaxed border border-white/5 relative">
                            <span className="absolute top-4 left-4 text-4xl text-primary/10 font-serif">"</span>
                            {review.text}
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase text-muted-foreground tracking-widest pl-4">
                            <div className="flex items-center gap-1.5"><User className="w-3 h-3" /> ID Plaignant: {review.fromUid.slice(0,8)}</div>
                            <div className="flex items-center gap-1.5"><User className="w-3 h-3" /> ID Cible: {review.targetUid.slice(0,8)}</div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/10 p-4 border-t flex flex-wrap justify-end gap-3">
                        {review.status !== 'resolved' && (
                            <Button 
                                variant="outline" 
                                className="rounded-xl h-12 px-6 font-bold border-green-500/20 text-green-600 hover:bg-green-500/5"
                                onClick={() => handleResolve(review.id!)}
                                disabled={processingId === review.id}
                            >
                                {processingId === review.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                Marquer comme résolu
                            </Button>
                        )}
                        <Button 
                            variant="secondary" 
                            className="rounded-xl h-12 px-8 font-bold gap-2 shadow-lg"
                            onClick={() => handleStartChat(review.fromUid)}
                            disabled={openingChat === review.fromUid}
                        >
                            {openingChat === review.fromUid ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                            Discuter avec le plaignant
                        </Button>
                        {review.targetUid !== 'GENERAL_SUPPORT' && (
                            <Button 
                                variant="outline" 
                                className="rounded-xl h-12 px-8 font-bold gap-2"
                                onClick={() => handleStartChat(review.targetUid)}
                                disabled={openingChat === review.targetUid}
                            >
                                 {openingChat === review.targetUid ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
                                 Discuter avec l'accusé
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            ))
        )}
      </div>
    </div>
  );
}
