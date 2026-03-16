import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-budget-alternatives-flow.ts';
import '@/ai/flows/generate-personalized-itinerary.ts';
import '@/ai/flows/replan-daily-itinerary.ts';
import '@/ai/flows/provide-ai-chat-assistance-flow.ts';