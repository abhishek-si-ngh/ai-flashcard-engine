import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        streak: true,
        bestStreak: true,
        xp: true,
        level: true,
        lastStudyDate: true,
      },
    });

    const sessions = await prisma.studySession.findMany({
      where: { userId: session.user.id },
      select: {
        cardsStudied: true,
        correctCount: true,
        deckId: true,
        deck: { select: { title: true, subject: true } },
      },
    });

    const totalStudied = sessions.reduce((acc, s) => acc + s.cardsStudied, 0);
    const totalCorrect = sessions.reduce((acc, s) => acc + s.correctCount, 0);
    const accuracy = totalStudied > 0 ? Math.round((totalCorrect / totalStudied) * 100) : 0;

    // Weak Topic Detection
    const deckStats: Record<string, { title: string; correct: number; total: number }> = {};
    sessions.forEach((s) => {
      if (!deckStats[s.deckId]) {
        deckStats[s.deckId] = { title: s.deck.title, correct: 0, total: 0 };
      }
      deckStats[s.deckId].correct += s.correctCount;
      deckStats[s.deckId].total += s.cardsStudied;
    });

    const weakTopics = Object.values(deckStats)
      .filter((d) => d.total >= 5) // Only consider decks with some study history
      .map((d) => ({
        title: d.title,
        accuracy: Math.round((d.correct / d.total) * 100),
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);

    // Cards mastered
    const masteredCount = await prisma.card.count({
      where: {
        deck: { userId: session.user.id },
        interval: { gte: 21 },
      },
    });

    return NextResponse.json({
      streak: user?.streak || 0,
      bestStreak: user?.bestStreak || 0,
      xp: user?.xp || 0,
      level: user?.level || 1,
      accuracy,
      totalStudied,
      masteredCount,
      weakTopics,
    });
  } catch (err) {
    console.error("Stats error:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
