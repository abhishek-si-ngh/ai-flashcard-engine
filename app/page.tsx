import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { AuthButton } from "@/components/AuthButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Prisma } from "@prisma/client";

async function getStats(userId?: string) {
  const deckWhere: Prisma.DeckWhereInput = userId ? { userId } : {};
  const cardWhere: Prisma.CardWhereInput = userId ? { deck: { userId } } : {};
  
  const [deckCount, cardCount] = await Promise.all([
    prisma.deck.count({ where: deckWhere }),
    prisma.card.count({ where: cardWhere }),
  ]);
  
  const now = new Date();
  const dueCount = await prisma.card.count({ 
    where: { 
      ...cardWhere,
      nextReviewAt: { lte: now } 
    } 
  });
  
  return { deckCount, cardCount, dueCount };
}

export default async function HomePage() {
  const session = await auth();
  const stats = await getStats(session?.user?.id);

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

        {/* Hero */}
        <section style={{ padding: "5rem 2.5rem 3rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-60%)",
            width: 700, height: 700, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
            pointerEvents: "none"
          }} />
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0.35rem 1rem", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 999, fontSize: "0.8rem", color: "var(--accent-light)", marginBottom: "1.5rem" }}>
            <span>⚡</span> Powered by Gemini 1.5 Flash + SM-2 Algorithm
          </div>
          <h1 style={{ marginBottom: "1.25rem" }}>
            Turn Any PDF into a<br />
            <span className="gradient-text">Smart Flashcard Deck</span>
          </h1>
          <p style={{ fontSize: "1.15rem", color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
            Drop in your notes or textbook chapter. Get back teacher-quality flashcards with spaced repetition that learns which cards you struggle with.
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

        {/* Stats row */}
        {stats.deckCount > 0 && (
          <section style={{ padding: "0 2.5rem 3rem" }}>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              {[
                { label: "Decks Created", value: stats.deckCount, icon: "📚" },
                { label: "Total Cards", value: stats.cardCount, icon: "🃏" },
                { label: "Due for Review", value: stats.dueCount, icon: "🔔" },
              ].map((s) => (
                <div key={s.label} className="card" style={{ textAlign: "center", minWidth: 160, padding: "1.5rem" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{s.icon}</div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* How it works */}
        <section style={{ padding: "3rem 2.5rem", borderTop: "1px solid var(--border)" }}>
          <h2 style={{ textAlign: "center", marginBottom: "0.5rem" }}>How It Works</h2>
          <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "3rem" }}>Three steps to smarter studying</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem", maxWidth: 900, margin: "0 auto" }}>
            {[
              { step: "01", icon: "📄", title: "Drop Your PDF", desc: "Upload any PDF — textbook chapters, class notes, research papers. Our AI reads it natively." },
              { step: "02", icon: "🧠", title: "AI Generates Cards", desc: "Gemini creates 20-40 high-quality cards covering concepts, definitions, worked examples, and edge cases." },
              { step: "03", icon: "🔁", title: "Study & Remember", desc: "SM-2 spaced repetition schedules each card based on how well you know it. Hard cards reappear sooner." },
            ].map((item) => (
              <div key={item.step} className="card" style={{ position: "relative" }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", color: "var(--accent-light)", marginBottom: "0.75rem" }}>{item.step}</div>
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{item.icon}</div>
                <h3 style={{ marginBottom: "0.5rem" }}>{item.title}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Card types */}
        <section style={{ padding: "3rem 2.5rem", borderTop: "1px solid var(--border)", background: "var(--bg-surface)" }}>
          <h2 style={{ textAlign: "center", marginBottom: "0.5rem" }}>Cards Written Like a Great Teacher</h2>
          <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "2.5rem", fontSize: "0.9rem" }}>Not scraped by a bot — each card has a purpose</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
            {[
              { type: "concept", icon: "🧩", label: "Concepts", desc: "Core ideas and principles" },
              { type: "definition", icon: "📖", label: "Definitions", desc: "Key terms and vocabulary" },
              { type: "example", icon: "🔢", label: "Worked Examples", desc: "Step-by-step solutions" },
              { type: "edge_case", icon: "⚠️", label: "Edge Cases", desc: "Common misconceptions" },
            ].map((t) => (
              <div key={t.type} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1.25rem", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
                <span style={{ fontSize: "1.5rem" }}>{t.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{t.label}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "5rem 2.5rem", textAlign: "center" }}>
          <h2 style={{ marginBottom: "1rem" }}>Ready to Study Smarter?</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
            {session 
              ? "Start building your library of AI-powered flashcards today." 
              : "Sign in with Google to create and save your smart flashcard decks."}
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
            {!session ? (
              <AuthButton />
            ) : (
              <Link href="/upload" className="btn btn-primary btn-lg" style={{ animation: "pulse-ring 2s infinite" }}>
                ⚡ Create Your First Deck
              </Link>
            )}
          </div>
        </section>

        <footer style={{ borderTop: "1px solid var(--border)", padding: "1.5rem 2.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>
          Built with ❤️ for Cuemath · Powered by Google Gemini + SM-2 Algorithm
        </footer>
      </div>
    </div>
  );
}
