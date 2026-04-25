import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlashForge — AI-Powered Flashcard Engine",
  description:
    "Turn any PDF into a smart, practice-ready deck of flashcards powered by spaced repetition.",
  keywords: ["flashcards", "spaced repetition", "AI", "study", "PDF", "learning"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
