import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await auth();
    if (!sessionUser?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { deckId, cardsStudied, correctCount, duration } = body;

    const deckCheck = await prisma.deck.findFirst({ where: { id: deckId, userId: sessionUser.user.id } });
    if (!deckCheck) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const xpEarned = correctCount * 10 + (cardsStudied - correctCount) * 2;

    const session = await prisma.studySession.create({
      data: { 
        userId: sessionUser.user.id, 
        deckId, 
        cardsStudied, 
        correctCount, 
        duration,
        xpEarned,
        type: body.type || "study"
      },
    });

    // Update user stats (streak, xp, level)
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.user.id },
      select: { streak: true, bestStreak: true, lastStudyDate: true, xp: true, level: true }
    });

    if (user) {
      let newStreak = user.streak;
      const now = new Date();
      const lastDate = user.lastStudyDate ? new Date(user.lastStudyDate) : null;
      
      if (!lastDate) {
        newStreak = 1;
      } else {
        const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      }

      const newXP = user.xp + xpEarned;
      const newLevel = Math.floor(newXP / 1000) + 1;

      await prisma.user.update({
        where: { id: sessionUser.user.id },
        data: {
          streak: newStreak,
          bestStreak: Math.max(newStreak, user.bestStreak),
          lastStudyDate: now,
          xp: newXP,
          level: newLevel
        }
      });
    }

    // Update deck updatedAt
    await prisma.deck.update({ where: { id: deckId }, data: { updatedAt: new Date() } });

    return NextResponse.json({ session, xpEarned }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
  }
}

