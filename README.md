# ⚡ FlashForge AI: The Smart Flashcard Engine

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://flashforge-engine.onrender.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-blue)](https://www.prisma.io/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini%201.5-orange)](https://deepmind.google/technologies/gemini/)

FlashForge is an AI-native study platform that transforms messy PDF documents into structured, teacher-quality flashcard decks. Built with cognitive science at its core, it uses the **SM-2 Spaced Repetition Algorithm** to optimize long-term retention and mastery.

---

## ✨ Key Features

*   **📄 AI PDF Ingestion**: Native PDF processing using Google Gemini 1.5 Flash. It identifies core concepts, definitions, worked examples, and common edge cases.
*   **🧠 SM-2 Spaced Repetition**: A custom implementation of the SuperMemo-2 algorithm that schedules card reviews based on your individual performance.
*   **🎭 3D Immersive Study**: A beautiful, 3D-animated study interface designed to maximize focus and minimize fatigue.
*   **🌗 Adaptive UI**: Premium dark/light mode toggle with theme persistence.
*   **📊 Mastery Analytics**: Detailed progress tracking with mastery rings and accuracy trends.
*   **🔐 Secure Auth**: Google OAuth integration ensures your study decks and progress are private and secure.

---

## 🛠️ Tech Stack

*   **Framework**: Next.js 15 (App Router)
*   **AI Engine**: Google Gemini 1.5 Flash
*   **Database**: PostgreSQL (Railway)
*   **ORM**: Prisma
*   **Authentication**: Auth.js v5 (NextAuth)
*   **Styling**: Vanilla CSS (Modern CSS Variables & Glassmorphism)
*   **Deployment**: Render (Frontend) & Railway (Database)

---

## 🚀 Getting Started

### 1. Prerequisites
*   Node.js 20+
*   A Google Cloud Project (for Gemini & OAuth)
*   A PostgreSQL Database (e.g., Railway)

### 2. Environment Setup
Create a `.env` file in the root directory:

```env
DATABASE_URL="your-postgresql-url"
GEMINI_API_KEY="your-gemini-api-key"
AUTH_SECRET="your-random-secret"
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
```

### 3. Installation
```bash
# Install dependencies
npm install

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

The system then updates the card's `easiness factor` and `interval` to ensure you are always studying at the edge of your forgetting curve.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ for the Cuemath AI Builder Challenge.
