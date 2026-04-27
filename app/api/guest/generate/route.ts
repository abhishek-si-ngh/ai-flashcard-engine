import { NextRequest, NextResponse } from "next/server";
import { generateFlashcardsFromPDF } from "@/lib/gemini";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
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

    // Return the deck directly — no database storage for guests
    return NextResponse.json({ deck: generated }, { status: 200 });
  } catch (err) {
    console.error("Guest generate error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate flashcards" },
      { status: 500 }
    );
  }
}
