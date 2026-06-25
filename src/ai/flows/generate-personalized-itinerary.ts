
'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating personalized travel itineraries.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { verifyIdToken } from '@/lib/serverAuth';
import { withRetry } from '@/ai/retry';

const GeneratePersonalizedItineraryInputSchema = z.object({
  idToken: z.string().describe('Firebase ID token for authentication.'),
  origin: z.string().describe('The starting city or airport for the traveler.'),
  destination: z.string().describe('The desired travel destination, e.g., "Paris, France".'),
  startDate: z.string().describe('The start date of the trip in YYYY-MM-DD format.'),
  endDate: z.string().describe('The end date of the trip in YYYY-MM-DD format.'),
  numTravelers: z.number().int().positive().describe('The number of travelers in the group.'),
  groupType: z.enum(['solo', 'couple', 'family', 'friends', 'other']).describe('The type of travel group.'),
  totalBudget: z.number().positive().describe('The total budget for the trip.'),
  currency: z.string().describe('The currency of the total budget, e.g., "INR", "USD".'),
  travelStyle: z.array(z.enum(['Adventure', 'Culture', 'Food', 'Nature', 'Luxury', 'Budget'])).describe('Preferred travel styles.'),
  pace: z.enum(['Relaxed', 'Balanced', 'Packed']).describe('The desired pace of the itinerary.'),
  dietaryPreferences: z.array(z.enum(['Vegetarian', 'Vegan', 'Non-veg', 'Halal', 'No preference'])).describe('Any specific dietary preferences.'),
  mobilityNeeds: z.boolean().describe('Indicates if there are any mobility needs to consider.'),
  mustIncludePlaces: z.string().optional().describe('Specific places that must be included in the itinerary (optional free text).'),
  mustAvoid: z.string().optional().describe('Specific places or activities that must be avoided (optional free text).'),
});
export type GeneratePersonalizedItineraryInput = z.infer<typeof GeneratePersonalizedItineraryInputSchema>;

const LocalPhraseSchema = z.object({
  phrase: z.string().describe('The phrase in the local language of the destination.'),
  meaning: z.string().describe('The English translation/meaning of the phrase.'),
});

const ItinerarySlotSchema = z.object({
  time: z.string().describe('The time slot for the activity.'),
  activity: z.string().describe('A concise name for the activity.'),
  description: z.string().describe('A detailed description of the activity.'),
  location: z.string().describe('The name of the place where the activity occurs.'),
  lat: z.number().describe('The latitude coordinate.'),
  lng: z.number().describe('The longitude coordinate.'),
  estimatedCostINR: z.number().positive().or(z.literal(0)).describe('Estimated cost in INR.'),
  durationMinutes: z.number().int().positive().describe('Duration in minutes.'),
  category: z.string().describe('Category of the activity.'),
  tips: z.string().describe('Helpful tips.'),
  localPhrases: z.array(LocalPhraseSchema).describe('3-4 helpful phrases in the LOCAL native language of the destination specifically for this activity/category.'),
});

const ItineraryDaySchema = z.object({
  dayNumber: z.number().int().positive().describe('Sequential number of the day.'),
  date: z.string().describe('Date in YYYY-MM-DD.'),
  theme: z.string().describe('Brief theme for the day.'),
  slots: z.array(ItinerarySlotSchema).describe('Activities planned for this day.'),
});

const GeneratePersonalizedItineraryOutputSchema = z.object({
  days: z.array(ItineraryDaySchema).describe('A day-by-day breakdown of the itinerary.'),
});
export type GeneratePersonalizedItineraryOutput = z.infer<typeof GeneratePersonalizedItineraryOutputSchema>;

export async function generatePersonalizedItinerary(input: GeneratePersonalizedItineraryInput): Promise<GeneratePersonalizedItineraryOutput> {
  return withRetry(() => generatePersonalizedItineraryFlow(input));
}

const itineraryGenerationPrompt = ai.definePrompt({
  name: 'itineraryGenerationPrompt',
  input: { schema: GeneratePersonalizedItineraryInputSchema },
  output: { schema: GeneratePersonalizedItineraryOutputSchema },
  prompt: `You are VOYIQ's expert travel planner. Generate a hyper-personalized day-by-day itinerary based on the provided trip details.

LOCAL LANGUAGE INTEGRATION:
Identify the primary language spoken at the destination ({{{destination}}}). 
For EVERY activity slot, provide 3-4 "localPhrases" in that NATIVE language (e.g., if the destination is Paris, provide French phrases; if Tokyo, provide Japanese phrases).
Each phrase should include the local script/text and its English meaning.

HOTEL & STAY SELECTION (CRITICAL EFFICIENCY):
For EACH day, ensure the final activity slot (usually in the evening or night) is a high-quality hotel or accommodation suggestion. 
This accommodation MUST be located EFFICIENTLY near the day's final sightseeing spot or activity to minimize commute time for the traveler. 
Research and suggest real, popular hotels relevant to the traveler's style.
Include the specific name of the hotel in the "activity" and its real address in the "location".

IMPORTANT BUDGET ALLOCATION:
The user has a total budget of {{{totalBudget}}} {{{currency}}}. 
You MUST attempt to distribute this entire budget across the itinerary slots. 
The sum of 'estimatedCostINR' across ALL slots in the ENTIRE itinerary should be approximately equal to the total budget provided (convert to INR if needed, e.g., 1 USD = 83 INR).
Ensure the 'estimatedCostINR' values reflect realistic costs for the destination and travel style.

Trip Details:
From: {{{origin}}}
Destination: {{{destination}}}
Start Date: {{{startDate}}}
End Date: {{{endDate}}}
Number of Travelers: {{{numTravelers}}}
Group Type: {{{groupType}}}
Total Budget: {{{totalBudget}}} {{{currency}}}
Travel Style: {{#each travelStyle}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Pace: {{{pace}}}
Dietary Preferences: {{#each dietaryPreferences}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Mobility Needs: {{{mobilityNeeds}}}
{{#if mustIncludePlaces}}
Must Include Places: {{{mustIncludePlaces}}}
{{/if}}
{{#if mustAvoid}}
Must Avoid: {{{mustAvoid}}}
{{/if}}

Generate the itinerary in a JSON format as described.
`,
});

const generatePersonalizedItineraryFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedItineraryFlow',
    inputSchema: GeneratePersonalizedItineraryInputSchema,
    outputSchema: GeneratePersonalizedItineraryOutputSchema,
  },
  async (input) => {
    await verifyIdToken(input.idToken);
    const { output } = await itineraryGenerationPrompt(input);
    if (!output) throw new Error('Failed to generate itinerary.');
    return output;
  }
);
