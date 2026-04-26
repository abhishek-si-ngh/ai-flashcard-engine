"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { ChatWithPDF } from "@/components/ChatWithPDF";

interface Card {
  id: string;
  front: string;
  back: string;
  hint: string | null;
  type: string;
  repetitions: number;
  easeFactor: number;
  interval: number;
  nextReviewAt: string;
  totalReviews: number;
  correctCount: number;
}

interface Deck {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  color: string;
  emoji: string;
  cards: Card[];
}

const TYPE_ICONS: Record<string, string> = {
  concept: "🧩", definition: "📖", example: "🔢", edge_case: "⚠️", cloze: "✏️"
};

export default function DeckPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [stats, setStats] = useState({ dueCount: 0, masteredCount: 0, newCount: 0 });
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const fetchDeck = useCallback(async () => {
    try {
      const res = await fetch(`/api/decks/${id}`);
      const data = await res.json();
      setDeck(data.deck);
      setStats(data.stats);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDeck(); }, [fetchDeck]);

  async function handleDelete() {
    await fetch(`/api/decks/${id}`, { method: "DELETE" });
    router.push("/library");
  }

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="spinner" />
        </main>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div className="empty-state">
            <div className="empty-icon">❌</div>
            <h2>Deck not found</h2>
            <Link href="/library" className="btn btn-primary" style={{ marginTop: "1rem" }}>Back to Library</Link>
          </div>
        </main>
      </div>
    );
  }

  const accuracy = deck.cards.reduce((a, c) => a + c.totalReviews, 0) > 0
    ? Math.round(deck.cards.reduce((a, c) => a + c.correctCount, 0) / deck.cards.reduce((a, c) => a + c.totalReviews, 0) * 100)
    : 0;

  const masteryPct = deck.cards.length > 0 ? Math.round((stats.masteredCount / deck.cards.length) * 100) : 0;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div className="page-header">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <Link href="/library" style={{ fontSize: "0.8rem", color: "var(--text-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, marginBottom: "0.75rem" }}>
                ← Back to Library
              </Link>
              <div className="page-title">
                <span style={{ fontSize: "2rem" }}>{deck.emoji}</span>
                <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}>{deck.title}</h1>
              </div>
              {deck.subject && <span className="badge badge-concept" style={{ marginBottom: "0.5rem" }}>{deck.subject}</span>}
              {deck.description && <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", maxWidth: 600 }}>{deck.description}</p>}
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexShrink: 0, flexWrap: "wrap" }}>
              <Link href={`/study/${id}`} className="btn btn-primary">
                ▶ Study SM-2 {stats.dueCount > 0 && <span className="badge badge-learning" style={{ marginLeft: 4 }}>{stats.dueCount}</span>}
              </Link>
              <Link href={`/quiz/${id}`} className="btn btn-secondary">
                🎯 Quiz Mode
              </Link>
              {deleteConfirm ? (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={handleDelete} className="btn btn-danger btn-sm">Confirm Delete</button>
                  <button onClick={() => setDeleteConfirm(false)} className="btn btn-ghost btn-sm">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setDeleteConfirm(true)} className="btn btn-ghost btn-sm">🗑 Delete</button>
              )}
            </div>
          </div>
        </div>

        <div className="page-body">
          {/* Stats */}
          <div className="stat-grid" style={{ marginBottom: "2rem" }}>
            {[
              { label: "Total Cards", value: deck.cards.length, icon: "🃏" },
              { label: "Due Today", value: stats.dueCount, icon: "🔔" },
              { label: "New", value: stats.newCount, icon: "✨" },
              { label: "Mastered", value: stats.masteredCount, icon: "🏆" },
              { label: "Accuracy", value: `${accuracy}%`, icon: "🎯" },
              { label: "Mastery", value: `${masteryPct}%`, icon: "📈" },
            ].map((s) => (
              <div key={s.label} className="stat-item">
                <div style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>{s.icon}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Mastery bar */}
          <div className="card" style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h3 style={{ fontSize: "0.95rem" }}>📈 Overall Mastery</h3>
              <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--accent-light)" }}>{masteryPct}%</span>
            </div>
            <div className="progress-bar" style={{ height: 10, marginBottom: "0.75rem" }}>
              <div className="progress-fill" style={{ width: `${masteryPct}%` }} />
            </div>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {[
                { label: "New", count: stats.newCount, color: "#6366f1" },
                { label: "Learning", count: deck.cards.filter(c => c.repetitions > 0 && c.interval < 7).length, color: "#f59e0b" },
                { label: "Review", count: deck.cards.filter(c => c.interval >= 7 && c.interval < 21).length, color: "#10b981" },
                { label: "Mastered", count: stats.masteredCount, color: "#a78bfa" },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color }} />
                  <span style={{ color: "var(--text-muted)" }}>{s.label}:</span>
                  <span style={{ fontWeight: 600 }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card list */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.1rem" }}>All Cards ({deck.cards.length})</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {deck.cards.map((card, i) => {
              const now = new Date();
              const isDue = new Date(card.nextReviewAt) <= now;
              const status = card.repetitions === 0 ? "new"
                : card.interval >= 21 ? "mastered"
                : isDue ? "learning" : "review";

              return (
                <div
                  key={card.id}
                  className="card"
                  style={{ padding: "1rem 1.25rem", cursor: "pointer", animationDelay: `${i * 0.02}s` }}
                  onClick={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", justifyContent: "space-between" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                        <span>{TYPE_ICONS[card.type] || "🧩"}</span>
                        <span className={`badge badge-${card.type}`}>{card.type.replace("_", " ")}</span>
                        <span className={`badge badge-${status}`}>{status}</span>
                      </div>
                      <p style={{ fontWeight: 500, fontSize: "0.9rem", color: "var(--text-primary)" }}>{card.front}</p>
                      {expandedCard === card.id && (
                        <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)", animation: "fadeIn 0.2s ease" }}>
                          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{card.back}</p>
                          {card.hint && (
                            <p style={{ fontSize: "0.8rem", color: "var(--accent-light)", marginTop: "0.5rem", fontStyle: "italic" }}>💡 {card.hint}</p>
                          )}
                          <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            <span>Reviews: {card.totalReviews}</span>
                            <span>Interval: {card.interval}d</span>
                            <span>EF: {card.easeFactor.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", flexShrink: 0, transition: "transform 0.2s", transform: expandedCard === card.id ? "rotate(180deg)" : "none" }}>▼</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <ChatWithPDF deckId={deck.id} title={deck.title} />
      </main>
    </div>
  );
}
