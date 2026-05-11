
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { claimSocialReward, SOCIAL_FOLLOW_REWARD_XP } from '@/lib/firebase-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Facebook, Instagram, Loader2, Sparkles, Trophy, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const TikTokIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.14 2.76-.08 5.51-.14 8.26-.14 2.16-1.16 4.35-2.9 5.6-1.74 1.25-4.18 1.71-6.19 1.11-2.01-.6-3.83-2.22-4.43-4.23-.6-2.01-.14-4.45 1.11-6.19 1.25-1.74 3.44-2.76 5.6-2.9h.14v4.03c-1.44.17-2.89.6-4.13 1.47 1.25.87 2.69 1.3 4.13 1.47v-8.26c-1.31.02-2.61.01-3.91.02V.02z" />
  </svg>
);

const SOCIAL_LINKS = [
    { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'bg-[#1877F2]', url: 'https://facebook.com/lovingapp' },
    { id: 'tiktok', label: 'TikTok', icon: TikTokIcon, color: 'bg-black', url: 'https://tiktok.com/@lovingapp' },
    { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]', url: 'https://instagram.com/lovingapp' },
];

export function SocialFollowModal() {
  const { userProfile, user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
      if (userProfile && !localStorage.getItem(`social_modal_shown_${userProfile.uid}`)) {
          const followsCount = userProfile.socialFollows?.length || 0;
          if (followsCount < 3) {
              setIsOpen(true);
          }
      }
  }, [userProfile]);

  const handleFollow = async (platform: any) => {
    if (!user || !firestore) return;
    
    window.open(platform.url, '_blank');

    setProcessingId(platform.id);
    try {
        await claimSocialReward({ firestore, userId: user.uid, platform: platform.id });
        toast({ title: `+${SOCIAL_FOLLOW_REWARD_XP} XP Gagnés !`, description: `Merci de nous suivre sur ${platform.label}.` });
    } catch (e) {
        console.error(e);
    } finally {
        setProcessingId(null);
    }
  };

  const handleClose = () => {
      if (userProfile) {
          localStorage.setItem(`social_modal_shown_${userProfile.uid}`, 'true');
      }
      setIsOpen(false);
  }

  const follows = userProfile?.socialFollows || [];

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden p-0 max-w-md max-h-[95vh] flex flex-col">
        <div className="overflow-y-auto scrollbar-hide flex-1">
            <div className="bg-gradient-to-br from-primary to-accent p-8 text-white text-center space-y-4 relative">
                <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto backdrop-blur-md shadow-xl border border-white/30">
                    <Trophy className="w-10 h-10 text-white animate-bounce" />
                </div>
                <h2 className="text-3xl font-black font-headline tracking-tighter">Gagnez jusqu'à 150 XP !</h2>
                <p className="text-white/80 font-medium leading-relaxed">
                    Suivez Loving sur nos réseaux sociaux et recevez <strong className="text-white">50 XP par abonnement</strong>.
                </p>
            </div>

            <div className="p-6 space-y-4">
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-2">
                    <h4 className="text-xs font-black uppercase text-primary tracking-widest flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> Instructions
                    </h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                        Cliquez sur chaque réseau ci-dessous, abonnez-vous à notre page officielle, et revenez ici pour voir vos points crédités instantanément.
                    </p>
                </div>

                <div className="space-y-2">
                    {SOCIAL_LINKS.map((social) => {
                        const isDone = follows.includes(social.id);
                        return (
                            <button
                                key={social.id}
                                onClick={() => !isDone && handleFollow(social)}
                                disabled={processingId === social.id || isDone}
                                className={cn(
                                    "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all group",
                                    isDone 
                                        ? "bg-green-500/10 border-green-500/20 opacity-70" 
                                        : "bg-card border-white/5 hover:border-primary/30 hover:scale-[1.02] shadow-sm active:scale-95"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn("p-3 rounded-xl text-white shadow-lg", social.color)}>
                                        <social.icon className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-sm">Suivre sur {social.label}</p>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                                            {isDone ? 'Déjà réclamé' : `+${SOCIAL_FOLLOW_REWARD_XP} Points XP`}
                                        </p>
                                    </div>
                                </div>
                                {isDone ? (
                                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                                ) : (
                                    <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                        {processingId === social.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>

        <DialogFooter className="p-6 pt-0 border-t bg-muted/5">
            <Button onClick={handleClose} variant="ghost" className="w-full font-bold h-12 rounded-xl text-muted-foreground">
                Plus tard
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
