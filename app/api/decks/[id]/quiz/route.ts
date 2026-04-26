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
    
    // Generate fresh questions via AI
    const aiQuiz = await generateAIQuiz(context, 10);

    const quizCards = aiQuiz.map((q, i) => ({
      id: `ai-${i}`,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      topic: q.topic,
      hint: null
    }));

    return NextResponse.json({ quiz: quizCards });
  } catch (err) {
    console.error("Quiz generation error:", err);
    return NextResponse.json({ error: "Failed to generate dynamic quiz" }, { status: 500 });
  }
}
