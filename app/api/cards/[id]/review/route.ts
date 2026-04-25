import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeSM2 } from "@/lib/sm2";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { rating } = await req.json(); // 0=Forgot, 1=Hard, 2=Good, 3=Easy

    if (rating === undefined || rating < 0 || rating > 3) {
      return NextResponse.json({ error: "Rating must be 0-3" }, { status: 400 });
    }

    const card = await prisma.card.findUnique({ where: { id } });
    if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

    const updated = computeSM2(
      {
        repetitions: card.repetitions,
        easeFactor: card.easeFactor,
        interval: card.interval,
        nextReviewAt: card.nextReviewAt,
        totalReviews: card.totalReviews,
        correctCount: card.correctCount,
      },
      rating
    );

    const updatedCard = await prisma.card.update({
      where: { id },
      data: {
        repetitions: updated.repetitions,
        easeFactor: updated.easeFactor,
        interval: updated.interval,
        nextReviewAt: updated.nextReviewAt,
        totalReviews: updated.totalReviews,
        correctCount: updated.correctCount,
      },
    });

    return NextResponse.json({ card: updatedCard });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
  }
}
