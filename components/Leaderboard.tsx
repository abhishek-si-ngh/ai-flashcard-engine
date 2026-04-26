"use client";

import { useEffect, useState } from "react";

interface LeaderboardEntry {
  id: string;
  name: string;
  image: string;
  xp: number;
  level: number;
  streak: number;
}

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        setEntries(data.leaderboard);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="card" style={{ padding: "2rem", textAlign: "center" }}>Loading leaderboard...</div>;

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 8 }}>
        <span>🏆</span> Global Leaderboard
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {entries.map((entry, index) => (
          <div key={entry.id} style={{ 
            display: "flex", alignItems: "center", gap: "1rem", 
            padding: "0.75rem 1rem", background: index === 0 ? "rgba(99,102,241,0.08)" : "transparent",
            borderRadius: "var(--radius-md)", borderBottom: index === entries.length - 1 ? "none" : "1px solid var(--border)",
            transition: "background 0.2s"
          }}>
            <div style={{ fontWeight: 800, width: 30, color: index < 3 ? "var(--accent-light)" : "var(--text-muted)", fontSize: "0.85rem" }}>
              #{index + 1}
            </div>
            {entry.image ? (
              <img src={entry.image} alt={entry.name} style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid var(--border)" }} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--bg-elevated)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>
                {entry.name?.charAt(0) || "?"}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)" }}>{entry.name || "Anonymous"}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 500 }}>Level {entry.level}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 800, color: "var(--accent-light)", fontSize: "0.95rem" }}>{entry.xp} XP</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>🔥 {entry.streak}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
