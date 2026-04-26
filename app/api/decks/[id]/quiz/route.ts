import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { generateAIQuiz } from "@/lib/gemini";

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

    // Use PDF content if available, otherwise use cards as context
    const context = deck.pdfContent || deck.cards.map(c => `${c.front}\n${c.back}`).join("\n\n");
    
    // Try generating fresh questions via AI
    let quizCards;
    try {
      const aiQuiz = await generateAIQuiz(context, 10);
      quizCards = aiQuiz.map((q, i) => ({
        id: `ai-${i}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        topic: q.topic,
        hint: null
      }));
    } catch (aiError) {
      console.error("AI Quiz generation failed, falling back to cards:", aiError);
      
      // FALLBACK: Generate quiz from existing cards if AI fails
      const selectedCards = [...deck.cards]
        .sort(() => 0.5 - Math.random())
        .slice(0, 10);

      quizCards = selectedCards.map((card) => {
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
          explanation: "Generated from your flashcard.",
          difficulty: "Normal",
          topic: deck.title,
          hint: card.hint,
        };
      });
    }

    return NextResponse.json({ quiz: quizCards });
  } catch (err) {
    console.error("Quiz generation error:", err);
    return NextResponse.json({ error: "Failed to generate dynamic quiz" }, { status: 500 });
  }
}
