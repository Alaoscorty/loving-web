'use server';
/**
 * @fileOverview An AI assistant flow for generating detailed and compelling user profile biographies.
 *
 * - aiBioAssistant - A function that handles the biography generation process.
 * - AiBioAssistantInput - The input type for the aiBioAssistant function.
 * - AiBioAssistantOutput - The return type for the aiBioAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiBioAssistantInputSchema = z.object({
  hobbies: z
    .array(z.string())
    .describe('A list of hobbies and interests of the user.')
    .optional(),
  profession: z.string().describe('The user\'s profession.').optional(),
  situationFamiliale: z
    .string()
    .describe('The user\'s family situation (e.g., single, divorced, with children).')
    .optional(),
  personalityTraits: z
    .array(z.string())
    .describe('Key personality traits that describe the user (e.g., adventurous, calm, humorous).')
    .optional(),
  goals: z
    .array(z.string())
    .describe('Goals or aspirations the user has.')
    .optional(),
  additionalInfo: z
    .string()
    .describe('Any other relevant information the user wants to include in the bio.')
    .optional(),
});
export type AiBioAssistantInput = z.infer<typeof AiBioAssistantInputSchema>;

const AiBioAssistantOutputSchema = z.object({
  biography: z
    .string()
    .min(200)
    .describe('A detailed and compelling profile biography, at least 200 characters long.'),
});
export type AiBioAssistantOutput = z.infer<typeof AiBioAssistantOutputSchema>;

export async function aiBioAssistant(
  input: AiBioAssistantInput
): Promise<AiBioAssistantOutput> {
  return aiBioAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiBioAssistantPrompt',
  input: {schema: AiBioAssistantInputSchema},
  output: {schema: AiBioAssistantOutputSchema},
  prompt: `You are an AI assistant specialized in writing compelling and detailed dating app profile biographies for women. Your goal is to help the user attract suitable rendez-vous proposals by highlighting her unique personality and interests.

Craft a biography that is engaging, authentic, and meets a minimum length of 200 characters. Incorporate the following details provided by the user:

{{#if hobbies}}
Hobbies and Interests: {{#each hobbies}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

{{#if profession}}
Profession: {{{profession}}}
{{/if}}

{{#if situationFamiliale}}
Family Situation: {{{situationFamiliale}}}
{{/if}}

{{#if personalityTraits}}
Personality Traits: {{#each personalityTraits}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

{{#if goals}}
Goals and Aspirations: {{#each goals}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

{{#if additionalInfo}}
Additional Information: {{{additionalInfo}}}
{{/if}}

Ensure the final biography is at least 200 characters long, well-written, and inviting.`,
});

const aiBioAssistantFlow = ai.defineFlow(
  {
    name: 'aiBioAssistantFlow',
    inputSchema: AiBioAssistantInputSchema,
    outputSchema: AiBioAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate biography.');
    }
    return output;
  }
);
