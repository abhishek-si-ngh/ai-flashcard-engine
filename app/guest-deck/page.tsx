"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

interface Card {
  front: string;
  back: string;
  hint?: string;
  type: string;
  clozeContent?: string;
}

interface GuestDeck {
  title: string;
  subject: string;
  description: string;
  emoji: string;
  cards: Card[];
  rawText?: string;
}

const TYPE_ICONS: Record<string, string> = {
  concept: "🧩", definition: "📖", example: "🔢", edge_case: "⚠️", cloze: "✏️"
};

export default function GuestDeckPage() {
  const router = useRouter();
  const [deck, setDeck] = useState<GuestDeck | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [studyMode, setStudyMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("guest_deck");
    if (!raw) {
      router.push("/upload");
      return;
    }
    try {
      setDeck(JSON.parse(raw));
    } catch {
      router.push("/upload");
    }
  }, [router]);

  const nextCard = useCallback(() => {
    if (!deck) return;
    setFlipped(false);
    setTimeout(() => setCurrentIndex(i => (i + 1) % deck.cards.length), 150);
  }, [deck]);

  const prevCard = useCallback(() => {
    if (!deck) return;
    setFlipped(false);
    setTimeout(() => setCurrentIndex(i => (i - 1 + deck.cards.length) % deck.cards.length), 150);
  }, [deck]);

  if (!deck) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="spinner" />
        </main>
      </div>
    );
  }

  if (studyMode) {
    const card = deck.cards[currentIndex];
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2rem" }}>
          {/* Guest Banner */}
          <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "var(--radius-sm)", padding: "0.6rem 1.2rem", fontSize: "0.8rem", color: "var(--accent-light)", display: "flex", gap: "0.75rem", alignItems: "center" }}>
            👤 Guest mode — <Link href="/upload" style={{ color: "inherit", fontWeight: 600 }}>generate a new deck</Link> · <Link href="/" style={{ color: "inherit", fontWeight: 600 }}>sign in to save progress</Link>
          </div>

          <div style={{ width: "100%", maxWidth: 580 }}>
            {/* Progress */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              <button onClick={() => { setStudyMode(false); setCurrentIndex(0); setFlipped(false); }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem" }}>
                ← Back to List
              </button>
              <span>{currentIndex + 1} / {deck.cards.length}</span>
            </div>

            {/* Card */}
            <div
              onClick={() => setFlipped(f => !f)}
              style={{
                cursor: "pointer",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "3rem 2rem",
                minHeight: 260,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                gap: "1rem",
                transition: "transform 0.2s, box-shadow 0.2s",
                boxShadow: flipped ? "0 20px 40px rgba(99,102,241,0.15)" : "0 4px 20px rgba(0,0,0,0.1)",
                transform: flipped ? "scale(1.01)" : "scale(1)"
              }}
            >
              <span style={{ fontSize: "0.75rem", color: "var(--accent-light)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
                {flipped ? "Answer" : `${TYPE_ICONS[card.type] || "🧩"} ${card.type.replace("_", " ")}`}
              </span>
              <p style={{ fontSize: "1.1rem", fontWeight: flipped ? 400 : 600, lineHeight: 1.6, color: "var(--text-primary)" }}>
                {flipped ? card.back : card.front}
              </p>
              {!flipped && card.hint && (
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>💡 {card.hint}</p>
              )}
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                {flipped ? "Click to see question" : "Click to reveal answer"}
              </p>
            </div>

            {/* Navigation */}
            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", justifyContent: "center" }}>
              <button className="btn btn-ghost" onClick={prevCard}>← Prev</button>
              <button className="btn btn-primary" onClick={nextCard}>Next →</button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {/* Guest Banner */}
        <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "var(--radius-sm)", padding: "0.75rem 1.2rem", marginBottom: "1.5rem", fontSize: "0.825rem", color: "var(--accent-light)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <span>👤 <strong>Guest Mode</strong> — Cards are stored temporarily in this browser session only.</span>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link href="/upload" className="btn btn-ghost btn-sm">Upload New PDF</Link>
            <Link href="/" className="btn btn-primary btn-sm">Sign In to Save</Link>
          </div>
        </div>

        <div className="page-header">
          <div className="page-title">
            <span style={{ fontSize: "2rem" }}>{deck.emoji}</span>
            <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}>{deck.title}</h1>
          </div>
          {deck.subject && <span className="badge badge-concept" style={{ marginTop: "0.5rem" }}>{deck.subject}</span>}
          {deck.description && <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", maxWidth: 600, marginTop: "0.5rem" }}>{deck.description}</p>}
        </div>

        <div className="page-body">
          {/* Stats + Actions */}
          <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
            <div className="stat-item">
              <div style={{ fontSize: "1.25rem" }}>🃏</div>
              <div className="stat-value">{deck.cards.length}</div>
              <div className="stat-label">Total Cards</div>
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
            onClick={() => { setStudyMode(true); setCurrentIndex(0); setFlipped(false); }}
          >
            ▶ Study Cards
          </button>

          {/* Card list */}
          <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>All Cards ({deck.cards.length})</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {deck.cards.map((card, i) => (
              <div
                key={i}
                className="card"
                style={{ padding: "1rem 1.25rem", cursor: "pointer" }}
                onClick={() => setExpandedCard(expandedCard === i ? null : i)}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", justifyContent: "space-between" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                      <span>{TYPE_ICONS[card.type] || "🧩"}</span>
                      <span className={`badge badge-${card.type}`}>{card.type.replace("_", " ")}</span>
                    </div>
                    <p style={{ fontWeight: 500, fontSize: "0.9rem", color: "var(--text-primary)" }}>{card.front}</p>
                    {expandedCard === i && (
                      <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)", animation: "fadeIn 0.2s ease" }}>
                        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{card.back}</p>
                        {card.hint && <p style={{ fontSize: "0.8rem", color: "var(--accent-light)", marginTop: "0.5rem", fontStyle: "italic" }}>💡 {card.hint}</p>}
                      </div>
                    )}
                  </div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", flexShrink: 0, transform: expandedCard === i ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
