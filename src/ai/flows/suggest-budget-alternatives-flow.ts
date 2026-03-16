'use server';
/**
 * @fileOverview A Genkit flow for suggesting cheaper alternatives when a budget category is exceeded.
 *
 * - suggestBudgetAlternatives - A function that suggests cheaper alternatives.
 * - SuggestBudgetAlternativesInput - The input type for the suggestBudgetAlternatives function.
 * - SuggestBudgetAlternativesOutput - The return type for the suggestBudgetAlternatives function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestBudgetAlternativesInputSchema = z.object({
  tripContext: z.object({
    destination: z.string().describe('The destination of the trip.'),
    travelStyle: z.array(z.string()).describe('Array of user-selected travel styles (e.g., Adventure, Culture, Food).'),
    pace: z.string().describe('Pace preference for the trip (e.g., Relaxed, Balanced, Packed).'),
    dietPref: z.string().describe('Dietary preference (e.g., Vegetarian, Vegan, Non-veg, Halal, No preference).'),
    numTravelers: z.number().describe('Number of travelers.'),
  }).describe('Contextual information about the trip.'),
  overBudgetCategory: z.string().describe('The expense category that is currently over budget (e.g., Food, Transport, Activities, Stay, Misc).'),
  budgetLimit: z.number().describe('The total budget allocated for this specific category.'),
  amountSpent: z.number().describe('The amount already spent in this specific category.'),
  currency: z.string().describe('The currency used for the budget and spending (e.g., INR, USD).'),
});
export type SuggestBudgetAlternativesInput = z.infer<typeof SuggestBudgetAlternativesInputSchema>;

const SuggestBudgetAlternativesOutputSchema = z.object({
  alternatives: z.array(z.object({
    suggestion: z.string().describe('A concrete suggestion for a cheaper alternative.'),
    estimatedSavings: z.number().describe('Estimated monetary savings from this suggestion.'),
    category: z.string().describe('The category this suggestion falls under (e.g., Food, Transport, Activities, Stay, Misc).'),
  })).describe('An array of cheaper alternative suggestions.'),
});
export type SuggestBudgetAlternativesOutput = z.infer<typeof SuggestBudgetAlternativesOutputSchema>;

export async function suggestBudgetAlternatives(input: SuggestBudgetAlternativesInput): Promise<SuggestBudgetAlternativesOutput> {
  return suggestBudgetAlternativesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestBudgetAlternativesPrompt',
  input: {schema: SuggestBudgetAlternativesInputSchema},
  output: {schema: SuggestBudgetAlternativesOutputSchema},
  prompt: `You are an expert travel budget planner for VOYIQ. Your goal is to help travelers stay within their financial plan by suggesting cheaper alternatives when they exceed their budget in a particular category.

The traveler is currently planning a trip to {{{tripContext.destination}}} for {{{tripContext.numTravelers}}} people, with a travel style of {{#each tripContext.travelStyle}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}, a pace preference of {{{tripContext.pace}}}, and a dietary preference of {{{tripContext.dietPref}}}.

They have exceeded their budget in the "{{{overBudgetCategory}}}" category.
The budget for this category was {{{budgetLimit}}} {{{currency}}}, and they have already spent {{{amountSpent}}} {{{currency}}}.

Based on this information, provide 2-3 concrete and actionable suggestions for cheaper alternatives to help them save money and get back on track. For each suggestion, estimate the potential savings. Ensure the suggestions are relevant to the trip context and the category.

Example:
If 'Food' is over budget, suggest eating at local street food stalls instead of fine dining, or packing a lunch for excursions.
If 'Activities' is over budget, suggest free walking tours, visiting public parks, or free museums instead of expensive attractions.
If 'Transport' is over budget, suggest using public transport or walking instead of taxis.`,
});

const suggestBudgetAlternativesFlow = ai.defineFlow(
  {
    name: 'suggestBudgetAlternativesFlow',
    inputSchema: SuggestBudgetAlternativesInputSchema,
    outputSchema: SuggestBudgetAlternativesOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
