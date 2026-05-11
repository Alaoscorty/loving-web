'use server';
/**
 * @fileOverview This file implements an AI chat moderator flow.
 *
 * - aiChatModerator - A function that handles the AI moderation and summarization of chat messages/conversations.
 * - AiChatModeratorInput - The input type for the aiChatModerator function.
 * - AiChatModeratorOutput - The return type for the aiChatModerator function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiChatModeratorInputSchema = z.object({
  message: z.string().optional().describe('An individual chat message to be moderated. Provide this for focused moderation.'),
  conversationHistory: z.array(z.string()).optional().describe('An array of previous chat messages in chronological order. Use this to provide context for message moderation or for conversation summarization.'),
});
export type AiChatModeratorInput = z.infer<typeof AiChatModeratorInputSchema>;

const AiChatModeratorOutputSchema = z.object({
  isAppropriate: z.boolean().describe('True if the message(s) are appropriate, false otherwise.'),
  flagReason: z.string().optional().describe('If the content is inappropriate, a brief reason for flagging (e.g., "Hate speech", "Harassment", "Sexually explicit", "Dangerous content").'),
  summary: z.string().optional().describe('A concise summary of the conversation if `conversationHistory` was provided and contained more than 5 messages.'),
});
export type AiChatModeratorOutput = z.infer<typeof AiChatModeratorOutputSchema>;

const chatModeratorPrompt = ai.definePrompt({
  name: 'chatModeratorPrompt',
  input: { schema: AiChatModeratorInputSchema },
  output: { schema: AiChatModeratorOutputSchema },
  prompt: `You are an AI assistant specialized in moderating chat conversations and summarizing them.
Your primary goal is to ensure a safe and respectful communication environment for the Loving app.

**Instructions:**
1.  **Moderation:** Evaluate the provided chat content for appropriateness.
    *   Consider any \`message\` and/or the \`conversationHistory\`.
    *   If any content (message or within history) contains hate speech, sexually explicit content, harassment, or dangerous content, set 'isAppropriate' to \`false\`.
    *   If \`isAppropriate\` is \`false\`, provide a concise 'flagReason' (e.g., "Hate speech", "Harassment", "Sexually explicit", "Dangerous content").
    *   Otherwise, set 'isAppropriate' to \`true\` and leave 'flagReason' empty.

2.  **Summarization:**
    *   If 'conversationHistory' is provided and contains more than 5 distinct messages, generate a concise summary of the entire conversation.
    *   Otherwise, leave the 'summary' field empty.

---

{{#if message}}
**Message to moderate:**
"{{{message}}}"
{{/if}}

{{#if conversationHistory}}
**Conversation History (total {{conversationHistory.length}} messages, ordered from oldest to newest):**
{{#each conversationHistory}}
- "{{{this}}}"
{{/each}}
{{/if}}

Please provide your response in JSON format according to the specified output schema.
`,
});

const aiChatModeratorFlow = ai.defineFlow(
  {
    name: 'aiChatModeratorFlow',
    inputSchema: AiChatModeratorInputSchema,
    outputSchema: AiChatModeratorOutputSchema,
  },
  async (input) => {
    const { output } = await chatModeratorPrompt(input);
    if (!output) {
      throw new Error('Failed to get output from chat moderator prompt.');
    }
    return output;
  }
);

export async function aiChatModerator(input: AiChatModeratorInput): Promise<AiChatModeratorOutput> {
  return aiChatModeratorFlow(input);
}
