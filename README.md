# ✈️ VOYIQ — AI-Powered Travel Planning

<div align="center">

![VOYIQ Banner](https://img.shields.io/badge/VOYIQ-AI%20Travel%20Planner-6366F1?style=for-the-badge&logo=airplane&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-11-orange?style=for-the-badge&logo=firebase)
![Genkit](https://img.shields.io/badge/Genkit-1.28-blue?style=for-the-badge&logo=google)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)

**Hyper-personalized travel itineraries powered by Gemini AI.**  
From vision to adventure — plan smarter, travel better.

</div>

---

> ⚠️ **License Notice**: This project is **not licensed for commercial use** without explicit written permission from the author. See the [License](#license) section for full details.

---

## 📖 Overview

**VOYIQ** is a full-stack AI travel planning platform that generates hyper-personalized day-by-day itineraries based on your preferences, budget, travel style, and group type. It combines the power of **Google's Gemini AI** (via Genkit) with **Firebase** for real-time data sync, authentication, and collaborative trip planning.

Whether you're a solo adventurer, planning a family vacation, or coordinating a group trip — VOYIQ's AI Travel Brain curates the perfect experience for you.

---

## ✨ Features

### 🧠 AI Travel Brain
- **Personalized Itinerary Generation** — Gemini 2.5 Flash generates complete day-by-day plans tailored to your destination, dates, travel style, pace, and dietary preferences.
- **Dynamic Replanning** — Weather changed? Plans shifted? The AI replans your entire day in seconds based on live conditions.
- **AI Chat Companion** — A context-aware in-trip assistant that answers questions, suggests alternatives, and adapts to your journey in real time.
- **Budget Alternatives** — Automatically suggests cheaper alternatives when you exceed a budget category.
- **Local Language Phrases** — Every itinerary slot includes 3–4 native-language phrases for the destination to help you connect with locals.

### 💰 BudgetSync
- Real-time multi-currency expense tracking across your entire journey.
- Smart category breakdowns (Food, Transport, Activities, Stay, Misc).
- AI-powered spending insights and trend analytics.
- Proactive budget alerts with actionable alternatives.

### 🗺️ Interactive Live Map
- Leaflet-powered interactive maps showing all your itinerary locations.
- Real-time activity pin rendering with day-by-day filtering.
- Geo-coordinates generated for every activity slot in the itinerary.

### 👥 Collaborative Planning
- Create collab rooms and invite travel companions.
- Real-time message sync via Firestore.
- Shared itinerary editing and cost splitting.
- Group voting and preference merging.

### 📄 PDF Export
- Export polished, print-ready itineraries for offline use.
- Perfect for international travel where connectivity may be limited.

### 🔒 Security
- Firebase Authentication with Google Sign-In.
- Firestore security rules enforce strict ownership — users can only access their own trips.
- Collaborative access is explicitly granted through collab room membership.

---

## 🗂️ Project Structure

```
voyiq/
├── src/
│   ├── ai/
│   │   ├── flows/
│   │   │   ├── generate-personalized-itinerary.ts    # Main itinerary generation flow
│   │   │   ├── replan-daily-itinerary.ts              # Weather-aware daily replanning
│   │   │   ├── provide-ai-chat-assistance-flow.ts     # In-trip AI chat companion
│   │   │   └── suggest-budget-alternatives-flow.ts    # Budget overflow suggestions
│   │   ├── genkit.ts                                  # Genkit AI instance config
│   │   └── dev.ts                                     # Genkit dev server entry
│   ├── app/
│   │   ├── page.tsx          # Landing page
│   │   ├── auth/             # Authentication flow
│   │   ├── dashboard/        # User dashboard
│   │   ├── plan/             # Trip planning wizard
│   │   ├── trip/             # Active trip view
│   │   ├── collab/           # Collaborative planning room
│   │   ├── pricing/          # Subscription plans
│   │   └── ar/               # AR features
│   ├── components/
│   │   ├── ui/               # Reusable UI components (shadcn/radix-based)
│   │   ├── layout/           # Header, navigation components
│   │   ├── chat/             # AI chat interface components
│   │   ├── collab/           # Collab room components
│   │   ├── trip/             # Trip view components
│   │   └── shared/           # Shared dialogs and utilities
│   ├── firebase/             # Firebase hooks and utilities
│   ├── hooks/                # Custom React hooks
│   └── lib/                  # Utility functions and constants
├── firestore.rules            # Firestore security rules
├── apphosting.yaml            # Firebase App Hosting config
└── tailwind.config.ts         # Tailwind CSS configuration
```

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **AI** | Google Genkit 1.28 + Gemini 2.5 Flash |
| **Backend / DB** | Firebase Firestore |
| **Auth** | Firebase Authentication |
| **Hosting** | Firebase App Hosting |
| **Styling** | Tailwind CSS + Radix UI |
| **Animation** | Framer Motion |
| **Maps** | Leaflet |
| **Forms** | React Hook Form + Zod |
| **Charts** | Recharts |

---

## 🏁 Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- A Firebase project with **Firestore** and **Authentication** enabled
- A **Google AI API key** (for Gemini via Genkit)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/voyiq.git
cd voyiq
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google AI (Gemini via Genkit)
GOOGLE_GENAI_API_KEY=your_google_ai_api_key
```

### 4. Run the development server

```bash
# Start the Next.js app
npm run dev
```

The app will be available at **http://localhost:9002**

### 5. (Optional) Run the Genkit AI Dev Server

To inspect and test AI flows interactively:

```bash
npm run genkit:dev
# or for watch mode:
npm run genkit:watch
```

---

## 🤖 AI Flows

VOYIQ uses **Google Genkit** to orchestrate all AI interactions. Each flow is a structured, type-safe pipeline powered by **Gemini 2.5 Flash**.

### `generatePersonalizedItinerary`
Generates a complete day-by-day travel itinerary.

**Input:** Origin, destination, dates, travelers, group type, budget, travel style, pace, dietary preferences, mobility needs, must-include/avoid places.

**Output:** A structured array of `ItineraryDay` objects, each containing time-slotted activities with coordinates, cost estimates, local phrases, hotel suggestions, and tips.

### `replanDailyItinerary`
Replans a single day of the itinerary based on updated weather conditions.

**Input:** Current day's itinerary (JSON), live weather data, destination, user preferences, remaining budget.

**Output:** A fully revised `ItineraryDay` with weather-appropriate alternatives.

### `provideAIChatAssistance`
Powers the in-trip AI chat companion with full trip context.

**Input:** Full trip context, itinerary summary, current day's plan, weather, nearby POIs, remaining budget, and conversation history.

**Output:** A contextually relevant text response guiding the traveler.

### `suggestBudgetAlternatives`
Suggests cheaper alternatives when a budget category is exceeded.

**Input:** Over-budget category, budget limit, amount spent, trip context.

**Output:** 2–3 concrete, actionable suggestions with estimated savings.

---

## 🔐 Security Model

Firestore security rules enforce strict data isolation:

- **Users** — Can only read/write their own user document.
- **Trips** — Owner has full access. Collaborative access is granted to users listed in `authorizedUserIds` or linked via a `collabRoomId`.
- **Collab Rooms** — Any signed-in user can join. Messages are restricted to room members.
- **Free Tier** — Limited to 4 trips per user. Upgradeable via a Premium subscription.

---

## 💳 Pricing

| Plan | Trips | Features |
|------|-------|----------|
| **Free** | Up to 4 | AI itinerary, BudgetSync, PDF export |
| **Premium** | Unlimited | All Free features + Collaboration, Dynamic replanning, Priority AI |

---

## 📜 License

**Copyright © 2026 VOYIQ / Prithvin Vinod. All rights reserved.**

This project and its source code are provided for **personal, educational, and non-commercial use only**.

**Commercial use, redistribution, resale, or deployment of this software (or any derivative works) for commercial purposes is strictly prohibited without explicit written permission from the author.**

To request a commercial license or partnership inquiry, please contact the repository owner directly.

---

## 🙏 Acknowledgements

- [Google Genkit](https://firebase.google.com/docs/genkit) — AI orchestration framework
- [Google Gemini](https://deepmind.google/technologies/gemini/) — Underlying AI model
- [Firebase](https://firebase.google.com/) — Backend, auth, and hosting
- [shadcn/ui](https://ui.shadcn.com/) — UI component primitives
- [Radix UI](https://www.radix-ui.com/) — Accessible component foundation
- [Leaflet](https://leafletjs.com/) — Interactive maps
- [Framer Motion](https://www.framer.com/motion/) — Animation library

---

<div align="center">
  <sub>Built by <a href="https://github.com/prithvinvinod-git">Prithvin Vinod</a></sub>
</div>
