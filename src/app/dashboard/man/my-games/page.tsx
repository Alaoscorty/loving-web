'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BarChart3, ListChecks, Loader2, Puzzle, Wand2, PlusCircle } from 'lucide-react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { generateGameAction } from '@/app/actions';
import { publishGame } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import type { AiGameCreatorOutput } from '@/ai/flows/ai-game-creator';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Game } from '@/types/game';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

const gameCreatorSchema = z.object({
  gameType: z.enum(['quiz', 'riddle', 'poll'], { required_error: 'Veuillez choisir un type de jeu.' }),
  theme: z.string().optional(),
});
type GameCreatorValues = z.infer<typeof gameCreatorSchema>;

const gameIcons = {
  quiz: <ListChecks className="h-4 w-4" />,
  riddle: <Puzzle className="h-4 w-4" />,
  poll: <BarChart3 className="h-4 w-4" />,
};

function GamePreview({ game, onPublish, isPublishing }: { game: AiGameCreatorOutput; onPublish: () => void; isPublishing: boolean }) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Aperçu du jeu : "{game.title}"</CardTitle>
      </CardHeader>
      <CardContent>
        {game.gameType === 'quiz' && (
          <div className="space-y-4">
            {game.questions.map((q, i) => (
              <div key={i}>
                <p className="font-semibold">{i + 1}. {q.question}</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {q.options.map((opt, j) => (
                    <li key={j} className={opt === q.correctAnswer ? 'text-primary font-medium' : ''}>
                      {opt} {opt === q.correctAnswer && '(Bonne réponse)'}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        {game.gameType === 'riddle' && (
          <div>
            <p className="italic">"{game.riddleText}"</p>
            <p className="mt-4">
              <strong>Réponse :</strong> <span className="font-semibold text-primary">{game.answer}</span>
            </p>
          </div>
        )}
        {game.gameType === 'poll' && (
          <div>
            <p className="font-semibold">{game.question}</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {game.options.map((opt, i) => <li key={i}>{opt}</li>)}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={onPublish} disabled={isPublishing}>
          {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Publier ce jeu
        </Button>
      </CardFooter>
    </Card>
  );
}

function MyGamesList() {
  const { user } = useUser();
  const firestore = useFirestore();

  const gamesQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'games'),
      where('creatorUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: games, loading } = useCollection<Game>(gamesQuery);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-1" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (!games || games.length === 0) {
    return (
      <Alert>
        <AlertTitle>Aucun jeu publié</AlertTitle>
        <AlertDescription>Vous n'avez pas encore créé de jeu. Allez dans l'onglet "Créer un jeu" pour commencer !</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {games.map(game => (
        <Card key={game.id} className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {gameIcons[game.gameType as keyof typeof gameIcons]}
              {game.title}
            </CardTitle>
            <CardDescription>
              Publié le {game.createdAt ? format(new Date(game.createdAt), "d MMMM yyyy 'à' HH:mm", { locale: fr }) : '-'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
             <Badge variant={game.gameType === 'quiz' ? 'default' : game.gameType === 'riddle' ? 'secondary' : 'outline' } className="capitalize">
                {game.gameType}
            </Badge>
          </CardContent>
           <CardFooter>
             <Button variant="outline" size="sm">Voir les stats</Button>
           </CardFooter>
        </Card>
      ))}
    </div>
  );
}


export default function ManGamesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [generatedGame, setGeneratedGame] = useState<AiGameCreatorOutput | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<GameCreatorValues>({
    resolver: zodResolver(gameCreatorSchema),
  });

  const handleGenerateGame = async (values: GameCreatorValues) => {
    setIsGenerating(true);
    setGeneratedGame(null);
    const result = await generateGameAction(values);
    if (result && 'error' in result) {
      toast({ variant: 'destructive', title: 'Erreur IA', description: result.error });
    } else if (result && 'game' in result) {
      setGeneratedGame(result.game);
      toast({ title: 'Jeu généré !', description: 'Voici une proposition de notre IA. Vous pouvez la publier ou en générer une autre.' });
    }
    setIsGenerating(false);
  };
  
  const handlePublishGame = async () => {
    if (!generatedGame || !user || !firestore) return;
    setIsPublishing(true);
    try {
      await publishGame({ firestore, creatorUid: user.uid, game: generatedGame });
      toast({ title: 'Jeu publié !', description: 'Votre jeu est maintenant visible par les femmes.' });
      setGeneratedGame(null);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur de publication', description: error.message || 'Une erreur est survenue.' });
    }
    setIsPublishing(false);
  };

  if (!mounted) {
    return (
      <div className="flex-1 p-4 md:p-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline text-man-primary">Mes Jeux</h1>
        <p className="text-muted-foreground mt-1">Créez des jeux pour vous démarquer et consultez vos jeux publiés.</p>
      </header>

      <Tabs defaultValue="create">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="create">Créer un jeu</TabsTrigger>
          <TabsTrigger value="published">Mes jeux publiés</TabsTrigger>
        </TabsList>
        <TabsContent value="create" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Assistant de Création de Jeu IA</CardTitle>
              <CardDescription>Pas d'inspiration ? Laissez notre IA créer un jeu engageant pour vous.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleGenerateGame)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gameType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type de jeu</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choisissez un type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="quiz">
                                <span className="flex items-center gap-2"><ListChecks className="h-4 w-4" /> Quiz</span>
                              </SelectItem>
                              <SelectItem value="riddle">
                                <span className="flex items-center gap-2"><Puzzle className="h-4 w-4" /> Devinette</span>
                              </SelectItem>
                              <SelectItem value="poll">
                                <span className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Sondage</span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Thème (optionnel)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Voyage, Cinéma, Gastronomie..." {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Générer une idée de jeu
                  </Button>
                </form>
              </Form>

              {generatedGame && (
                <GamePreview game={generatedGame} onPublish={handlePublishGame} isPublishing={isPublishing} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="published" className="mt-6">
           <MyGamesList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
