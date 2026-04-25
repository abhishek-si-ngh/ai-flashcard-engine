"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

interface DeckSummary {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  color: string;
  emoji: string;
  cardCount: number;
  dueCount: number;
  masteryPct: number;
  updatedAt: string;
}

export default function LibraryPage() {
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchDecks = useCallback(async () => {
    try {
      const res = await fetch("/api/decks");
      const data = await res.json();
      setDecks(data.decks || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDecks(); }, [fetchDecks]);

  const filtered = decks.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      (d.subject || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div className="page-title">
            <h1>📚 My Library</h1>
            {decks.length > 0 && (
              <span className="badge badge-concept">{decks.length} deck{decks.length !== 1 ? "s" : ""}</span>
            )}
          </div>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            All your flashcard decks in one place
          </p>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <div className="search-bar" style={{ flex: 1, maxWidth: 400 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                placeholder="Search decks…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Link href="/upload" className="btn btn-primary">
              <span>+</span> New Deck
            </Link>
          </div>
        </div>

        <div className="page-body">
          {loading ? (
            <div className="deck-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card" style={{ minHeight: 200 }}>
                  <div className="skeleton" style={{ width: 50, height: 50, borderRadius: "var(--radius-md)", marginBottom: "0.75rem" }} />
                  <div className="skeleton" style={{ width: "70%", height: 20, marginBottom: "0.5rem" }} />
                  <div className="skeleton" style={{ width: "40%", height: 14 }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">{search ? "🔍" : "📭"}</div>
              <h2 className="empty-title">{search ? "No decks found" : "No decks yet"}</h2>
              <p className="empty-desc">
                {search
                  ? `No decks match "${search}"`
                  : "Upload a PDF to create your first flashcard deck"}
              </p>
              {!search && (
                <Link href="/upload" className="btn btn-primary">
                  📄 Upload Your First PDF
                </Link>
              )}
            </div>
          ) : (
            <div className="deck-grid">
              {filtered.map((deck, i) => (
                <Link
                  key={deck.id}
                  href={`/deck/${deck.id}`}
                  className="deck-card animate-fade-up"
                  style={{
                    animationDelay: `${i * 0.05}s`,
                    ["--deck-color" as string]: deck.color,
                  }}
                >
                  <span className="deck-emoji">{deck.emoji}</span>
                  <div className="deck-title">{deck.title}</div>
                  {deck.subject && <div className="deck-subject">{deck.subject}</div>}
                  {deck.description && (
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {deck.description}
                    </p>
                  )}

                  {/* Mastery bar */}
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 4 }}>
                      <span>Mastery</span>
                      <span>{deck.masteryPct}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${deck.masteryPct}%` }} />
                    </div>
                  </div>

                  <div className="deck-meta">
                    <span className="deck-count">{deck.cardCount} cards</span>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      {deck.dueCount > 0 && (
                        <span className="badge badge-learning">🔔 {deck.dueCount} due</span>
                      )}
                      {deck.masteryPct === 100 && (
                        <span className="badge badge-mastered">✨ Mastered</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
