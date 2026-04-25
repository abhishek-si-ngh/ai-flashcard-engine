import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const deck = await prisma.deck.findFirst({
      where: { id, userId: session.user.id },
      include: {
        cards: { orderBy: { createdAt: "asc" } },
        sessions: { orderBy: { completedAt: "desc" }, take: 10 },
      },
    });

    if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });

    const now = new Date();
    const dueCount = deck.cards.filter((c) => new Date(c.nextReviewAt).getTime() <= now.getTime()).length;
    const masteredCount = deck.cards.filter((c) => (c as any).interval >= 21).length;
    const newCount = deck.cards.filter((c) => (c as any).repetitions === 0).length;

    return NextResponse.json({ deck, stats: { dueCount, masteredCount, newCount } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch deck" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const deckCheck = await prisma.deck.findFirst({ where: { id, userId: session.user.id } });
    if (!deckCheck) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const deck = await prisma.deck.update({
      where: { id },
      data: { 
        title: body.title, 
        description: body.description, 
        subject: body.subject 
      },
    });
    return NextResponse.json({ deck });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update deck" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const deckCheck = await prisma.deck.findFirst({ where: { id, userId: session.user.id } });
    if (!deckCheck) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.deck.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete deck" }, { status: 500 });
  }
}
