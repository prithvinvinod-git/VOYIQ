'use server';
/**
 * @fileOverview This file implements a Genkit flow for providing AI chat assistance with full trip context.
 * It allows travelers to ask questions and receive relevant recommendations or information throughout their journey.
 *
 * - provideAIChatAssistance - The main function to call the AI chat flow.
 * - AIChatInput - The input type for the provideAIChatAssistance function.
 * - AIChatOutput - The return type for the provideAIChatAssistance function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { verifyTripAccess } from '@/lib/serverAuth';
import { withRetry } from '@/ai/retry';

// Define schemas
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']).describe('The role of the speaker (user or model).'),
  content: z.string().describe('The content of the chat message.'),
});

const TripContextSchema = z.object({
  destination: z.string().describe('The destination of the trip.'),
  startDate: z.string().describe('The start date of the trip (YYYY-MM-DD).'),
  endDate: z.string().describe('The end date of the trip (YYYY-MM-DD).'),
  groupType: z.string().optional().describe('The type of group traveling (e.g., solo, couple, family, friends).'),
  numTravelers: z.number().optional().describe('The number of travelers.'),
  budget: z.object({
    total: z.number().describe('The total budget for the trip.'),
    currency: z.string().describe('The currency of the budget (e.g., INR).'),
  }).describe('The budget details for the trip.'),
  travelStyle: z.array(z.string()).describe('An array of travel styles (e.g., Adventure, Culture, Food).'),
  pace: z.string().describe('The preferred pace of the trip (e.g., Relaxed, Balanced, Packed).'),
  dietPref: z.string().optional().describe('Dietary preferences (e.g., Vegetarian, Vegan, Halal).'),
}).describe('Comprehensive context for the current trip.');

const ItineraryDaySlotSchema = z.object({
  time: z.string().describe('Time of the activity (e.g., Morning, Afternoon, Evening, Night).'),
  activity: z.string().describe('Name of the activity.'),
  location: z.string().describe('Location of the activity.'),
  estimatedCost: z.number().describe('Estimated cost of the activity in local currency.'),
  duration: z.string().describe('Duration of the activity.'),
  tags: z.array(z.string()).describe('Tags associated with the activity.'),
}).describe('A slot within a day of the itinerary.');

const ItineraryDaySchema = z.object({
  dayNumber: z.number().describe('The day number of the trip.'),
  date: z.string().describe('The date of the itinerary day (YYYY-MM-DD).'),
  theme: z.string().optional().describe('The theme for the day.'),
  slots: z.array(ItineraryDaySlotSchema).describe('A list of activity slots for the day.'),
}).describe('A single day entry in the itinerary.');

const WeatherSchema = z.object({
  condition: z.string().describe('Current weather condition (e.g., Clear, Cloudy, Rain).'),
  tempHigh: z.number().describe('High temperature in Celsius.'),
  tempLow: z.number().describe('Low temperature in Celsius.'),
}).describe('Current weather information for the trip destination.');

const NearbyPOISchema = z.object({
  name: z.string().describe('Name of the Point of Interest.'),
  type: z.string().describe('Type of the Point of Interest (e.g., restaurant, attraction).'),
  distance: z.number().describe('Distance from a reference point in kilometers.'),
}).describe('Information about a nearby Point of Interest.');


const AIChatInputSchema = z.object({
  idToken: z.string().describe('Firebase ID token for authentication.'),
  tripId: z.string().describe('The unique identifier for the trip.'),
  tripContext: TripContextSchema.describe('The full context and details of the current trip.'),
  itinerarySummary: z.string().describe('A summary of the overall trip itinerary.'),
  currentItineraryDay: ItineraryDaySchema.optional().describe('Details of the current day in the itinerary, if applicable.'),
  currentWeather: WeatherSchema.optional().describe('Current weather forecast for the trip destination.'),
  nearbyPOIs: z.array(NearbyPOISchema).optional().describe('A list of relevant nearby Points of Interest.'),
  remainingBudget: z.number().optional().describe('The remaining budget for the trip in local currency.'),
  currentDate: z.string().describe('The current date (YYYY-MM-DD) to provide up-to-date context.'),
  chatHistory: z.array(ChatMessageSchema).describe('The history of the conversation to maintain context.'),
});
export type AIChatInput = z.infer<typeof AIChatInputSchema>;

const AIChatOutputSchema = z.object({
  response: z.string().describe('The AI chat companion\'s response.'),
});
export type AIChatOutput = z.infer<typeof AIChatOutputSchema>;

// Define the prompt
const aiChatPrompt = ai.definePrompt({
  name: 'aiChatPrompt',
  input: { schema: AIChatInputSchema },
  output: { schema: AIChatOutputSchema },
  // Use the model registered in the ai instance
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are VOYIQ's expert AI chat companion, your AI Travel Brain. Your role is to provide instant, relevant recommendations and information throughout the user's journey, always considering their trip context.

Current Date: {{{currentDate}}}

Trip Context:
Destination: {{{tripContext.destination}}}
Dates: {{{tripContext.startDate}}} to {{{tripContext.endDate}}}
Group Type: {{{tripContext.groupType}}}
Number of Travelers: {{{tripContext.numTravelers}}}
Budget: {{{tripContext.budget.total}}} {{{tripContext.budget.currency}}}
Travel Style: {{#each tripContext.travelStyle}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Pace: {{{tripContext.pace}}}
Dietary Preferences: {{{tripContext.dietPref}}}

Itinerary Summary:
{{{itinerarySummary}}}

{{#if currentItineraryDay}}
Current Day's Itinerary:
Day {{currentItineraryDay.dayNumber}} ({{currentItineraryDay.date}}): {{currentItineraryDay.theme}}
Activities:
{{#each currentItineraryDay.slots}}
- {{this.time}}: {{this.activity}} at {{this.location}} (Estimated Cost: {{this.estimatedCost}} {{../tripContext.budget.currency}}, Duration: {{this.duration}})
{{/each}}
{{/if}}

{{#if currentWeather}}
Current Weather in {{{tripContext.destination}}}:
Condition: {{{currentWeather.condition}}}
Temperature: High {{currentWeather.tempHigh}}°C, Low {{currentWeather.tempLow}}°C
{{/if}}

{{#if nearbyPOIs.length}}
Nearby Points of Interest:
{{#each nearbyPOIs}}
- {{this.name}} ({{this.type}}, approx. {{this.distance}} km away)
{{/each}}
{{/if}}

{{#if remainingBudget}}
Remaining Budget for the trip: {{{remainingBudget}}} {{{tripContext.budget.currency}}}
{{/if}}

Based on the above trip context and the conversation history, provide helpful and context-aware responses.
`,
});

// Define the flow
const provideAIChatAssistanceFlow = ai.defineFlow(
  {
    name: 'provideAIChatAssistanceFlow',
    inputSchema: AIChatInputSchema,
    outputSchema: AIChatOutputSchema,
  },
  async (input) => {
    // Authenticate user and verify access to this trip
    await verifyTripAccess(input.idToken, input.tripId);

    // Format chat history for the AI model's messages array
    // Genkit 1.x message format uses 'content' property which is an array of parts
    const messages = input.chatHistory.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      content: [{ text: msg.content }],
    })) as any[];

    const { output } = await aiChatPrompt(input, {
        messages: messages,
    });

    if (!output) {
      throw new Error('AI chat prompt did not return any output.');
    }

    return output;
  }
);

// Wrapper function to be exported
export async function provideAIChatAssistance(input: AIChatInput): Promise<AIChatOutput> {
  return withRetry(() => provideAIChatAssistanceFlow(input));
}
