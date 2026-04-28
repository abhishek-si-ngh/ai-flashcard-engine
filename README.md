# ⚡ FlashForge AI: The Ultimate Smart Flashcard Engine

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://flashforge-engine.onrender.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-blue)](https://www.prisma.io/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini%202.0-orange)](https://deepmind.google/technologies/gemini/)

FlashForge is an AI-native study platform that transforms messy PDF documents into structured, teacher-quality flashcard decks. Built with cognitive science and gamification at its core, it uses the **SM-2 Spaced Repetition Algorithm** alongside competitive features to make learning addictive and effective.

---

## ✨ Key Features

### 🧠 Advanced Learning Engine
*   **📄 AI PDF Ingestion**: Native PDF processing using Google Gemini 2.0 Flash. It extracts core concepts, definitions, worked examples, and **Cloze deletions**.
*   **🤖 Chat with Tutor**: Ask questions directly to your documents. Our AI tutor clarifies complex concepts using the source text as context.
*   **🔁 SM-2 Spaced Repetition**: A custom implementation of the SuperMemo-2 algorithm that schedules card reviews based on your individual performance.
*   **🌐 Guest Mode**: Instantly try out the core PDF upload and flashcard generation features without signing in (uses temporary `sessionStorage`).
*   **🛡️ Resilient AI Pipeline**: Features automatic API key rotation, quota exhaustion handling (HTTP 429), and bulletproof pure-JS local PDF extraction fallback to guarantee generation stability.

### 🎮 Gamification & Engagement
*   **🔥 Streak System**: Stay consistent with daily study streaks and personal records.
*   **🏆 Global Leaderboard**: Compete with students worldwide. Earn XP for every correct answer and climb the ranks.
*   **⭐ Leveling System**: Earn experience points (XP) to level up your profile as you master more material.
*   **🎯 Quiz & Match Modes**: 
    *   **Quiz Mode**: AI-generated Multiple Choice Questions (MCQs) for active testing.
    *   **Match Game**: A high-speed game to match terms and definitions against the clock.

### 📊 Insights & Analytics
*   **📊 Mastery Dashboard**: A central hub to track accuracy, cards mastered, and total XP.
*   **🧠 Weak Topic Detection**: Statistical analysis identifies exactly which decks or topics you struggle with, allowing for targeted study sessions.
*   **📈 Progress Visualization**: Detailed charts and mastery bars for every deck.

### 🎨 Premium Experience
*   **🎭 3D Immersive Study**: A beautiful, 3D-animated study interface designed to maximize focus.
*   **🌗 Adaptive UI**: Premium dark/light mode with glassmorphism aesthetics.
*   **🔐 Secure Auth**: Google OAuth integration keeps your study data private.

---

## 🛠️ Tech Stack

*   **Framework**: Next.js 16 (App Router)
*   **AI Engine**: Google Gemini 2.0 Flash
*   **Database**: PostgreSQL (Railway)
*   **ORM**: Prisma 7
*   **Authentication**: Auth.js v5 (NextAuth)
*   **Styling**: Vanilla CSS (Modern CSS Variables & Glassmorphism)

---

## 🚀 Getting Started

### 1. Prerequisites
*   Node.js 22+
*   A Google Cloud Project (for Gemini & OAuth)
*   A PostgreSQL Database (e.g., Railway)

### 2. Environment Setup
Create a `.env` file in the root directory:

```env
DATABASE_URL="your-postgresql-url"
GEMINI_API_KEY="key1,key2,key3" # Can be a single key or a comma-separated list for automatic rotation
AUTH_SECRET="your-random-secret"
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
```

### 3. Installation
```bash
# Install dependencies
npm install

# Initialize Prisma 7 config
# Ensure prisma.config.ts exists and url is removed from schema.prisma

# Generate Prisma client
npx prisma generate

# Sync database schema
npx prisma db push

# Start the dev server
npm run dev
```

---

## 📖 How Spaced Repetition Works

FlashForge uses the **SM-2 Algorithm** to calculate when you should next see a card. After each card review, you rate your memory on a scale of 1-4:

-   **1 (Again)**: Relearn immediately.
-   **2 (Hard)**: Revisit soon.
-   **3 (Good)**: Solid understanding.
-   **4 (Easy)**: Move far into the future.

The system updates the card's `easiness factor` and `interval` to ensure you are always studying at the edge of your forgetting curve.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ for the Cuemath AI Builder Challenge.
