"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Confetti from "@/components/Confetti";

interface Card {
  id: string;
  front: string;
  back: string;
  hint: string | null;
  type: string;
  repetitions: number;
  interval: number;
  nextReviewAt: string;
}

interface Deck {
  id: string;
  title: string;
  emoji: string;
}

const TYPE_ICONS: Record<string, string> = {
  concept: "🧩", definition: "📖", example: "🔢", edge_case: "⚠️",
};

const RATINGS = [
  { label: "Forgot", key: "1", rating: 0, cls: "forgot", emoji: "😰", desc: "Complete blank" },
  { label: "Hard", key: "2", rating: 1, cls: "hard", emoji: "😓", desc: "Recalled with effort" },
  { label: "Good", key: "3", rating: 2, cls: "good", emoji: "😊", desc: "Recalled correctly" },
  { label: "Easy", key: "4", rating: 3, cls: "easy", emoji: "😎", desc: "Perfect recall" },
];

export default function StudyPage() {
  const { id } = useParams() as { id: string };

  const [deck, setDeck] = useState<Deck | null>(null);
  const [queue, setQueue] = useState<Card[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<number | null>(null);
  const [sessionDone, setSessionDone] = useState(false);
  const [confetti, setConfetti] = useState(false);

  // Session stats
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const startTime = useRef(Date.now());
  const cardStartTime = useRef(Date.now());

  const fetchDeck = useCallback(async () => {
    try {
      const res = await fetch(`/api/decks/${id}`);
      const data = await res.json();
      setDeck({ id: data.deck.id, title: data.deck.title, emoji: data.deck.emoji });

      const now = new Date();
      // Due cards first, then new cards
      const due = data.deck.cards.filter((c: Card) => new Date(c.nextReviewAt) <= now);
      const newCards = data.deck.cards.filter((c: Card) => c.repetitions === 0 && new Date(c.nextReviewAt) > now);
      const studyQueue = [...due, ...newCards.slice(0, Math.max(10 - due.length, 0))];

      // Shuffle
      const shuffled = studyQueue.sort(() => Math.random() - 0.5);
      setQueue(shuffled);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDeck(); }, [fetchDeck]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!flipped) setFlipped(true);
      }
      if (flipped && !rating) {
        const r = RATINGS.find((r) => r.key === e.key);
        if (r) handleRate(r.rating);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function handleRate(r: number) {
    if (rating !== null) return;
    setRating(r);

    const card = queue[currentIdx];
    if (r >= 2) setCorrect((c) => c + 1);
    else setIncorrect((c) => c + 1);

    // SM-2 update
    await fetch(`/api/cards/${card.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: r }),
    });

    setTimeout(() => nextCard(), 600);
  }

  function nextCard() {
    const next = currentIdx + 1;
    if (next >= queue.length) {
      finishSession();
    } else {
      setCurrentIdx(next);
      setFlipped(false);
      setShowHint(false);
      setRating(null);
      cardStartTime.current = Date.now();
    }
  }

  async function finishSession() {
    const duration = Math.round((Date.now() - startTime.current) / 1000);
    await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deckId: id,
        cardsStudied: queue.length,
        correctCount: correct,
        duration,
      }),
    });
    setSessionDone(true);
    setConfetti(true);
    setTimeout(() => setConfetti(false), 4000);
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg-base)" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--text-muted)" }}>Loading your cards…</p>
        </div>
      </div>
    );
  }

  if (queue.length === 0 && !loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg-base)", padding: "2rem" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎉</div>
          <h2 style={{ marginBottom: "0.75rem" }}>All caught up!</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
            No cards are due for review right now. Come back later or study the full deck.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={`/deck/${id}`} className="btn btn-secondary">← Back to Deck</Link>
            <button className="btn btn-primary" onClick={async () => {
              setLoading(true);
              const res = await fetch(`/api/decks/${id}`);
              const data = await res.json();
              setQueue(data.deck.cards.sort(() => Math.random() - 0.5));
              setCurrentIdx(0); setFlipped(false); setLoading(false);
            }}>
              Study All Cards
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (sessionDone) {
    const total = queue.length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const duration = Math.round((Date.now() - startTime.current) / 1000);
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;

    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg-base)", padding: "2rem" }}>
        <Confetti active={confetti} />
        <div style={{ textAlign: "center", maxWidth: 480, animation: "scaleIn 0.4s ease" }}>
          <div style={{ fontSize: "4rem", marginBottom: "0.75rem", animation: "float 2s ease infinite" }}>
            {accuracy >= 80 ? "🏆" : accuracy >= 60 ? "👍" : "💪"}
          </div>
          <h1 style={{ marginBottom: "0.5rem" }}>Session Complete!</h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
            {accuracy >= 80 ? "Outstanding work! You're mastering this material." : accuracy >= 60 ? "Good session! Keep it up." : "Great effort! Struggling cards will come back sooner."}
          </p>

          <div className="stat-grid" style={{ marginBottom: "2rem" }}>
            {[
              { label: "Cards Studied", value: total, icon: "🃏" },
              { label: "Correct", value: correct, icon: "✅" },
              { label: "Accuracy", value: `${accuracy}%`, icon: "🎯" },
              { label: "Time", value: `${mins}m ${secs}s`, icon: "⏱" },
            ].map((s) => (
              <div key={s.label} className="stat-item">
                <div style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>{s.icon}</div>
                <div className="stat-value" style={{ fontSize: "1.5rem" }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/library" className="btn btn-secondary">📚 Library</Link>
            <Link href={`/deck/${id}`} className="btn btn-secondary">← Deck Details</Link>
            <button className="btn btn-primary" onClick={() => {
              setCurrentIdx(0); setFlipped(false); setCorrect(0); setIncorrect(0);
              setSessionDone(false); setRating(null);
              startTime.current = Date.now();
              setQueue((q) => [...q].sort(() => Math.random() - 0.5));
            }}>
              🔄 Study Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const card = queue[currentIdx];
  const progress = Math.round((currentIdx / queue.length) * 100);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", flexDirection: "column" }}>
      {/* Session top bar */}
      <div className="session-progress">
        <Link href={`/deck/${id}`} style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
          ← {deck?.emoji} {deck?.title}
        </Link>
        <div className="progress-bar" style={{ flex: 1 }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="session-counter">{currentIdx + 1} / {queue.length}</span>
        <div style={{ display: "flex", gap: "0.5rem", whiteSpace: "nowrap" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--success)" }}>✅ {correct}</span>
          <span style={{ fontSize: "0.8rem", color: "var(--danger)" }}>❌ {incorrect}</span>
        </div>
      </div>

      {/* Card area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>

        {/* Card type badge */}
        <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span className={`badge badge-${card.type}`}>
            {TYPE_ICONS[card.type] || "🧩"} {card.type.replace("_", " ")}
          </span>
          {!flipped && (
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Press <kbd style={{ padding: "1px 6px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, fontFamily: "monospace" }}>Space</kbd> to flip
            </span>
          )}
        </div>

        {/* 3D Flashcard */}
        <div className="flashcard-scene" style={{ maxWidth: 680 }}>
          <div
            className={`flashcard-container ${flipped ? "flipped" : ""}`}
            onClick={() => !flipped && setFlipped(true)}
          >
            {/* Front */}
            <div className="flashcard-face">
              <div className="flashcard-label">Question</div>
              <div className="flashcard-text">{card.front}</div>
              {!flipped && card.hint && !showHint && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: "1.5rem" }}
                  onClick={(e) => { e.stopPropagation(); setShowHint(true); }}
                >
                  💡 Show Hint
                </button>
              )}
              {showHint && card.hint && (
                <div className="flashcard-hint">💡 {card.hint}</div>
              )}
              {!flipped && (
                <div style={{ position: "absolute", bottom: "1rem", right: "1rem", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  Click to reveal →
                </div>
              )}
            </div>

            {/* Back */}
            <div className="flashcard-face back">
              <div className="flashcard-label" style={{ color: "var(--accent-light)" }}>Answer</div>
              <div className="flashcard-text">{card.back}</div>
            </div>
          </div>
        </div>

        {/* Rating buttons — shown only after flip */}
        {flipped && (
          <div className="rating-grid animate-fade-up" style={{ width: "100%", maxWidth: 680 }}>
            {RATINGS.map((r) => (
              <button
                key={r.rating}
                className={`rating-btn ${r.cls} ${rating === r.rating ? "active" : ""}`}
                onClick={() => handleRate(r.rating)}
                disabled={rating !== null}
                style={{ opacity: rating !== null && rating !== r.rating ? 0.4 : 1 }}
              >
                <span style={{ fontSize: "1.25rem", display: "block", marginBottom: "2px" }}>{r.emoji}</span>
                <span className="rating-label">{r.label}</span>
                <span className="rating-key">Press {r.key}</span>
              </button>
            ))}
          </div>
        )}

        {/* Flip button if not yet flipped */}
        {!flipped && (
          <button
            className="btn btn-primary btn-lg animate-fade-up"
            style={{ marginTop: "1.5rem" }}
            onClick={() => setFlipped(true)}
          >
            Reveal Answer
          </button>
        )}

        {/* Keyboard guide */}
        <div style={{ marginTop: "2rem", fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "center" }}>
          {flipped
            ? "Rate: 1 = Forgot · 2 = Hard · 3 = Good · 4 = Easy"
            : "Space or Enter to flip · Click the card"}
        </div>
      </div>
    </div>
  );
}
