
'use server';
/**
 * @fileOverview Genkit flow for generating personalized travel itineraries.
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

/** One romanised local phrase tied to this slot's category context */
const LocalPhraseSchema = z.object({
  romanised: z.string().describe(
    'The phrase written in romanised/transliterated form of the local language — fun, colloquial, ' +
    'exactly how a local would say it out loud. E.g. for Malayalam: "chaya evide kittum?", ' +
    'for Hindi: "yahan khaana milega?", for Japanese: "okaikei onegaishimasu".'
  ),
  meaning: z.string().describe('Natural English translation of the phrase.'),
});

const ItinerarySlotSchema = z.object({
  time: z.string().describe('The time slot for the activity, e.g. "09:00 AM".'),
  activity: z.string().describe('A concise name for the activity.'),
  description: z.string().describe('A vivid, detailed description of the activity.'),
  location: z.string().describe('The name or address of the place.'),
  lat: z.number().describe('Latitude coordinate of the location.'),
  lng: z.number().describe('Longitude coordinate of the location.'),
  estimatedCostINR: z.number().positive().or(z.literal(0)).describe(
    'Estimated cost in the trip currency for this slot. Must reflect the category: ' +
    'Food = dining cost, Transport = fare/ticket, Stay = one night rate, Activities = entry/tour fee, Misc = incidentals.'
  ),
  durationMinutes: z.number().int().positive().describe('Duration in minutes.'),
  category: z.enum(['Food', 'Transport', 'Stay', 'Activities', 'Misc']).describe(
    'STRICT category tag — must be exactly one of: Food, Transport, Stay, Activities, Misc. ' +
    'Use Food for all meals/cafes, Transport for all travel between places, Stay for hotel/accommodation, ' +
    'Activities for sightseeing/tours/shopping/spa, Misc for everything else.'
  ),
  tips: z.string().describe('1-2 practical tips for this slot.'),
  localPhrase: LocalPhraseSchema.describe(
    'A single fun, context-relevant local phrase for this slot in romanised form. ' +
    'Match the phrase to the category — e.g. Food slot → a phrase to order/ask for food, ' +
    'Transport → asking for directions/fare, Stay → check-in phrase, Activities → greeting or asking about the site.'
  ),
});

const ItineraryDaySchema = z.object({
  dayNumber: z.number().int().positive().describe('Sequential number of the day.'),
  date: z.string().describe('Date in YYYY-MM-DD.'),
  theme: z.string().describe('A short, evocative theme for the day.'),
  subtitle: z.string().optional().describe('Optional one-line subtitle.'),
  weatherTempHigh: z.number().optional().describe('Estimated high temperature in Celsius.'),
  slots: z.array(ItinerarySlotSchema).describe('All activity slots for this day.'),
});

const GeneratePersonalizedItineraryOutputSchema = z.object({
  days: z.array(ItineraryDaySchema).describe('Complete day-by-day itinerary.'),
});
export type GeneratePersonalizedItineraryOutput = z.infer<typeof GeneratePersonalizedItineraryOutputSchema>;

export async function generatePersonalizedItinerary(input: GeneratePersonalizedItineraryInput): Promise<GeneratePersonalizedItineraryOutput> {
  return withRetry(() => generatePersonalizedItineraryFlow(input), { maxAttempts: 5, baseDelayMs: 2000 });
}

export const itineraryGenerationPrompt = ai.definePrompt({
  name: 'itineraryGenerationPrompt',
  input: { schema: GeneratePersonalizedItineraryInputSchema },
  output: { schema: GeneratePersonalizedItineraryOutputSchema },
  prompt: `You are VOYIQ's expert travel planner. Generate a hyper-personalized, immersive day-by-day itinerary.

════════════════════════════════════════
 1. LOCAL PHRASE — MANDATORY FOR EVERY SLOT
════════════════════════════════════════
Identify the PRIMARY local language spoken at {{{destination}}}.
Every slot MUST have a "localPhrase" object with:
  • "romanised" — the phrase written phonetically in English letters (transliterated), exactly how a local speaks it. Fun, colloquial. Examples:
      - Kerala/Malayalam  → "chaya evide kittum?" (where do I get tea?)
      - Tamil Nadu        → "saapadu ready-a?" (is the food ready?)
      - Rajasthan/Hindi   → "kitna door hai bhai?" (how far is it?)
      - Japan             → "ikura desu ka?" (how much does this cost?)
      - France            → "l'addition s'il vous plaît" (the bill please)
  • "meaning" — natural English translation.

Match the phrase to the CATEGORY CONTEXT:
  • Food slot      → ordering food, asking what's good, asking for the bill
  • Transport slot → asking for directions, negotiating fare, buying ticket
  • Stay slot      → check-in greeting, asking for room, requesting towels
  • Activities slot → greeting at a site, asking about entry, complimenting the place
  • Misc slot      → a general useful phrase for shopping or emergencies

════════════════════════════════════════
 2. CATEGORY TAG — STRICT ENUM REQUIRED
════════════════════════════════════════
Every slot MUST have a "category" field set to EXACTLY ONE of:
  Food | Transport | Stay | Activities | Misc

Rules:
  • Food        = any meal, cafe, street food, beverage stop
  • Transport   = any travel between locations (cab, bus, train, ferry, flight)
  • Stay        = hotel check-in or accommodation slot
  • Activities  = sightseeing, museum, temple, tour, shopping, spa, beach, hike
  • Misc        = anything that doesn't fit above

DO NOT use any other values for category.

════════════════════════════════════════
 3. BUDGET ALLOCATION BY CATEGORY
════════════════════════════════════════
Total budget: {{{totalBudget}}} {{{currency}}} for {{{numTravelers}}} traveler(s).
Convert to INR if needed (1 USD ≈ 83 INR, 1 EUR ≈ 90 INR, etc.).

Distribute the ENTIRE budget across slots. Realistic split guidelines:
  • Stay        → ~35-40% of total budget
  • Food        → ~20-25% of total budget
  • Transport   → ~10-15% of total budget
  • Activities  → ~15-20% of total budget
  • Misc        → ~5-10% of total budget

The sum of ALL "estimatedCostINR" across ALL days MUST approximately equal the total budget.
Per-slot cost must be realistic for the destination and category.

════════════════════════════════════════
 4. HOTEL & STAY (CRITICAL EFFICIENCY)
════════════════════════════════════════
Each day's last slot should be a real, named hotel near the day's final activity.
Use category: "Stay". Include the hotel name in "activity" and real address in "location".

════════════════════════════════════════
 TRIP DETAILS
════════════════════════════════════════
From: {{{origin}}}
Destination: {{{destination}}}
Dates: {{{startDate}}} → {{{endDate}}}
Travelers: {{{numTravelers}}} ({{{groupType}}})
Budget: {{{totalBudget}}} {{{currency}}}
Style: {{#each travelStyle}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Pace: {{{pace}}}
Diet: {{#each dietaryPreferences}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Mobility needs: {{{mobilityNeeds}}}
{{#if mustIncludePlaces}}Must include: {{{mustIncludePlaces}}}{{/if}}
{{#if mustAvoid}}Must avoid: {{{mustAvoid}}}{{/if}}

Generate the complete itinerary as valid JSON matching the output schema.
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
    // Strip any undefined properties to make it safe for Next.js Server Action serialization and Firestore writes
    return JSON.parse(JSON.stringify(output));
  }
);
