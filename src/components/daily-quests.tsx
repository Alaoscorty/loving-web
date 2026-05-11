'use client';

import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Trophy, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type Quest = {
    id: string;
    label: string;
    points: number;
    path: string;
}

export function DailyQuests() {
  const { userProfile } = useUser();
  const router = useRouter();

  const commonQuests: Quest[] = [
      { id: 'streak_login', label: 'Maintenir un streak de 3 jours', points: 20, path: '/dashboard' },
  ];

  const womanQuests: Quest[] = [
    { id: 'post_story', label: 'Publier une story', points: 5, path: '/dashboard' },
    { id: 'like_post', label: 'Liker 3 publications', points: 10, path: '/dashboard' },
    { id: 'accept_rdv', label: 'Accepter une demande de RDV', points: 50, path: '/dashboard/woman/rendezvous' },
  ];

  const manQuests: Quest[] = [
    { id: 'propose_rdv', label: 'Utiliser tous vos swipes', points: 10, path: '/dashboard/man/discover' },
    { id: 'complete_profile', label: 'Proposer un rendez-vous', points: 15, path: '/dashboard/man/browse' },
    { id: 'invite_friend', label: 'Parrainer un ami', points: 20, path: '/dashboard/referral' },
  ];

  const roleQuests = userProfile?.role === 'woman' ? womanQuests : manQuests;
  const quests = [...commonQuests, ...roleQuests];
  const completedCount = quests.filter(q => userProfile?.completedQuests?.includes(q.id)).length;

  const handleQuestClick = (quest: Quest) => {
    router.push(quest.path);
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20 rounded-[2.5rem] shadow-xl overflow-hidden">
      <CardHeader className="pb-4 relative overflow-hidden">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
        <div className="flex items-center justify-between relative z-10">
          <CardTitle className="text-xl font-headline flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500 drop-shadow-md" />
            Défis du jour
          </CardTitle>
          <Badge className="bg-primary text-white border-none px-3 py-1 rounded-full">
            {completedCount}/{quests.length}
          </Badge>
        </div>
        <CardDescription className="font-medium">Complétez vos quêtes pour grimper les niveaux.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6 pt-0">
        {quests.map((quest) => {
          const isCompleted = userProfile?.completedQuests?.includes(quest.id);
          return (
            <div 
              key={quest.id} 
              onClick={() => handleQuestClick(quest)}
              className={cn(
                "group flex items-center justify-between p-4 rounded-2xl transition-all duration-300 border-2 cursor-pointer",
                isCompleted 
                    ? "bg-green-500/5 border-green-500/10 opacity-70" 
                    : "bg-card border-border/50 hover:border-primary/30 hover:shadow-md active:scale-95"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                    isCompleted ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}>
                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Target className="w-5 h-5" />}
                </div>
                <div className="flex flex-col">
                    <span className={cn("text-sm font-bold", isCompleted && "line-through text-muted-foreground")}>
                    {quest.label}
                    </span>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">+{quest.points} points XP</span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
