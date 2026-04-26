"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  streak: number;
  bestStreak: number;
  xp: number;
  level: number;
  accuracy: number;
  totalStudied: number;
  masteredCount: number;
  weakTopics: { title: string; accuracy: number }[];
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="card" style={{ padding: "2rem", textAlign: "center" }}>Loading stats...</div>;
  if (!stats) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", width: "100%", maxWidth: 1200, margin: "0 auto" }}>
      {/* Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ fontSize: "2.5rem" }}>🔥</div>
          <div className="stat-value">{stats.streak}</div>
          <div className="stat-label">Day Streak</div>
        </div>
        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ fontSize: "2.5rem" }}>🎯</div>
          <div className="stat-value">{stats.accuracy}%</div>
          <div className="stat-label">Accuracy</div>
        </div>
        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ fontSize: "2.5rem" }}>⭐</div>
          <div className="stat-value">Lvl {stats.level}</div>
          <div className="stat-label">{stats.xp} XP</div>
        </div>
        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ fontSize: "2.5rem" }}>🏆</div>
          <div className="stat-value">{stats.masteredCount}</div>
          <div className="stat-label">Mastered</div>
        </div>
      </div>

      {/* Weak Topics */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
          <span>🧠</span> Weak Topics
        </h3>
        {stats.weakTopics.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {stats.weakTopics.map((topic) => (
              <div key={topic.title} style={{ padding: "1rem", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontWeight: 600 }}>
                  <span>{topic.title}</span>
                  <span style={{ color: topic.accuracy < 50 ? "var(--accent-red, #ef4444)" : "var(--accent-orange, #f59e0b)" }}>
                    {topic.accuracy}% accuracy
                  </span>
                </div>
                <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${topic.accuracy}%`, background: topic.accuracy < 50 ? "var(--accent-red, #ef4444)" : "var(--accent-orange, #f59e0b)" }} />
                </div>
              </div>
            ))}
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              Focus on these topics in your next study session!
            </p>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
            No weak topics detected yet. Keep studying!
          </div>
        )}
      </div>
    </div>
  );
}
