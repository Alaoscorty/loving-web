'use server';

import { aiBioAssistant, type AiBioAssistantInput } from '@/ai/flows/ai-bio-assistant-flow';
import { aiGameCreator, type AiGameCreatorInput, type AiGameCreatorOutput } from '@/ai/flows/ai-game-creator';
import { aiSuperLike, type AiSuperLikeInput, type AiSuperLikeOutput } from '@/ai/flows/ai-super-like-flow';

export async function generateBioAction(
  input: AiBioAssistantInput
): Promise<{ biography: string } | { error: string }> {
  try {
    if (
      !input.hobbies &&
      !input.profession &&
      !input.situationFamiliale &&
      !input.personalityTraits &&
      !input.goals &&
      !input.additionalInfo
    ) {
      return { error: 'Veuillez fournir au moins une information pour générer la biographie.' };
    }
    const result = await aiBioAssistant(input);
    return { biography: result.biography };
  } catch (e) {
    console.error(e);
    return { error: 'Une erreur est survenue lors de la génération de la biographie.' };
  }
}

export async function generateGameAction(
  input: AiGameCreatorInput
): Promise<{ game: AiGameCreatorOutput } | { error: string }> {
  try {
    if (!input.gameType) {
      return { error: 'Veuillez sélectionner un type de jeu.' };
    }
    const result = await aiGameCreator(input);
    return { game: result };
  } catch (e) {
    console.error(e);
    return { error: 'Une erreur est survenue lors de la création du jeu.' };
  }
}

export async function generateSuperLikeAction(
  input: AiSuperLikeInput
): Promise<{ proposals: string[] } | { error: string }> {
  try {
    const result = await aiSuperLike(input);
    return { proposals: result.proposals };
  } catch (e) {
    console.error(e);
    return { error: 'Impossible de générer des suggestions pour le moment.' };
  }
}
