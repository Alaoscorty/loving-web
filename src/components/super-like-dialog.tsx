'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Wand2, Loader2, Sparkles, Send, CreditCard, Zap, Banknote } from 'lucide-react';
import { generateSuperLikeAction } from '@/app/actions';
import type { UserProfile } from '@/types/user';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore, useUser } from '@/firebase';
import { sendMessage, getOrCreateConversation, awardPoints } from '@/lib/firebase-actions';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

type Props = {
  womanProfile: UserProfile & { id: string };
  onComplete: () => void;
};

export function SuperLikeDialog({ womanProfile, onComplete }: Props) {
  const { toast } = useToast();
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposals, setProposals] = useState<string[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'xp' | 'cash'>('xp');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProposals([]);
    setSelectedProposal(null);
    const result = await generateSuperLikeAction({
      womanName: womanProfile.name,
      womanBio: womanProfile.bio || '',
      womanHobbies: womanProfile.hobbies,
      womanGoals: womanProfile.goals,
    });

    if ('error' in result) {
      toast({ variant: 'destructive', title: 'Erreur IA', description: result.error });
    } else {
      setProposals(result.proposals);
    }
    setIsGenerating(false);
  };

  const handleSend = async () => {
    if (selectedProposal === null || !user || !firestore) return;
    setIsSending(true);
    try {
      if (paymentMethod === 'xp' && (userProfile?.points || 0) < 30) {
          throw new Error("Points XP insuffisants (30 XP requis).");
      }

      const convoId = await getOrCreateConversation(firestore, user.uid, womanProfile.id);
      await sendMessage({ 
        firestore, 
        conversationId: convoId, 
        senderUid: user.uid, 
        text: `(Super Like IA) ${proposals[selectedProposal]}` 
      });
      
      // Déduire points si XP choisi
      if (paymentMethod === 'xp') {
          await awardPoints({ firestore, userId: user.uid, points: -30 });
      }
      
      toast({ title: 'Super Like envoyé !', description: 'Votre message personnalisé a été transmis.' });
      onComplete();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: e.message || 'Impossible d\'envoyer le message.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 py-4 max-h-[80vh] overflow-y-auto px-1 scrollbar-hide">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-2xl font-headline">
            <Sparkles className="text-man-primary" />
            Super Like IA
        </DialogTitle>
        <DialogDescription>
          Laissez notre IA analyser le profil de {womanProfile.name} pour créer l'accroche parfaite.
        </DialogDescription>
      </DialogHeader>

      {proposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center">
            <Wand2 className="w-8 h-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground max-w-[250px]">
            Analyse de la biographie et des centres d'intérêt pour proposer 3 approches uniques.
          </p>
          <Button onClick={handleGenerate} disabled={isGenerating} className="h-14 px-10 rounded-2xl font-bold shadow-xl">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Générer mon accroche
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Choix du message :</p>
            {proposals.map((p, i) => (
                <button
                key={i}
                onClick={() => setSelectedProposal(i)}
                className={cn(
                    "w-full text-left p-4 rounded-2xl border-2 transition-all text-sm leading-relaxed",
                    selectedProposal === i 
                        ? "border-man-primary bg-man-primary/5 shadow-md scale-[1.02]" 
                        : "border-border hover:border-man-primary/30"
                )}
                >
                "{p}"
                </button>
            ))}
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Mode de règlement :</p>
            <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="grid grid-cols-2 gap-3">
                <div className={cn(
                    "flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer",
                    paymentMethod === 'xp' ? "border-primary bg-primary/5" : "border-border"
                )}>
                    <RadioGroupItem value="xp" id="sl-xp" />
                    <Label htmlFor="sl-xp" className="flex-1 cursor-pointer flex flex-col">
                        <span className="font-bold text-xs">30 XP</span>
                        <span className="text-[8px] opacity-60">Utiliser mon solde</span>
                    </Label>
                    <Zap className="w-4 h-4 text-primary opacity-30" />
                </div>
                <div className={cn(
                    "flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer",
                    paymentMethod === 'cash' ? "border-primary bg-primary/5" : "border-border"
                )}>
                    <RadioGroupItem value="cash" id="sl-cash" />
                    <Label htmlFor="sl-cash" className="flex-1 cursor-pointer flex flex-col">
                        <span className="font-bold text-xs">500 F</span>
                        <span className="text-[8px] opacity-60">Paiement Mobile</span>
                    </Label>
                    <Banknote className="w-4 h-4 text-primary opacity-30" />
                </div>
            </RadioGroup>
          </div>

          <Button variant="ghost" onClick={handleGenerate} disabled={isGenerating} className="w-full text-xs underline">
            Générer de nouvelles idées
          </Button>
        </div>
      )}

      <DialogFooter className="pt-4">
        <Button 
            className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20" 
            disabled={selectedProposal === null || isSending}
            onClick={handleSend}
        >
          {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Confirmer le Super Like
        </Button>
      </DialogFooter>
    </div>
  );
}
