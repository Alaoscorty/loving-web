'use client';

import { useState, useEffect } from 'react';
import type { Game } from '@/types/game';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { GameContent } from '@/types/game';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { DialogFooter, DialogClose, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useUser, useFirestore } from '@/firebase';
import { awardPoints } from '@/lib/firebase-actions';

const QuizPlayer = ({
  content,
  onGameComplete,
}: {
  content: Extract<GameContent, { gameType: 'quiz' }>;
  onGameComplete: (points: number) => void;
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(string | null)[]>(new Array(content.questions.length).fill(null));
  const [showResults, setShowResults] = useState(false);

  const score = selectedAnswers.reduce((acc, answer, index) => {
    return answer === content.questions[index].correctAnswer ? acc + 1 : acc;
  }, 0);

  useEffect(() => {
    if (showResults) {
      const points = 10 + (score * 5); // 10 for participation, 5 per correct answer
      if (points > 0) {
        onGameComplete(points);
      }
    }
  }, [showResults, score, onGameComplete]);

  const currentQuestion = content.questions[currentQuestionIndex];

  const handleNext = () => {
    if (currentQuestionIndex < content.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  if (showResults) {
    return (
      <div className="text-center">
        <h3 className="text-2xl font-bold">Quiz Terminé !</h3>
        <p className="text-muted-foreground mt-2">Votre score</p>
        <p className="text-5xl font-bold my-4">{score} / {content.questions.length}</p>
        <div className="space-y-4 text-left max-h-[300px] overflow-y-auto p-1">
          {content.questions.map((q, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <p className="font-semibold">{q.question}</p>
                <p className={`mt-2 text-sm ${selectedAnswers[i] === q.correctAnswer ? 'text-green-500' : 'text-red-500'}`}>
                  Votre réponse : {selectedAnswers[i] || 'Pas de réponse'} {selectedAnswers[i] === q.correctAnswer ? <CheckCircle2 className="inline-block ml-2 h-4 w-4" /> : <XCircle className="inline-block ml-2 h-4 w-4" />}
                </p>
                {selectedAnswers[i] !== q.correctAnswer && <p className="text-sm text-green-500">Bonne réponse : {q.correctAnswer}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
        <DialogFooter className="mt-6">
            <DialogClose asChild>
                <Button>Fermer</Button>
            </DialogClose>
        </DialogFooter>
      </div>
    );
  }

  return (
    <div>
      <Progress value={((currentQuestionIndex + 1) / content.questions.length) * 100} className="mb-4" />
      <p className="text-sm text-muted-foreground">Question {currentQuestionIndex + 1} sur {content.questions.length}</p>
      <h4 className="text-lg font-semibold mt-2">{currentQuestion.question}</h4>
      <RadioGroup
        value={selectedAnswers[currentQuestionIndex] || ''}
        onValueChange={(value) => {
          const newAnswers = [...selectedAnswers];
          newAnswers[currentQuestionIndex] = value;
          setSelectedAnswers(newAnswers);
        }}
        className="mt-4 space-y-2"
      >
        {currentQuestion.options.map((option, i) => (
          <div key={i} className="flex items-center space-x-2">
            <RadioGroupItem value={option} id={`option-${i}`} />
            <Label htmlFor={`option-${i}`}>{option}</Label>
          </div>
        ))}
      </RadioGroup>
      <DialogFooter className="mt-6">
        <Button onClick={handleNext} disabled={!selectedAnswers[currentQuestionIndex]}>
          {currentQuestionIndex < content.questions.length - 1 ? 'Suivant' : 'Terminer'}
        </Button>
      </DialogFooter>
    </div>
  );
};

const RiddlePlayer = ({ content, onGameComplete }: { content: Extract<GameContent, { gameType: 'riddle' }>, onGameComplete: (points: number) => void }) => {
    const [answer, setAnswer] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const isCorrect = answer.trim().toLowerCase() === content.answer.trim().toLowerCase();

    const handleSubmit = () => {
        setSubmitted(true);
        if (isCorrect) {
            onGameComplete(25);
        }
    }

    if (submitted) {
        return (
            <div className="text-center">
                {isCorrect ? (
                    <>
                        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                        <h3 className="text-2xl font-bold mt-4">Correct !</h3>
                        <p className="text-muted-foreground">La réponse était bien : <span className="font-bold text-foreground">{content.answer}</span></p>
                    </>
                ) : (
                    <>
                        <XCircle className="h-16 w-16 text-red-500 mx-auto" />
                        <h3 className="text-2xl font-bold mt-4">Incorrect...</h3>
                        <p className="text-muted-foreground">Votre réponse : <span className="font-bold text-foreground">{answer}</span></p>
                        <p className="text-muted-foreground">La bonne réponse était : <span className="font-bold text-foreground">{content.answer}</span></p>
                    </>
                )}
                 <DialogFooter className="mt-6">
                    <DialogClose asChild>
                        <Button>Fermer</Button>
                    </DialogClose>
                </DialogFooter>
            </div>
        )
    }

    return (
        <div>
            <p className="text-center italic text-lg">"{content.riddleText}"</p>
            <div className="mt-6 space-y-2">
                <Label htmlFor="riddle-answer">Votre réponse</Label>
                <Input id="riddle-answer" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Tentez votre chance..."/>
            </div>
             <DialogFooter className="mt-6">
                <Button onClick={handleSubmit} disabled={!answer}>Soumettre</Button>
            </DialogFooter>
        </div>
    )
}

const PollPlayer = ({ content, onGameComplete }: { content: Extract<GameContent, { gameType: 'poll' }>, onGameComplete: (points: number) => void }) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const { toast } = useToast();

    const handleVote = () => {
        onGameComplete(10);
        toast({ title: 'Vote enregistré !', description: 'Merci pour votre participation.' });
    }

    return (
        <div>
            <h4 className="text-lg font-semibold">{content.question}</h4>
             <RadioGroup
                value={selectedOption || ''}
                onValueChange={setSelectedOption}
                className="mt-4 space-y-2"
            >
                {content.options.map((option, i) => (
                    <div key={i} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`poll-option-${i}`} />
                        <Label htmlFor={`poll-option-${i}`}>{option}</Label>
                    </div>
                ))}
            </RadioGroup>
            <DialogFooter className="mt-6">
                 <DialogClose asChild>
                    <Button onClick={handleVote} disabled={!selectedOption}>Voter</Button>
                 </DialogClose>
            </DialogFooter>
        </div>
    )
}

const gameTitles = {
    quiz: 'Quiz',
    riddle: 'Devinette',
    poll: 'Sondage'
}

export function GamePlayer({ game }: { game: Game & { id: string } }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleGameCompletion = (points: number) => {
    if (user && firestore && points > 0) {
      awardPoints({ firestore, userId: user.uid, points: points });
      toast({
        title: `+${points} points !`,
        description: "Vous avez gagné des points pour avoir joué.",
      });
    }
  };

  const renderGameContent = () => {
    switch (game.gameType) {
      case 'quiz':
        return <QuizPlayer content={game.content as Extract<GameContent, { gameType: 'quiz' }>} onGameComplete={handleGameCompletion} />;
      case 'riddle':
        return <RiddlePlayer content={game.content as Extract<GameContent, { gameType: 'riddle' }>} onGameComplete={handleGameCompletion} />;
      case 'poll':
        return <PollPlayer content={game.content as Extract<GameContent, { gameType: 'poll' }>} onGameComplete={handleGameCompletion} />;
      default:
        return <p>Ce type de jeu n'est pas supporté.</p>;
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{game.title}</DialogTitle>
        <DialogDescription>
          Un jeu de type "{gameTitles[game.gameType]}"
        </DialogDescription>
      </DialogHeader>
      <div className="py-4">
          {renderGameContent()}
      </div>
    </>
  );
}
