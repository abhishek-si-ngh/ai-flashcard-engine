import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deck = await prisma.deck.findUnique({
      where: { id: id, userId: session.user.id },
      include: { cards: true },
    });

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // Generate MCQs from cards
    const quizCards = deck.cards.map((card) => {
      // Get 3 random distractors from other cards in the same deck
      const otherCards = deck.cards.filter((c) => c.id !== card.id);
      const distractors = otherCards
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((c) => c.back.length > 140 ? c.back.substring(0, 137) + "..." : c.back);

      const correctAnswer = card.back.length > 140 ? card.back.substring(0, 137) + "..." : card.back;
      const options = [...distractors, correctAnswer].sort(() => 0.5 - Math.random());

      return {
        id: card.id,
        question: card.front,
        correctAnswer: correctAnswer,
        options,
        hint: card.hint,
        type: card.type,
      };
    });

    return NextResponse.json({ quiz: quizCards });
  } catch (err) {
    console.error("Quiz generation error:", err);
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 });
  }
}
