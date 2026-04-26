import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { AuthButton } from "@/components/AuthButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Prisma } from "@prisma/client";
import { DashboardStats } from "@/components/DashboardStats";
import { Leaderboard } from "@/components/Leaderboard";

async function getGlobalStats() {
  const [deckCount, cardCount] = await Promise.all([
    prisma.deck.count(),
    prisma.card.count(),
  ]);
  return { deckCount, cardCount };
}

export default async function HomePage() {
  const session = await auth();
  const globalStats = await getGlobalStats();

  return (
    <div className="app-layout">
      {/* Simple top nav for landing page */}
      <div style={{ flex: 1, minHeight: "100vh" }}>
        <nav style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 2.5rem", borderBottom: "1px solid var(--border)",
          background: "var(--bg-surface)", position: "sticky", top: 0, zIndex: 50
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="logo-icon">⚡</div>
            <span className="logo-text">FlashForge</span>
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <ThemeToggle />
            {session && <Link href="/library" className="btn btn-ghost btn-sm">My Library</Link>}
            {session && <Link href="/upload" className="btn btn-primary btn-sm">Upload PDF</Link>}
            <AuthButton />
          </div>
        </nav>

        {/* Hero or Dashboard */}
        {session ? (
          <section style={{ padding: "3rem 2.5rem" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "2.5rem" }}>Welcome back, <span className="gradient-text">{session.user?.name?.split(' ')[0]}</span>!</h1>
                <Link href="/upload" className="btn btn-primary">
                  <span>📄</span> New Deck
                </Link>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "3fr 1.2fr", gap: "2.5rem", alignItems: "start" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                  <DashboardStats />
                  
                  <div className="card" style={{ padding: "2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                      <h3 style={{ margin: 0 }}>Recent Decks</h3>
                      <Link href="/library" style={{ fontSize: "0.85rem", color: "var(--accent-light)", fontWeight: 600, textDecoration: "none" }}>View All →</Link>
                    </div>
                    
                    {/* Fetch recent decks */}
                    {await (async () => {
                      const recentDecks = await prisma.deck.findMany({
                        where: { userId: session.user?.id },
                        orderBy: { updatedAt: "desc" },
                        take: 3,
                        include: { _count: { select: { cards: true } } }
                      });

                      if (recentDecks.length === 0) {
                        return (
                          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                            <p>You haven&apos;t created any decks yet.</p>
                            <Link href="/upload" className="btn btn-primary btn-sm" style={{ marginTop: "1rem" }}>Create Your First Deck</Link>
                          </div>
                        );
                      }

                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          {recentDecks.map((deck) => (
                            <Link 
                              key={deck.id} 
                              href={`/deck/${deck.id}`}
                              className="card"
                              style={{ 
                                padding: "1.25rem", textDecoration: "none", color: "inherit",
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                background: "var(--bg-elevated)", border: "1px solid var(--border)",
                                transition: "all 0.2s"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <span style={{ fontSize: "1.5rem" }}>{deck.emoji}</span>
                                <div>
                                  <div style={{ fontWeight: 600 }}>{deck.title}</div>
                                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{deck._count.cards} Cards</div>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                
                <Leaderboard />
              </div>
            </div>
          </section>
        ) : (
          <>
            <section style={{ padding: "5rem 2.5rem 3rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div style={{
                position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-60%)",
                width: 700, height: 700, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
                pointerEvents: "none"
              }} />
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0.35rem 1rem", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 999, fontSize: "0.8rem", color: "var(--accent-light)", marginBottom: "1.5rem" }}>
                <span>⚡</span> Powered by Gemini 2.0 Flash + SM-2 Algorithm
              </div>
              <h1 style={{ marginBottom: "1.25rem" }}>
                Turn Any PDF into a<br />
                <span className="gradient-text">Smart Flashcard Deck</span>
              </h1>
              <p style={{ fontSize: "1.15rem", color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
                Drop in your notes or textbook chapter. Get back teacher-quality flashcards with gamified tracking and AI chat support.
              </p>
              <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/upload" className="btn btn-primary btn-lg">
                  <span>📄</span> Upload PDF — It&apos;s Free
                </Link>
                <Link href="/library" className="btn btn-secondary btn-lg">
                  <span>📚</span> Browse Library
                </Link>
              </div>
            </section>

            {/* Global stats for landing */}
            <section style={{ padding: "0 2.5rem 3rem" }}>
              <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                {[
                  { label: "Decks Created", value: globalStats.deckCount, icon: "📚" },
                  { label: "Total Cards", value: globalStats.cardCount, icon: "🃏" },
                  { label: "AI Powered", value: "100%", icon: "🤖" },
                ].map((s) => (
                  <div key={s.label} className="card" style={{ textAlign: "center", minWidth: 160, padding: "1.5rem" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{s.icon}</div>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Features section (Always shown) */}
        <section style={{ padding: "3rem 2.5rem", borderTop: "1px solid var(--border)" }}>
          <h2 style={{ textAlign: "center", marginBottom: "0.5rem" }}>Advanced Learning Features</h2>
          <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "3rem" }}>Everything you need to master any subject</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem", maxWidth: 1100, margin: "0 auto" }}>
            {[
              { icon: "📊", title: "Progress Tracking", desc: "Track accuracy, study streaks, and cards mastered. Visualize your learning journey." },
              { icon: "🧠", title: "Weak Topic Detection", desc: "Our AI identifies exactly which topics you struggle with and helps you focus on them." },
              { icon: "🎯", title: "Quiz Mode", desc: "Test yourself with AI-generated MCQs and timed quizzes for better retention." },
              { icon: "🤖", title: "Chat with PDF", desc: "Ask questions directly to your documents. AI tutor helps clarify complex concepts." },
              { icon: "🔥", title: "Gamification", desc: "Earn XP, level up, and compete on the global leaderboard to stay motivated." },
              { icon: "🔁", title: "SM-2 Spaced Repetition", desc: "Scientifically proven algorithm to ensure you never forget what you learn." },
            ].map((item) => (
              <div key={item.title} className="card" style={{ position: "relative" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>{item.icon}</div>
                <h3 style={{ marginBottom: "0.5rem" }}>{item.title}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        {!session && (
          <section style={{ padding: "5rem 2.5rem", textAlign: "center" }}>
            <h2 style={{ marginBottom: "1rem" }}>Ready to Study Smarter?</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
              Sign in with Google to create and save your smart flashcard decks.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
              <AuthButton />
            </div>
          </section>
        )}

        <footer style={{ borderTop: "1px solid var(--border)", padding: "1.5rem 2.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>
          Built with ❤️ for Cuemath · Powered by Google Gemini 2.0 + SM-2 Algorithm
        </footer>
      </div>
    </div>
  );
}

