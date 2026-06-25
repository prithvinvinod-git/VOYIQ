'use server';
/**
 * @fileOverview A Genkit flow for replanning a single day of a travel itinerary.
 * This flow takes into account updated weather information and existing trip preferences
 * to suggest adjustments to the day's activities.
 *
 * - replanDailyItinerary - The main function to trigger the daily itinerary replanning.
 * - ReplanDailyItineraryInput - The input type for the replanDailyItinerary function.
 * - ReplanDailyItineraryOutput - The return type for the replanDailyItinerary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { verifyTripAccess } from '@/lib/serverAuth';
import { withRetry } from '@/ai/retry';

// Define the schema for a single itinerary slot
const ItinerarySlotSchema = z.object({
  time: z.string().describe('Time slot for the activity (e.g., "Morning", "Afternoon", "Evening", "Night").'),
  activity: z.string().describe('Name of the activity.'),
  description: z.string().describe('Detailed description of the activity.'),
  location: z.string().describe('Specific location or address of the activity.'),
  lat: z.number().describe('Latitude of the activity location.'),
  lng: z.number().describe('Longitude of the activity location.'),
  estimatedCostINR: z.number().describe('Estimated cost of the activity in INR.'),
  durationMinutes: z.number().describe('Estimated duration of the activity in minutes.'),
  category: z.string().describe('Category of the activity (e.g., "Sightseeing", "Food", "Shopping").'),
  tips: z.string().describe('Helpful tips for the activity.'),
});

// Define the input schema for the replanning flow
const ReplanDailyItineraryInputSchema = z.object({
  idToken: z.string().describe('Firebase ID token for authentication.'),
  tripId: z.string().describe('The unique ID of the trip.'),
  dayNumber: z.number().describe('The day number within the trip that needs replanning.'),
  date: z.string().describe('The date of the day being replanned (YYYY-MM-DD format).'),
  currentItinerary: z.string().describe("JSON string of the current day's itinerary slots. Format: [{ time, activity, description, location, lat, lng, estimatedCostINR, durationMinutes, category, tips }]"),
  currentWeather: z.string().describe("JSON string of the current weather data for the destination. Format: { condition: string, tempHigh: number, tempLow: number }"),
  destination: z.string().describe('The destination city of the trip.'),
  travelStyle: z.array(z.string()).describe("User's travel style preferences (e.g., Adventure, Culture, Food, Nature, Luxury, Budget)."),
  pace: z.string().describe("User's pace preference (e.g., Relaxed, Balanced, Packed)."),
  budgetLeft: z.number().describe('Remaining budget for the entire trip in INR.'),
  dietPref: z.string().describe("User's dietary preferences (e.g., Vegetarian, Vegan, Non-veg, Halal, No preference)."),
});

export type ReplanDailyItineraryInput = z.infer<typeof ReplanDailyItineraryInputSchema>;

// Define the output schema for the replanning flow (a single day's itinerary)
const ReplanDailyItineraryOutputSchema = z.object({
  dayNumber: z.number().describe('The day number of the itinerary.'),
  date: z.string().describe('The date of this itinerary day (YYYY-MM-DD format).'),
  theme: z.string().describe('A brief theme or highlight for the day.'),
  slots: z.array(ItinerarySlotSchema).describe('An array of time slots and activities for the day.'),
});

export type ReplanDailyItineraryOutput = z.infer<typeof ReplanDailyItineraryOutputSchema>;

// Define the prompt for replanning a daily itinerary
const replanDailyItineraryPrompt = ai.definePrompt({
  name: 'replanDailyItineraryPrompt',
  input: { schema: ReplanDailyItineraryInputSchema },
  output: { schema: ReplanDailyItineraryOutputSchema },
  prompt: `You are VOYIQ's expert travel planner. Your task is to replan a single day of a travel itinerary based on updated weather conditions and existing trip preferences.\n\nYou will be provided with:\n1. The original itinerary for the specific day.\n2. The current weather forecast for the destination.\n3. User preferences including destination, travel style, pace, remaining budget, and dietary preferences.\n\nYour goal is to suggest adjustments to the day's activities. If the weather is unsuitable for planned outdoor activities (e.g., rain for a hiking trip), suggest appropriate indoor alternatives or shift timings. If there's an excellent weather window, you might prioritize outdoor activities. Maintain the overall budget and desired pace of the trip as much as possible. Ensure activities are coherent and practical.\n\nOutput ONLY valid JSON that strictly adheres to the provided schema for a single day's itinerary. Do not include any additional text or formatting outside the JSON object.\n\n---\nTrip ID: {{{tripId}}}\nDay Number: {{{dayNumber}}}\nDate: {{{date}}}\nDestination: {{{destination}}}\nTravel Style: {{#each travelStyle}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}\nPace Preference: {{{pace}}}\nRemaining Trip Budget (INR): {{{budgetLeft}}}\nDietary Preference: {{{dietPref}}}\n\nCurrent Day's Itinerary (JSON Array of Slots):\n{{{currentItinerary}}}\n\nCurrent Weather Forecast (JSON Object):\n{{{currentWeather}}}\n---`,
});

// Define the Genkit flow for replanning a daily itinerary
const replanDailyItineraryFlow = ai.defineFlow(
  {
    name: 'replanDailyItineraryFlow',
    inputSchema: ReplanDailyItineraryInputSchema,
    outputSchema: ReplanDailyItineraryOutputSchema,
  },
  async (input) => {
    // Authenticate user and verify access to this trip
    await verifyTripAccess(input.idToken, input.tripId);

    const { output } = await replanDailyItineraryPrompt(input);
    if (!output) {
      throw new Error('Failed to generate replanned itinerary.');
    }
    return output;
  }
);

/**
 * Replans a specific day of a travel itinerary based on updated weather and trip preferences.
 * @param input - The input containing trip details, current itinerary for the day, and weather forecast.
 * @returns A promise that resolves to the replanned daily itinerary.
 */
export async function replanDailyItinerary(input: ReplanDailyItineraryInput): Promise<ReplanDailyItineraryOutput> {
  return withRetry(() => replanDailyItineraryFlow(input));
}
