# **App Name**: VOYIQ

## Core Features:

- Secure User Authentication: Users can sign in securely using Google OAuth via Firebase Auth, enabling personalized trip planning.
- Intelligent Trip Planning Wizard: A multi-step guided process for users to input destination, dates, budget, travel style, and preferences using Nominatim API for location search.
- AI-Powered Itinerary Generation: Utilizes the Claude AI API as a tool to generate detailed, day-by-day itineraries tailored to user preferences and constraints, incorporating real-time data.
- Dynamic Itinerary Viewer with Map: Displays the generated itinerary with a daily timeline, interactive map using Leaflet.js/OpenStreetMap, and real-time weather forecasts via OpenWeatherMap API.
- Budget Tracking with AI Guidance: Users can log expenses, view budget breakdown via Chart.js, and receive AI-driven recommendations from Claude API as a tool for cheaper alternatives when over budget.
- AI Chat Companion: A conversational AI chat tool, powered by the Claude API, offering real-time assistance, quick suggestions, and context-aware responses based on the trip's details.
- Collaborative Trip Planning: Allows real-time shared itinerary viewing, activity voting, and presence indication for collaborators using Firebase Firestore listeners.

## Style Guidelines:

- Background color: A deep navy blue (#0B1120) for a sophisticated and technological base, evoking depth.
- Primary color: Electric teal (#00D4B8) for highlights, interactive elements, and conveying a sense of innovation and clarity.
- Accent color: Warm amber (#F5A623) to provide visual warmth and highlight critical information or call-to-action buttons, offering a balanced contrast.
- Heading font: 'Clash Display' (sans-serif) for a modern, distinct aesthetic. Body font: 'Plus Jakarta Sans' (sans-serif) for legibility and a clean, contemporary feel.
- Use clean, minimalist icons that align with the app's modern and tech-driven feel, ensuring high readability against dark backgrounds.
- Implement glassmorphism-inspired cards for a sophisticated layered effect on dark backgrounds, prioritizing a mobile-first responsive design for seamless use on devices 375px and wider.
- Utilize subtle CSS keyframe animations for an engaging user experience, including a dynamic tagline and skeleton loaders to indicate async content loading.