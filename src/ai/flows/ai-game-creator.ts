
'use server';
/**
 * @fileOverview An AI assistant that generates creative game ideas (quiz questions, riddles, or poll ideas) for male users to create for women.
 *
 * - aiGameCreator - A function that handles the game content generation process.
 * - AiGameCreatorInput - The input type for the aiGameCreator function.
 * - AiGameCreatorOutput - The return type for the aiGameCreator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiGameCreatorInputSchema = z.object({
  gameType: z.enum(['quiz', 'riddle', 'poll']).describe('The type of game to generate.'),
  theme: z.string().optional().describe('An optional theme or topic for the game.'),
  context: z
    .string()
    .optional()
    .describe('Optional additional context or specific requirements for the game.'),
});
export type AiGameCreatorInput = z.infer<typeof AiGameCreatorInputSchema>;

const AiGameCreatorOutputSchema = z.discriminatedUnion('gameType', [
  z.object({
    gameType: z.literal('quiz'),
    title: z.string().describe('A catchy title for the quiz.'),
    questions: z
      .array(
        z.object({
          question: z.string().describe('The quiz question.'),
          options: z
            .array(z.string())
            .describe('An array of possible answers for the quiz question.'),
          correctAnswer: z.string().describe('The correct answer among the options.'),
        })
      )
      .describe('An array of quiz questions with options and correct answers.'),
  }),
  z.object({
    gameType: z.literal('riddle'),
    title: z.string().describe('A catchy title for the riddle.'),
    riddleText: z.string().describe('The text of the riddle.'),
    answer: z.string().describe('The answer to the riddle.'),
  }),
  z.object({
    gameType: z.literal('poll'),
    title: z.string().describe('A catchy title for the poll.'),
    question: z.string().describe('The poll question.'),
    options: z.array(z.string()).describe('An array of possible answers for the poll.'),
  }),
]);
export type AiGameCreatorOutput = z.infer<typeof AiGameCreatorOutputSchema>;

const aiGameCreatorPrompt = ai.definePrompt({
  name: 'aiGameCreatorPrompt',
  input: {
    schema: AiGameCreatorInputSchema.extend({
        isQuiz: z.boolean().optional(),
        isRiddle: z.boolean().optional(),
        isPoll: z.boolean().optional(),
    })
  },
  output: {schema: AiGameCreatorOutputSchema},
  prompt: `You are an AI assistant specialized in creating engaging and fun games (quizzes, riddles, or polls) for women in a dating app context.

Generate a game based on the following specifications:

Game Type: {{{gameType}}}
{{#if theme}}Theme: {{{theme}}}{{/if}}
{{#if context}}Additional Context: {{{context}}}{{/if}}

Instructions:
- The game should be appealing and respectful for women in a dating app.
- Ensure the output strictly follows the provided JSON schema.

{{#if isQuiz}}
- For a quiz, create 3-5 challenging but entertaining multiple-choice questions. Provide at least 3 options for each question, and clearly indicate the correct answer.
- Make the questions clever and engaging.
{{/if}}

{{#if isRiddle}}
- For a riddle, create a clever, intriguing, and fun riddle. Ensure it has a clear, concise answer.
{{/if}}

{{#if isPoll}}
- For a poll, create a thought-provoking and interesting question with 3-5 distinct and relevant options.
{{/if}}

Provide a catchy title for the game.
`,
});

const aiGameCreatorFlow = ai.defineFlow(
  {
    name: 'aiGameCreatorFlow',
    inputSchema: AiGameCreatorInputSchema,
    outputSchema: AiGameCreatorOutputSchema,
  },
  async input => {
    const {output} = await aiGameCreatorPrompt({
        ...input,
        isQuiz: input.gameType === 'quiz',
        isRiddle: input.gameType === 'riddle',
        isPoll: input.gameType === 'poll',
    });
    return output!;
  }
);

export async function aiGameCreator(input: AiGameCreatorInput): Promise<AiGameCreatorOutput> {
  return aiGameCreatorFlow(input);
}
