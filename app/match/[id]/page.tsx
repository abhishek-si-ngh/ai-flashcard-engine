"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Card {
  id: string;
  front: string;
  back: string;
}

export default function MatchGame() {
  const { id } = useParams<{ id: string }>();
  const [cards, setCards] = useState<Card[]>([]);
  const [items, setItems] = useState<{ id: string; text: string; type: "front" | "back" }[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [startTime] = useState(Date.now());
  const [timer, setTimer] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/decks/${id}`)
      .then((res) => res.json())
      .then((data) => {
        const deckCards = data.deck.cards.slice(0, 6); // Use 6 cards for matching
        setCards(deckCards);
        
        const gameItems: { id: string; text: string; type: "front" | "back" }[] = [];
        deckCards.forEach((c: Card) => {
          gameItems.push({ id: c.id, text: c.front, type: "front" });
          gameItems.push({ id: c.id, text: c.back, type: "back" });
        });
        
        setItems(gameItems.sort(() => Math.random() - 0.5));
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

  function handleSelect(index: number) {
    if (matched.includes(items[index].id)) return;
    if (selected === index) {
      setSelected(null);
      return;
    }

    if (selected === null) {
      setSelected(index);
    } else {
      const first = items[selected];
      const second = items[index];

      if (first.id === second.id && first.type !== second.type) {
        // Match!
        setMatched([...matched, first.id]);
        setSelected(null);
        if (matched.length + 1 === cards.length) {
          setIsFinished(true);
        }
      } else {
        // Wrong match
        setSelected(index); // Just select the new one
      }
    }
  }

  if (loading) return <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}><div className="spinner" /></div>;

  if (isFinished) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div className="card" style={{ maxWidth: 500, width: "100%", textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>⏱️</div>
          <h2>Well Done!</h2>
          <div style={{ fontSize: "3.5rem", fontWeight: 800, margin: "1.5rem 0", color: "var(--accent-light)" }}>
            {timer}s
          </div>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
            You matched all terms in {timer} seconds.
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
          <Link href={`/deck/${id}`} style={{ textDecoration: "none", color: "var(--text-muted)", fontWeight: 500 }}>← Back</Link>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>{timer}s</div>
          <div style={{ color: "var(--text-muted)", fontWeight: 500 }}>Matched: <span style={{ color: "var(--accent-light)", fontWeight: 700 }}>{matched.length}</span> / {cards.length}</div>
        </div>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", 
          gap: "1.25rem", 
          perspective: "1000px" 
        }}>
          {items.map((item, i) => {
            const isMatched = matched.includes(item.id);
            const isSelected = selected === i;

            return (
              <div
                key={i}
                onClick={() => handleSelect(i)}
                className="card"
                style={{
                  height: 160,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: "1.5rem",
                  cursor: isMatched ? "default" : "pointer",
                  opacity: isMatched ? 0 : 1,
                  transform: isSelected ? "scale(1.05) translateY(-5px)" : "scale(1)",
                  border: isSelected ? "2px solid var(--accent-light)" : "1px solid var(--border)",
                  background: isSelected ? "rgba(99, 102, 241, 0.1)" : "var(--bg-surface)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  visibility: isMatched ? "hidden" : "visible",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  boxShadow: isSelected ? "0 15px 30px rgba(99, 102, 241, 0.2)" : "0 4px 6px rgba(0,0,0,0.05)",
                  userSelect: "none",
                  lineHeight: 1.4,
                  borderRadius: "16px"
                }}
              >
                {item.text}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
