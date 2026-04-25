import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decks = await prisma.deck.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { cards: true } },
        cards: {
          select: {
            repetitions: true,
            interval: true,
            nextReviewAt: true,
          },
        },
      },
    });

    const decksWithStats = decks.map((deck) => {
      const now = new Date();
      const dueCount = deck.cards.filter((c) => new Date(c.nextReviewAt).getTime() <= now.getTime()).length;
      const masteredCount = deck.cards.filter((c) => c.interval >= 21).length;
      const masteryPct =
        deck._count.cards > 0
          ? Math.round((masteredCount / deck._count.cards) * 100)
          : 0;
      return {
        id: deck.id,
        title: deck.title,
        description: deck.description,
        subject: deck.subject,
        color: deck.color,
        emoji: deck.emoji,
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt,
        cardCount: deck._count.cards,
        dueCount,
        masteredCount,
        masteryPct,
      };
    });

    return NextResponse.json({ decks: decksWithStats });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch decks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { title, description, subject, color, emoji } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const deck = await prisma.deck.create({
      data: { userId: session.user.id, title, description, subject, color: color || "#6366f1", emoji: emoji || "📚" },
    });

    return NextResponse.json({ deck }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create deck" }, { status: 500 });
  }
}
