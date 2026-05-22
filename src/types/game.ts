import type { AiGameCreatorOutput } from "@/ai/flows/ai-game-creator";

export type GameContent = AiGameCreatorOutput;

export interface GameResult {
    playerId: string;
    playerName: string;
    playerPhotoUrl?: string;
    score?: number;
    maxScore?: number;
    points: number;
    playedAt: string; // ISO date string
}

export interface Game {
    id?: string;
    creatorUid: string;
    gameType: 'quiz' | 'riddle' | 'poll';
    title: string;
    content: GameContent;
    createdAt: string; // ISO date string
    results?: GameResult[]; // Track who played and their scores
    totalPlayers?: number; // Counter for quick stats
}
