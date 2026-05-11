'use client';

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { spinWheel, WHEEL_SPIN_COST } from '@/lib/firebase-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2, Gift, Ticket, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const REWARDS = [
    { label: "10 XP", value: 10, color: "bg-blue-500" },
    { label: "50 XP", value: 50, color: "bg-purple-500" },
    { label: "PERDU", value: 0, color: "bg-gray-400" },
    { label: "150 XP", value: 150, color: "bg-green-500" },
    { label: "10 XP", value: 10, color: "bg-blue-500" },
    { label: "PERDU", value: 0, color: "bg-gray-400" },
    { label: "1500 XP", value: 1500, color: "bg-yellow-500" },
    { label: "10 XP", value: 10, color: "bg-blue-500" },
];

export function WheelOfFortune() {
  const { userProfile, user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<any>(null);

  const handleSpin = async () => {
    if (!user || !firestore || (userProfile?.points || 0) < WHEEL_SPIN_COST) {
      toast({ variant: 'destructive', title: 'Points insuffisants', description: `Il vous faut au moins ${WHEEL_SPIN_COST} XP.` });
      return;
    }

    setIsSpinning(true);
    setResult(null);

    // Calcul de l'index gagnant
    const randomIndex = Math.floor(Math.random() * REWARDS.length);
    
    // On veut que le randomIndex finisse sous l'aiguille (en haut)
    // L'aiguille est à 0°. Les segments sont espacés de 45°.
    // Pour que le segment 'i' soit en haut, la roue doit tourner de i * 45° dans le sens anti-horaire (ou 360 - i*45 horaire)
    const segmentAngle = 360 / REWARDS.length;
    const targetRotation = 360 - (randomIndex * segmentAngle);
    
    // On ajoute au moins 5 tours complets pour l'effet visuel
    const extraSpins = 1800; // 5 * 360
    const newRotation = rotation + extraSpins + (targetRotation - (rotation % 360) + 360) % 360;
    
    setRotation(newRotation);

    setTimeout(async () => {
      const reward = REWARDS[randomIndex];
      setResult(reward);
      setIsSpinning(false);
      
      try {
          await spinWheel({ firestore, userId: user.uid, rewardPoints: reward.value });
          if (reward.value >= 1500) {
              toast({ title: 'JACKPOT ! 🎰💎', description: `INCROYABLE ! Vous avez gagné ${reward.label} !` });
          } else if (reward.value > WHEEL_SPIN_COST) {
              toast({ title: 'Gagné ! 💰', description: `Félicitations, vous avez gagné ${reward.label}.` });
          } else if (reward.value > 0) {
              toast({ title: 'Petit lot', description: `Vous avez récupéré ${reward.label}.` });
          } else {
              toast({ title: 'Mince...', description: "Retentez votre chance !" });
          }
      } catch (e) {
          console.error(e);
      }
    }, 4000);
  };

  return (
    <Card className="rounded-[2.5rem] border-none bg-card/40 backdrop-blur-md shadow-2xl overflow-hidden relative border border-white/5">
      <CardHeader className="text-center pb-0">
        <CardTitle className="text-2xl font-headline flex items-center justify-center gap-2">
            <Ticket className="text-primary" /> Roue de la Fortune
        </CardTitle>
        <CardDescription>Tentez de gagner gros pour seulement {WHEEL_SPIN_COST} XP !</CardDescription>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center py-8">
        <div className="relative w-64 h-64 mb-8">
            {/* Arrow */}
            <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-20 w-8 h-10 bg-primary shadow-xl" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
            
            {/* Wheel */}
            <div 
                className="w-full h-full rounded-full border-8 border-card shadow-2xl relative overflow-hidden transition-transform duration-[4000ms] ease-in-out"
                style={{ transform: `rotate(${rotation}deg)` }}
            >
                {REWARDS.map((reward, i) => (
                    <div 
                        key={i}
                        className={cn("absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left", reward.color)}
                        style={{ 
                            transform: `rotate(${i * (360 / REWARDS.length)}deg) skewY(-45deg)`,
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        <span className="absolute bottom-4 left-4 rotate-[45deg] font-bold text-[10px] text-white whitespace-nowrap">
                            {reward.label}
                        </span>
                    </div>
                ))}
            </div>
            
            {/* Center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-card rounded-full shadow-inner flex items-center justify-center z-10">
                <div className="w-4 h-4 bg-primary rounded-full animate-pulse" />
            </div>
        </div>

        {result && (
            <div className="mb-4 text-center animate-in zoom-in duration-500">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Résultat</p>
                <p className={cn("text-3xl font-black", result.value >= 1500 ? "text-yellow-500 animate-bounce" : "text-primary")}>
                    {result.label}
                </p>
            </div>
        )}

        <Button 
            onClick={handleSpin} 
            disabled={isSpinning || (userProfile?.points || 0) < WHEEL_SPIN_COST}
            className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95"
        >
            {isSpinning ? <Loader2 className="animate-spin mr-2" /> : <Zap className="mr-2" />}
            Tourner ({WHEEL_SPIN_COST} XP)
        </Button>
      </CardContent>
    </Card>
  );
}
