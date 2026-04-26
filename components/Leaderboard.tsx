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
            padding: "0.75rem", background: index === 0 ? "rgba(99,102,241,0.1)" : "transparent",
            borderRadius: "var(--radius-md)", borderBottom: index === entries.length - 1 ? "none" : "1px solid var(--border)"
          }}>
            <div style={{ fontWeight: 700, width: 24, color: index < 3 ? "var(--accent-light)" : "var(--text-muted)" }}>
              #{index + 1}
            </div>
            {entry.image ? (
              <img src={entry.image} alt={entry.name} style={{ width: 32, height: 32, borderRadius: "50%" }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }}>
                {entry.name?.charAt(0) || "?"}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{entry.name || "Anonymous"}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Level {entry.level}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700, color: "var(--accent-light)" }}>{entry.xp} XP</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>🔥 {entry.streak}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
