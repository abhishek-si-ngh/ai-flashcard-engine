import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const topUsers = await prisma.user.findMany({
      orderBy: { xp: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        image: true,
        xp: true,
        level: true,
        streak: true,
      },
    });

    return NextResponse.json({ leaderboard: topUsers });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
