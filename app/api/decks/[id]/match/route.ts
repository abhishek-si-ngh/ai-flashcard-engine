import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { distillCardsForMatch } from "@/lib/gemini";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const deck = await prisma.deck.findUnique({
      where: { id },
      include: { cards: true },
    });

    if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });

    // Shuffle and pick 5
    const shuffled = [...deck.cards].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 5);

    // Distill into keywords via AI
    const distilled = await distillCardsForMatch(selected.map(c => ({ 
      id: c.id, 
      front: c.front, 
      back: c.back 
    })));

    return NextResponse.json({ 
      cards: distilled,
      title: deck.title 
    });
  } catch (err) {
    console.error("Match distillation failed:", err);
    return NextResponse.json({ error: "Failed to load match game" }, { status: 500 });
  }
}
