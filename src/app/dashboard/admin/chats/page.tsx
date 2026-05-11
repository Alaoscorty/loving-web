
'use client';

import { useMemo, useState, useEffect } from 'react';
import { collection, query, limit, doc, getDocs, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection, useUser } from '@/firebase';
import type { Conversation } from '@/types/conversation';
import type { Message } from '@/types/message';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, Loader2, Wand2, History, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { aiChatModerator } from '@/ai/flows/ai-chat-moderator';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function ConversationMonitorCard({ convo, onAnalyze, analyzingId, summaries }: any) {
    const firestore = useFirestore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingMsg, setLoadingMsg] = useState(false);

    useEffect(() => {
        const fetchLastMessages = async () => {
            if (!firestore) return;
            setLoadingMsg(true);
            try {
                const msgQuery = query(
                    collection(firestore, 'conversations', convo.id, 'messages'),
                    orderBy('timestamp', 'desc'),
                    limit(6)
                );
                const snap = await getDocs(msgQuery);
                setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)).reverse());
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingMsg(false);
            }
        }
        fetchLastMessages();
    }, [firestore, convo.id]);

    return (
        <Card className="overflow-hidden bg-card/40 border-white/5 shadow-xl transition-all hover:ring-1 hover:ring-primary/20">
            <CardHeader className="flex flex-row items-center justify-between gap-4 p-4 border-b bg-muted/10">
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                        {convo.participantProfiles && Object.values(convo.participantProfiles).map((p: any, i) => (
                            <Avatar key={i} className="border-2 border-background h-8 w-8">
                                <AvatarImage src={p?.photoUrl} />
                                <AvatarFallback className="text-[10px] font-bold">{p?.name?.[0]}</AvatarFallback>
                            </Avatar>
                        ))}
                    </div>
                    <div>
                        <CardTitle className="text-xs font-bold">
                            {convo.participantProfiles ? Object.values(convo.participantProfiles).map((p: any) => p?.name).join(' & ') : 'Chat'}
                        </CardTitle>
                        {convo.updatedAt && (
                            <CardDescription className="text-[9px] uppercase font-bold tracking-tighter">
                                Mise à jour {formatDistanceToNow(new Date(convo.updatedAt), { addSuffix: true, locale: fr })}
                            </CardDescription>
                        )}
                    </div>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-[10px] gap-2 rounded-xl border-primary/20"
                    onClick={() => onAnalyze(convo)}
                    disabled={analyzingId === convo.id}
                >
                    {analyzingId === convo.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3 text-primary" />}
                    Analyser via IA
                </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4 bg-muted/5">
                <div className="space-y-2">
                    <p className="text-[9px] font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-widest">
                        <History className="w-3 h-3" /> 6 derniers échanges :
                    </p>
                    {loadingMsg ? (
                        <Skeleton className="h-20 w-full rounded-xl" />
                    ) : messages.length > 0 ? (
                        <div className="space-y-1.5 p-3 bg-background/40 rounded-xl border border-white/5">
                            {messages.map((msg) => (
                                <div key={msg.id} className={cn(
                                    "flex gap-2 items-start text-[11px] leading-tight",
                                    msg.senderUid === convo.id ? "opacity-100" : "opacity-80"
                                )}>
                                    <span className="font-bold whitespace-nowrap text-primary">{convo.participantProfiles?.[msg.senderUid]?.name?.split(' ')[0]}:</span>
                                    <span className="italic truncate">{msg.text || (msg.imageUrl ? "📷 Photo" : "...")}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[10px] italic text-muted-foreground p-3">Aucun message récent.</p>
                    )}
                </div>
                
                {summaries[convo.id] && (
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl animate-in zoom-in-95">
                        <p className="text-[10px] font-bold text-primary mb-1 flex items-center gap-1 uppercase tracking-widest">
                            <MessageSquare className="w-3 h-3" /> Résumé IA :
                        </p>
                        <p className="text-xs leading-relaxed">{summaries[convo.id]}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function AdminChatsPage() {
  const firestore = useFirestore();
  const { userProfile, loading: authLoading } = useUser();
  const { toast } = useToast();
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, string>>({});

  const convosQuery = useMemo(() => {
    if (!firestore || !userProfile || userProfile.role !== 'admin') return null;
    return query(collection(firestore, 'conversations'), limit(20));
  }, [firestore, userProfile]);

  const { data: rawConversations, loading, error } = useCollection<Conversation>(convosQuery);

  const conversations = useMemo(() => {
    if (!rawConversations) return [];
    return [...rawConversations].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [rawConversations]);

  const handleAnalyze = async (convo: Conversation & { id: string }) => {
    if (!convo.lastMessage?.text) {
        toast({ title: "Données insuffisantes", description: "Il n'y a pas assez de messages pour analyser." });
        return;
    }
    setAnalyzingId(convo.id);
    try {
        const result = await aiChatModerator({ 
            message: convo.lastMessage.text,
            conversationHistory: [convo.lastMessage.text] 
        });

        if (result.summary) {
            setSummaries(prev => ({ ...prev, [convo.id]: result.summary! }));
        }
        
        if (!result.isAppropriate) {
            toast({
                variant: 'destructive',
                title: 'Alerte Modération',
                description: `Raison : ${result.flagReason}`,
            });
        } else {
            toast({ title: 'Analyse terminée', description: 'Aucun comportement suspect détecté.' });
        }
    } catch (e) {
        toast({ variant: 'destructive', title: 'Erreur d\'analyse' });
    } finally {
        setAnalyzingId(null);
    }
  };

  if (authLoading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;
  if (userProfile?.role !== 'admin') return <div className="p-8">Accès restreint aux administrateurs.</div>;

  return (
    <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full animate-in fade-in duration-500">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight font-headline text-primary">Surveillance des Échanges</h1>
        <p className="text-muted-foreground mt-2">Contrôle de la sécurité communautaire via l'IA de Loving.</p>
      </header>

      {error && <p className="text-destructive text-xs mb-4">Erreur lors de la récupération des données.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="h-48 animate-pulse bg-muted/20" />
            ))
        ) : (
            conversations?.map((convo) => (
                <ConversationMonitorCard 
                    key={convo.id} 
                    convo={convo} 
                    onAnalyze={handleAnalyze} 
                    analyzingId={analyzingId} 
                    summaries={summaries} 
                />
            ))
        )}
      </div>
    </div>
  );
}
