"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Card {
  id: string;
  front: string;
  back: string;
}

interface GameItem {
  id: string;
  text: string;
}

export default function MatchGame() {
  const { id } = useParams<{ id: string }>();
  const [leftItems, setLeftItems] = useState<GameItem[]>([]);
  const [rightItems, setRightItems] = useState<GameItem[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [startTime] = useState(Date.now());
  const [timer, setTimer] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/decks/${id}`)
      .then((res) => res.json())
      .then((data) => {
        const deckCards = data.deck.cards.slice(0, 6);
        
        const left = deckCards.map((c: Card) => ({ id: c.id, text: c.front }));
        const right = deckCards.map((c: Card) => ({ id: c.id, text: c.back }));
        
        setLeftItems(left.sort(() => Math.random() - 0.5));
        setRightItems(right.sort(() => Math.random() - 0.5));
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      setTimer(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, isFinished]);

  useEffect(() => {
    if (selectedLeft && selectedRight) {
      if (selectedLeft === selectedRight) {
        setMatched((prev) => [...prev, selectedLeft]);
        setSelectedLeft(null);
        setSelectedRight(null);
        if (matched.length + 1 === leftItems.length) {
          setIsFinished(true);
        }
      } else {
        const timeout = setTimeout(() => {
          setSelectedLeft(null);
          setSelectedRight(null);
        }, 500);
        return () => clearTimeout(timeout);
      }
    }
  }, [selectedLeft, selectedRight, matched.length, leftItems.length]);

  const truncate = (text: string, len: number = 90) => {
    return text.length > len ? text.substring(0, len) + "..." : text;
  };

  if (loading) return <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}><div className="spinner" /></div>;

  if (isFinished) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div className="card" style={{ maxWidth: 500, width: "100%", textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>✨</div>
          <h2>Master Matcher!</h2>
          <div style={{ fontSize: "3.5rem", fontWeight: 800, margin: "1.5rem 0", color: "var(--accent-light)" }}>
            {timer}s
          </div>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
            You matched all {leftItems.length} pairs in {timer} seconds.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <Link href={`/deck/${id}`} className="btn btn-primary">Back to Deck</Link>
            <button onClick={() => window.location.reload()} className="btn btn-secondary">Play Again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", padding: "2rem" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <Link href={`/deck/${id}`} style={{ textDecoration: "none", color: "var(--text-muted)", fontWeight: 500 }}>← Back</Link>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>{timer}s</div>
          <div style={{ color: "var(--text-muted)", fontWeight: 500 }}>Matched: <span style={{ color: "var(--accent-light)", fontWeight: 700 }}>{matched.length}</span> / {leftItems.length}</div>
        </div>

        <h1 style={{ textAlign: "center", marginBottom: "3rem", fontSize: "1.25rem", color: "var(--text-secondary)" }}>Match the columns</h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem" }}>
          {/* Column A */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ textAlign: "center", fontWeight: 700, color: "var(--accent-light)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.5rem" }}>Column A</div>
            {leftItems.map((item) => {
              const isMatched = matched.includes(item.id);
              const isSelected = selectedLeft === item.id;
              
              return (
                <button
                  key={item.id}
                  disabled={isMatched}
                  onClick={() => setSelectedLeft(item.id)}
                  className="card"
                  style={{
                    padding: "1.25rem",
                    textAlign: "center",
                    cursor: isMatched ? "default" : "pointer",
                    opacity: isMatched ? 0.3 : 1,
                    background: isSelected ? "var(--accent-light)" : "var(--bg-surface)",
                    color: isSelected ? "white" : "var(--text-primary)",
                    border: isSelected ? "2px solid white" : "1px solid var(--border)",
                    transition: "all 0.2s",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    minHeight: "70px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: isSelected ? "0 10px 20px rgba(99, 102, 241, 0.3)" : "none",
                    filter: isMatched ? "grayscale(1)" : "none"
                  }}
                >
                  {truncate(item.text)}
                </button>
              );
            })}
          </div>

          {/* Column B */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ textAlign: "center", fontWeight: 700, color: "var(--accent-light)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.5rem" }}>Column B</div>
            {rightItems.map((item) => {
              const isMatched = matched.includes(item.id);
              const isSelected = selectedRight === item.id;
              
              return (
                <button
                  key={item.id}
                  disabled={isMatched}
                  onClick={() => setSelectedRight(item.id)}
                  className="card"
                  style={{
                    padding: "1.25rem",
                    textAlign: "center",
                    cursor: isMatched ? "default" : "pointer",
                    opacity: isMatched ? 0.3 : 1,
                    background: isSelected ? "var(--accent-light)" : "var(--bg-surface)",
                    color: isSelected ? "white" : "var(--text-primary)",
                    border: isSelected ? "2px solid white" : "1px solid var(--border)",
                    transition: "all 0.2s",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    minHeight: "70px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: isSelected ? "0 10px 20px rgba(99, 102, 241, 0.3)" : "none",
                    filter: isMatched ? "grayscale(1)" : "none"
                  }}
                >
                  {truncate(item.text)}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
