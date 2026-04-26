import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deck = await prisma.deck.findUnique({
      where: { id: params.id, userId: session.user.id },
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
        .map((c) => c.back);

      const options = [...distractors, card.back].sort(() => 0.5 - Math.random());

      return {
        id: card.id,
        question: card.front,
        correctAnswer: card.back,
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
