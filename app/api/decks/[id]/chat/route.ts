import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { chatWithDocument } from "@/lib/gemini";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query, history } = await req.json();
    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const deck = await prisma.deck.findUnique({
      where: { id: params.id, userId: session.user.id },
      select: { pdfContent: true },
    });

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    if (!deck.pdfContent) {
      return NextResponse.json({ error: "No PDF content available for this deck" }, { status: 400 });
    }

    const response = await chatWithDocument(deck.pdfContent, query, history);

    return NextResponse.json({ response });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
  }
}
