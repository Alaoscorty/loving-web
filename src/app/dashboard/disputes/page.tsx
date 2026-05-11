'use client';

import { useMemo, useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
    ShieldAlert, 
    MessageCircle, 
    AlertCircle, 
    CheckCircle2, 
    Clock, 
    Plus, 
    Loader2, 
    HelpCircle,
    AtSign,
    User,
    Check
} from 'lucide-react';
import { submitReview, getOrCreateAdminConversation } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function DisputesPage() {
  const firestore = useFirestore();
  const { userProfile, activeProfileId } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewDisputeOpen, setIsNewDisputeOpen] = useState(false);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // Form states
  const [targetName, setTargetName] = useState('');
  const [targetUid, setTargetUid] = useState('GENERAL_SUPPORT');
  const [description, setDescription] = useState('');

  const disputesQuery = useMemo(() => {
    if (!firestore || !activeProfileId) return null;
    return query(
      collection(firestore, 'reviews'),
      where('fromUid', '==', activeProfileId),
      where('isComplaint', '==', true)
    );
  }, [firestore, activeProfileId]);

  const { data: rawDisputes, loading } = useCollection<any>(disputesQuery);

  // Tri côté client
  const disputes = useMemo(() => {
    if (!rawDisputes) return [];
    return [...rawDisputes].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [rawDisputes]);

  // Charger les contacts récents pour l'indexation @
  useEffect(() => {
    const fetchContacts = async () => {
        if (!firestore || !activeProfileId) return;
        setIsLoadingContacts(true);
        try {
            const q = query(collection(firestore, 'conversations'), where('participants', 'array-contains', activeProfileId));
            const snap = await getDocs(q);
            const profiles: any[] = [];
            snap.docs.forEach(doc => {
                const data = doc.data();
                const otherId = data.participants.find((p: string) => p !== activeProfileId);
                if (otherId && data.participantProfiles?.[otherId]) {
                    profiles.push({
                        id: otherId,
                        ...data.participantProfiles[otherId]
                    });
                }
            });
            setContacts(profiles);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingContacts(false);
        }
    };
    if (isNewDisputeOpen) fetchContacts();
  }, [firestore, activeProfileId, isNewDisputeOpen]);

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !userProfile || !targetName.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
        await submitReview({
            firestore,
            review: {
                fromUid: activeProfileId!,
                fromName: userProfile.name,
                targetUid: targetUid,
                targetName: targetName.replace('@', ''),
                rendezvousId: 'GENERAL',
                stars: 1,
                text: description,
                isComplaint: true,
                createdAt: new Date().toISOString(),
            }
        });

        toast({ title: 'Signalement envoyé', description: 'Un administrateur va examiner votre demande.' });
        setIsNewDisputeOpen(false);
        setTargetName('');
        setTargetUid('GENERAL_SUPPORT');
        setDescription('');
    } catch (e) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'envoyer le signalement.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleContactAdmin = async () => {
    if (!firestore || !activeProfileId) return;
    setIsOpeningChat(true);
    try {
        await getOrCreateAdminConversation(firestore, activeProfileId);
        router.push('/dashboard/messages');
    } catch (e) {
        toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
        setIsOpeningChat(false);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-10 max-w-5xl mx-auto w-full space-y-10 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tighter font-headline text-primary flex items-center gap-3">
                <ShieldAlert className="w-10 h-10 text-destructive" /> Support & Litiges
            </h1>
            <p className="text-muted-foreground text-lg">Signalez un comportement suspect ou résolvez un différend.</p>
        </div>
        
        <Dialog open={isNewDisputeOpen} onOpenChange={setIsNewDisputeOpen}>
            <DialogTrigger asChild>
                <Button className="h-14 px-8 rounded-2xl font-bold gap-2 shadow-xl shadow-primary/20">
                    <Plus className="w-5 h-5" /> Nouveau signalement
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-headline flex items-center gap-2">
                        <AlertCircle className="text-destructive" /> Déposer une plainte
                    </DialogTitle>
                    <DialogDescription>
                        Désignez la personne concernée avec "@" ou expliquez votre problème.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateDispute} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Personne concernée</label>
                        <div className="relative">
                            <Input 
                                placeholder="Tapez @ pour choisir un membre..." 
                                value={targetName}
                                onChange={(e) => {
                                    setTargetName(e.target.value);
                                    if (!e.target.value.includes('@')) setTargetUid('GENERAL_SUPPORT');
                                }}
                                required
                                className="h-12 rounded-xl pl-10"
                            />
                            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            
                            {targetName.includes('@') && (
                                <div className="absolute z-50 w-full mt-1 bg-card border rounded-xl shadow-2xl max-h-40 overflow-y-auto p-1 animate-in slide-in-from-top-2">
                                    {isLoadingContacts ? (
                                        <div className="p-4 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
                                    ) : contacts.length > 0 ? (
                                        contacts.map(contact => (
                                            <button
                                                key={contact.id}
                                                type="button"
                                                onClick={() => {
                                                    setTargetName(`@${contact.name}`);
                                                    setTargetUid(contact.id);
                                                }}
                                                className="flex items-center gap-3 w-full p-2 hover:bg-muted rounded-lg transition-colors"
                                            >
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                                                    {contact.name[0]}
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-xs font-bold">{contact.name}</p>
                                                    <p className="text-[8px] text-muted-foreground uppercase">{contact.role}</p>
                                                </div>
                                                {targetUid === contact.id && <Check className="ml-auto w-3 h-3 text-primary" />}
                                            </button>
                                        ))
                                    ) : (
                                        <p className="p-3 text-[10px] text-center text-muted-foreground">Aucun contact récent trouvé.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Description détaillée</label>
                        <Textarea 
                            placeholder="Expliquez ce qui s'est passé..." 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            className="min-h-[120px] rounded-xl"
                        />
                    </div>
                    <Button type="submit" className="w-full h-14 rounded-2xl font-bold" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <ShieldAlert className="mr-2" />}
                        Envoyer ma plainte
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-2 rounded-[2.5rem] border-none bg-card/40 backdrop-blur-md shadow-xl border border-white/5 overflow-hidden">
            <CardHeader className="border-b bg-muted/10 p-8">
                <CardTitle className="text-xl font-headline flex items-center gap-2">
                    <Clock className="text-primary w-5 h-5" /> Mes réclamations
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {loading ? (
                    <div className="p-8 space-y-4">
                        <Skeleton className="h-20 w-full rounded-2xl" />
                        <Skeleton className="h-20 w-full rounded-2xl" />
                    </div>
                ) : !disputes || disputes.length === 0 ? (
                    <div className="p-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-20">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <p className="text-muted-foreground font-medium">Vous n'avez aucun litige en cours.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {disputes.map((dispute: any) => (
                            <div key={dispute.id} className="p-6 hover:bg-muted/10 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-sm">Cible : {dispute.targetName}</h4>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                            {format(new Date(dispute.createdAt), 'dd MMMM yyyy', { locale: fr })}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className={cn(
                                        "text-[9px] font-bold uppercase",
                                        dispute.status === 'resolved' ? "text-green-500 border-green-500/20" : "text-orange-500 border-orange-500/20"
                                    )}>
                                        {dispute.status === 'resolved' ? 'Résolu' : 'En attente'}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 italic">"{dispute.text}"</p>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>

        <div className="space-y-6">
            <Card className="rounded-[2.5rem] border-none bg-primary/10 shadow-xl border border-primary/20 overflow-hidden relative group">
                <CardHeader className="p-8">
                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                        <User className="text-white" />
                    </div>
                    <CardTitle className="text-xl font-headline">Aide en direct</CardTitle>
                    <CardDescription>Besoin d'une médiation immédiate ? Discutez avec un admin.</CardDescription>
                </CardHeader>
                <CardFooter className="p-8 pt-0">
                    <Button 
                        onClick={handleContactAdmin} 
                        disabled={isOpeningChat}
                        className="w-full h-12 rounded-xl font-bold gap-2"
                    >
                        {isOpeningChat ? <Loader2 className="animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                        Ouvrir le chat support
                    </Button>
                </CardFooter>
            </Card>

            <Card className="rounded-[2.5rem] border-none bg-muted/20 p-8 space-y-4">
                <h4 className="font-bold text-sm flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-primary" /> Rappel de sécurité
                </h4>
                <div className="space-y-3">
                    <div className="flex gap-3">
                        <div className="w-1 h-1 rounded-full bg-primary mt-2 shrink-0" />
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                            L'indexation "@" permet d'identifier formellement l'utilisateur visé par votre plainte.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <div className="w-1 h-1 rounded-full bg-primary mt-2 shrink-0" />
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                            Seuls les administrateurs ont accès à ces informations pour garantir votre sécurité.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
}
