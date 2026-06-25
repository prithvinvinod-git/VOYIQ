import { ai } from './ai/genkit';
import { itineraryGenerationPrompt, GeneratePersonalizedItineraryInput } from './ai/flows/generate-personalized-itinerary';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const testInput: GeneratePersonalizedItineraryInput = {
  idToken: "mock-token",
  origin: "Delhi, India",
  destination: "Jaipur, Rajasthan, India",
  startDate: "2026-06-25",
  endDate: "2026-06-26",
  numTravelers: 1,
  groupType: "solo",
  totalBudget: 15000,
  currency: "INR",
  travelStyle: ["Culture", "Food"],
  pace: "Balanced",
  dietaryPreferences: ["No preference"],
  mobilityNeeds: false,
  mustIncludePlaces: "",
  mustAvoid: ""
};

async function run() {
  console.log("Running prompt with test input...");
  try {
    const result = await itineraryGenerationPrompt(testInput, { model: 'googleai/gemini-2.5-pro' });
    console.log("SUCCESS! Output:");
    console.log(JSON.stringify(result.output, null, 2));
  } catch (e: any) {
    console.error("Error running prompt:");
    console.error(e);
    if (e.stack) console.error(e.stack);
    if (e.validationErrors) console.error("Validation Errors:", JSON.stringify(e.validationErrors, null, 2));
  }
}
run();
