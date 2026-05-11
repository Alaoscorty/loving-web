
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Sparkles, Loader2 } from 'lucide-react';
import { awardPoints } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function MysteryBox() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [reward, setReward] = useState<string | null>(null);
  const [currentRdvId, setCurrentRdvId] = useState<string | null>(null);

  const boxQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'rendezvous'),
      where('status', '==', 'completed'),
      where('mysteryBoxClaimed', '==', false),
      where('manUid', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: boxes } = useCollection<any>(boxQuery);

  useEffect(() => {
    if (boxes && boxes.length > 0 && !isOpen && !reward) {
      setCurrentRdvId(boxes[0].id);
      setIsOpen(true);
    }
  }, [boxes, isOpen, reward]);

  const handleOpenBox = async () => {
    if (!firestore || !user || !currentRdvId) return;
    setIsOpening(true);

    await new Promise(r => setTimeout(r, 2000));

    const rewards = [
      { label: "50 Points", points: 50 },
      { label: "Badge 'VIP Loyal'", points: 10 },
      { label: "Super Like", points: 20 },
    ];
    const randomReward = rewards[Math.floor(Math.random() * rewards.length)];

    try {
      await updateDoc(doc(firestore, 'rendezvous', currentRdvId), {
        mysteryBoxClaimed: true
      });
      await awardPoints({ firestore, userId: user.uid, points: randomReward.points });
      setReward(randomReward.label);
      toast({ title: 'Félicitations !', description: `Vous avez gagné : ${randomReward.label}` });
    } catch (e) {
      console.error(e);
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => {
        if (!isOpening) setIsOpen(v);
    }}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline flex items-center justify-center gap-2">
            <Gift className="text-primary w-8 h-8" />
            Coffre Mystère !
          </DialogTitle>
          <DialogDescription>
            Votre rendez-vous est terminé. Ouvrez votre récompense !
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-8 flex flex-col items-center justify-center">
          {reward ? (
            <div className="animate-in zoom-in duration-500 text-center space-y-4">
              <Sparkles className="w-16 h-16 text-yellow-500 mx-auto" />
              <p className="text-3xl font-bold text-primary">{reward}</p>
            </div>
          ) : (
            <div className={cn("relative p-8 rounded-full bg-primary/10", isOpening && "animate-bounce")}>
              <Gift className="w-20 h-20 text-primary" />
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-center">
          {reward ? (
            <Button onClick={() => {
                setIsOpen(false);
                setReward(null);
            }} className="w-full">Génial !</Button>
          ) : (
            <Button onClick={handleOpenBox} disabled={isOpening} className="w-full">
              {isOpening ? <Loader2 className="animate-spin mr-2" /> : "Ouvrir le coffre"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
