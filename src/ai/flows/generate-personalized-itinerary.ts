'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating personalized travel itineraries.
 *
 * - generatePersonalizedItinerary - A function that orchestrates the itinerary generation process using an AI model.
 * - GeneratePersonalizedItineraryInput - The input type for the generatePersonalizedItinerary function.
 * - GeneratePersonalizedItineraryOutput - The return type for the generatePersonalizedItinerary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GeneratePersonalizedItineraryInputSchema = z.object({
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

const ItinerarySlotSchema = z.object({
  time: z.string().describe('The time slot for the activity, e.g., "09:00 AM", "Morning", "Afternoon", "Evening", "Night".'),
  activity: z.string().describe('A concise name for the activity.'),
  description: z.string().describe('A detailed description of the activity.'),
  location: z.string().describe('The name of the place where the activity occurs.'),
  lat: z.number().describe('The latitude coordinate of the location.'),
  lng: z.number().describe('The longitude coordinate of the location.'),
  estimatedCostINR: z.number().positive().or(z.literal(0)).describe('The estimated cost of the activity in Indian Rupees (INR).'),
  durationMinutes: z.number().int().positive().describe('The estimated duration of the activity in minutes.'),
  category: z.string().describe('The category of the activity, e.g., "Attraction", "Food", "Shopping", "Transport".'),
  tips: z.string().describe('Helpful tips for the activity, e.g., "Wear comfortable shoes", "Book tickets in advance".'),
});

const ItineraryDaySchema = z.object({
  dayNumber: z.number().int().positive().describe('The sequential number of the day in the trip.'),
  date: z.string().describe('The date of the day in YYYY-MM-DD format.'),
  theme: z.string().describe('A brief theme or focus for the day, e.g., "Exploring Historical Landmarks".'),
  slots: z.array(ItinerarySlotSchema).describe('A list of activities planned for this day, broken down into time slots.'),
});

const GeneratePersonalizedItineraryOutputSchema = z.object({
  days: z.array(ItineraryDaySchema).describe('A day-by-day breakdown of the generated itinerary.'),
});
export type GeneratePersonalizedItineraryOutput = z.infer<typeof GeneratePersonalizedItineraryOutputSchema>;

export async function generatePersonalizedItinerary(input: GeneratePersonalizedItineraryInput): Promise<GeneratePersonalizedItineraryOutput> {
  return generatePersonalizedItineraryFlow(input);
}

const itineraryGenerationPrompt = ai.definePrompt({
  name: 'itineraryGenerationPrompt',
  input: { schema: GeneratePersonalizedItineraryInputSchema },
  output: { schema: GeneratePersonalizedItineraryOutputSchema },
  prompt: `You are VOYIQ's expert travel planner. Generate a hyper-personalized day-by-day
itinerary based on the provided trip details. Be specific, practical, and budget-aware.

Output ONLY valid JSON in the exact structure defined by the output schema, with all fields populated.
Ensure that estimatedCostINR is provided for each activity, converting from the input currency and budget if necessary, and if the input currency is not INR, assume a reasonable exchange rate.
For location, lat, and lng, provide plausible coordinates that correspond to the specified location. If the location is too generic, pick a prominent point within that general area.

Trip Details:
Destination: {{{destination}}}
Start Date: {{{startDate}}}
End Date: {{{endDate}}}
Number of Travelers: {{{numTravelers}}}
Group Type: {{{groupType}}}
Total Budget: {{{totalBudget}}} {{{currency}}}
Travel Style: {{{travelStyle.join ", "}}}
Pace: {{{pace}}}
Dietary Preferences: {{{dietaryPreferences.join ", "}}}
Mobility Needs: {{{mobilityNeeds}}}
{{#if mustIncludePlaces}}
Must Include Places: {{{mustIncludePlaces}}}
{{/if}}
{{#if mustAvoid}}
Must Avoid: {{{mustAvoid}}}
{{/if}}

Generate the itinerary in a JSON format as described:
`,
});

const generatePersonalizedItineraryFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedItineraryFlow',
    inputSchema: GeneratePersonalizedItineraryInputSchema,
    outputSchema: GeneratePersonalizedItineraryOutputSchema,
  },
  async (input) => {
    const { output } = await itineraryGenerationPrompt(input);
    if (!output) {
      throw new Error('Failed to generate itinerary.');
    }
    return output;
  }
);
