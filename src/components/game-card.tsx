'use client';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Game } from '@/types/game';
import type { UserProfile } from '@/types/user';
import { BarChart3, ListChecks, Puzzle, PlayCircle } from 'lucide-react';
import { GameCardSkeleton } from './game-card-skeleton';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { GamePlayer } from './game-player';

type GameCardProps = {
  game: Game & { id: string };
};

const gameIcons = {
  quiz: <ListChecks className="h-4 w-4" />,
  riddle: <Puzzle className="h-4 w-4" />,
  poll: <BarChart3 className="h-4 w-4" />,
};

export function GameCard({ game }: GameCardProps) {
  const firestore = useFirestore();
  const creatorRef = doc(firestore, 'users', game.creatorUid);
  const { data: creator, loading: loadingCreator } = useDoc<UserProfile>(creatorRef);

  if (loadingCreator) {
    return <GameCardSkeleton />;
  }

  return (
    <Dialog>
        <Card className="flex flex-col">
        <CardHeader>
            <div className="flex items-center gap-3">
            <Avatar>
                <AvatarImage src={creator?.photoUrl} alt={creator?.name} />
                <AvatarFallback>{creator?.name?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
                <p className="text-sm font-semibold">{creator?.name}</p>
                <p className="text-xs text-muted-foreground">Créateur du jeu</p>
            </div>
            </div>
        </CardHeader>
        <CardContent className="flex-1">
            <CardTitle className="text-lg font-headline flex items-center gap-2">
            {gameIcons[game.gameType]}
            {game.title}
            </CardTitle>
            <CardDescription className="mt-2">
                <Badge variant="secondary" className="capitalize">{game.gameType}</Badge>
            </CardDescription>
        </CardContent>
        <CardFooter>
            <DialogTrigger asChild>
                <Button className="w-full">
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Commencer à jouer
                </Button>
            </DialogTrigger>
        </CardFooter>
        </Card>
        <DialogContent className="sm:max-w-[425px] md:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <GamePlayer game={game} />
        </DialogContent>
    </Dialog>
  );
}
