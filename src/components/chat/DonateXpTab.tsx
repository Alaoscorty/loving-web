'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { transferXp } from '@/lib/firebase-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Gift, Loader2, Sparkles, User, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { doc } from 'firebase/firestore';

export function DonateXpTab({ selectedConversationId }: { selectedConversationId: string | null }) {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);

  // 1. Essayer de récupérer le destinataire si une conversation est active
  const conversationRef = useMemo(() => {
    if (!firestore || !selectedConversationId) return null;
    return doc(firestore, 'conversations', selectedConversationId);
  }, [firestore, selectedConversationId]);

  const { data: conversation } = useDoc<any>(conversationRef);

  const otherParticipantId = useMemo(() => {
      if (!conversation || !user) return null;
      return conversation.participants.find((p: string) => p !== user.uid);
  }, [conversation, user]);

  const otherProfileRef = useMemo(() => {
      if (!firestore || !otherParticipantId) return null;
      return doc(firestore, 'users', otherParticipantId);
  }, [firestore, otherParticipantId]);

  const { data: otherProfile } = useDoc<any>(otherProfileRef);

  const handleSendXp = async () => {
    if (!user || !firestore || !otherParticipantId || !amount) return;
    const val = parseInt(amount);
    if (isNaN(val) || val <= 0) return;

    setIsSending(true);
    try {
        await transferXp({
            firestore,
            fromUserId: user.uid,
            toUserId: otherParticipantId,
            amount: val
        });
        toast({ title: 'Transfert réussi ! 🎁', description: `Vous avez envoyé ${val} XP à ${otherProfile?.name}.` });
        setAmount('');
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Erreur', description: e.message });
    } finally {
        setIsSending(false);
    }
  };

  if (!selectedConversationId) {
      return (
          <div className="p-10 text-center space-y-4 opacity-40">
              <Gift className="w-12 h-12 mx-auto" />
              <p className="text-sm">Sélectionnez une discussion pour envoyer des points XP.</p>
          </div>
      );
  }

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
        <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Gift className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-headline font-bold">Faire un Cadeau XP</h3>
            <p className="text-xs text-muted-foreground">Envoyez des points à votre interlocuteur pour lui faire plaisir.</p>
        </div>

        <div className="p-4 bg-muted/20 rounded-[2rem] border border-white/5 space-y-4">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={otherProfile?.photoUrl} className="object-cover" />
                        <AvatarFallback>{otherProfile?.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <p className="font-bold text-sm truncate max-w-[120px]">{otherProfile?.name}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Votre Solde</p>
                    <p className="text-sm font-black text-primary">{userProfile?.points || 0} XP</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="relative">
                    <Input 
                        type="number" 
                        placeholder="Montant (ex: 50)" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="h-14 rounded-2xl bg-background/50 border-white/10 pl-12 font-bold text-lg"
                    />
                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">XP</div>
                </div>

                <Button 
                    className="w-full h-14 rounded-2xl font-bold shadow-xl shadow-primary/20 gap-2"
                    disabled={isSending || !amount || parseInt(amount) <= 0 || parseInt(amount) > (userProfile?.points || 0)}
                    onClick={handleSendXp}
                >
                    {isSending ? <Loader2 className="animate-spin w-5 h-5" /> : <Gift className="w-5 h-5" />}
                    Confirmer l'envoi
                </Button>
            </div>
        </div>

        <div className="p-4 bg-primary/5 rounded-2xl flex gap-3 border border-primary/10">
            <Sparkles className="w-5 h-5 text-primary shrink-0" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
                Les transferts de points sont irréversibles. Le destinataire pourra convertir ces XP en argent réel dès qu'il atteindra le seuil de retrait.
            </p>
        </div>
    </div>
  );
}
