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

    const session = await prisma.studySession.create({
      data: { userId: sessionUser.user.id, deckId, cardsStudied, correctCount, duration },
    });

    // Update deck updatedAt
    await prisma.deck.update({ where: { id: deckId }, data: { updatedAt: new Date() } });

    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
  }
}
