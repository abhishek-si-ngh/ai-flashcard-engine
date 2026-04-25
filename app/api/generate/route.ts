import { NextRequest, NextResponse } from "next/server";
import { generateFlashcardsFromPDF } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
export const maxDuration = 60;

const DECK_COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#14b8a6","#f59e0b","#10b981","#3b82f6","#ef4444"
];

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const formData = await req.formData();
    const file = formData.get("pdf") as File;

    if (!file) {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "PDF must be under 20MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const generated = await generateFlashcardsFromPDF(buffer);

    const color = DECK_COLORS[Math.floor(Math.random() * DECK_COLORS.length)];

    const deck = await prisma.deck.create({
      data: {
        userId: session.user.id,
        title: generated.title,
        description: generated.description,
        subject: generated.subject,
        emoji: generated.emoji || "📚",
        color,
        cards: {
          create: generated.cards.map((card) => ({
            front: card.front,
            back: card.back,
            hint: card.hint || null,
            type: card.type || "concept",
          })),
        },
      },
      include: { cards: true },
    });

    return NextResponse.json({ deck }, { status: 201 });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate flashcards" },
      { status: 500 }
    );
  }
}
