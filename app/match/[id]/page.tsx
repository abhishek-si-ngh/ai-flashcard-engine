"use client";

import { useState, useEffect, useMemo } from "react";
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
  const [correctMatches, setCorrectMatches] = useState<Record<number, number>>({});
  const [options, setOptions] = useState<string[][]>([]);
  const [correctOptionIdx, setCorrectOptionIdx] = useState(-1);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/decks/${id}`)
      .then((res) => res.json())
      .then((data) => {
        const shuffledAll = [...data.deck.cards].sort(() => Math.random() - 0.5);
        const deckCards = shuffledAll.slice(0, 5); // Pick 5 random cards
        
        const left = deckCards.map((c: Card) => ({ id: c.id, text: c.front }));
        const rightItemsSource = deckCards.map((c: Card) => ({ id: c.id, text: c.back }));
        const rightShuffled = [...rightItemsSource].sort(() => Math.random() - 0.5);
        
        setLeftItems(left);
        setRightItems(rightShuffled);

        // Calculate correct matches mapping (Left index -> Right index)
        const matches: Record<number, number> = {};
        left.forEach((l: GameItem, li: number) => {
          matches[li] = rightShuffled.findIndex((r: GameItem) => r.id === l.id);
        });
        setCorrectMatches(matches);

        // Generate MCQ options
        const correctSet = left.map((_: GameItem, i: number) => `${i + 1}-${String.fromCharCode(97 + matches[i])}`);
        
        const allOptions = [correctSet];
        while (allOptions.length < 4) {
          const fakeSet = left.map((_: GameItem, i: number) => `${i + 1}-${String.fromCharCode(97 + Math.floor(Math.random() * left.length))}`);
          // Ensure it's unique and not the correct set
          if (!allOptions.some((opt: string[]) => opt.join(",") === fakeSet.join(","))) {
            allOptions.push(fakeSet);
          }
        }

        const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);
        setOptions(shuffledOptions);
        setCorrectOptionIdx(shuffledOptions.findIndex(opt => opt.join(",") === correctSet.join(",")));
        
        setLoading(false);
      });
  }, [id]);

  const truncate = (text: string, len: number = 70) => {
    return text.length > len ? text.substring(0, len) + "..." : text;
  };

  function handleSelect(idx: number) {
    if (isAnswered) return;
    setSelectedIdx(idx);
    setIsAnswered(true);
  }

  if (loading) return <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}><div className="spinner" /></div>;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", padding: "2rem" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <Link href={`/deck/${id}`} style={{ textDecoration: "none", color: "var(--text-muted)", fontWeight: 500 }}>← Back</Link>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>Match the Columns</h2>
          <div style={{ width: 60 }} />
        </div>

        {/* Columns */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "3rem" }}>
          {/* Column A */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ textAlign: "center", fontWeight: 700, color: "var(--accent-light)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.5rem" }}>Column A</div>
            {leftItems.map((item, i) => (
              <div key={item.id} className="card" style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "1rem", minHeight: "70px", background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent-light)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 700, flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: 500 }}>{truncate(item.text)}</div>
              </div>
            ))}
          </div>

          {/* Column B */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ textAlign: "center", fontWeight: 700, color: "var(--accent-light)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.5rem" }}>Column B</div>
            {rightItems.map((item, i) => (
              <div key={item.id} className="card" style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "1rem", minHeight: "70px", background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--bg-elevated)", color: "var(--accent-light)", border: "1px solid var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 700, flexShrink: 0 }}>
                  {String.fromCharCode(97 + i)}
                </div>
                <div style={{ fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: 500 }}>{truncate(item.text)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Options */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Choose the correct matching set:</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {options.map((opt, i) => {
              const isSelected = selectedIdx === i;
              const isCorrect = i === correctOptionIdx;
              
              let borderColor = "var(--border)";
              let bgColor = "var(--bg-surface)";
              
              if (isAnswered) {
                if (isCorrect) { borderColor = "var(--success)"; bgColor = "rgba(16, 185, 129, 0.1)"; }
                else if (isSelected) { borderColor = "var(--danger)"; bgColor = "rgba(239, 68, 68, 0.1)"; }
              } else if (isSelected) {
                borderColor = "var(--accent-light)";
                bgColor = "rgba(99, 102, 241, 0.05)";
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className="card option-card"
                  style={{
                    padding: "1rem",
                    textAlign: "center",
                    cursor: isAnswered ? "default" : "pointer",
                    border: `2px solid ${borderColor}`,
                    background: bgColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "1rem",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: "var(--bg-elevated)", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0, border: "1px solid var(--border)" }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "1.1rem", letterSpacing: "1px", color: "var(--text-primary)" }}>
                    {opt.join(", ")}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {isAnswered && (
          <div style={{ textAlign: "center", animation: "fadeIn 0.4s ease" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: selectedIdx === correctOptionIdx ? "var(--success)" : "var(--danger)", marginBottom: "1.5rem" }}>
              {selectedIdx === correctOptionIdx ? "✨ Correct! You're a Master Matcher!" : "❌ Not quite right. Try again!"}
            </div>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <Link href={`/deck/${id}`} className="btn btn-secondary">Back to Deck</Link>
              <button onClick={() => window.location.reload()} className="btn btn-primary">Try Another</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
