'use server';
/**
 * @fileOverview An AI assistant flow for generating personalized ice-breakers (Super Likes).
 *
 * - aiSuperLike - A function that handles the ice-breaker generation process.
 * - AiSuperLikeInput - The input type for the aiSuperLike function.
 * - AiSuperLikeOutput - The return type for the aiSuperLike function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiSuperLikeInputSchema = z.object({
  womanName: z.string().describe('The name of the woman.'),
  womanBio: z.string().describe('The biography of the woman.'),
  womanHobbies: z.array(z.string()).optional().describe('Her hobbies.'),
  womanGoals: z.array(z.string()).optional().describe('Her life goals.'),
});
export type AiSuperLikeInput = z.infer<typeof AiSuperLikeInputSchema>;

const AiSuperLikeOutputSchema = z.object({
  proposals: z.array(z.string()).length(3).describe('Three distinct personalized ice-breaker messages.'),
});
export type AiSuperLikeOutput = z.infer<typeof AiSuperLikeOutputSchema>;

export async function aiSuperLike(input: AiSuperLikeInput): Promise<AiSuperLikeOutput> {
  return aiSuperLikeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiSuperLikePrompt',
  input: {schema: AiSuperLikeInputSchema},
  output: {schema: AiSuperLikeOutputSchema},
  prompt: `You are an expert dating coach specialized in helping men write elegant and personalized first messages.
Your goal is to generate 3 distinct "ice-breaker" messages for a woman named {{{womanName}}} based on her profile.

**Profile Information:**
- Bio: {{{womanBio}}}
- Hobbies: {{#each womanHobbies}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- Goals: {{#each womanGoals}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

**Instructions:**
- Be respectful, charming, and authentic.
- Avoid clichés. Focus on specific details from her bio or hobbies.
- Keep the messages concise (max 200 characters).
- Tone should be high-end and exclusive, matching the "Loving" app brand.
- Provide 3 different approaches (e.g., one curious, one humorous, one deeply inspired).`,
});

const aiSuperLikeFlow = ai.defineFlow(
  {
    name: 'aiSuperLikeFlow',
    inputSchema: AiSuperLikeInputSchema,
    outputSchema: AiSuperLikeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) throw new Error('Failed to generate Super Like proposals.');
    return output;
  }
);
