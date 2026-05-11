import type { AiGameCreatorOutput } from "@/ai/flows/ai-game-creator";

export type GameContent = AiGameCreatorOutput;

export interface Game {
    id?: string;
    creatorUid: string;
    gameType: 'quiz' | 'riddle' | 'poll';
    title: string;
    content: GameContent;
    createdAt: string; // ISO date string
}
