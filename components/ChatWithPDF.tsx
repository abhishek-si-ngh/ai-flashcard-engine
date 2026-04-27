"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "model";
  parts: string[];
}

export function ChatWithPDF({ deckId, title }: { deckId: string; title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  async function handleSend() {
    if (!query.trim() || loading) return;

    const userMsg: Message = { role: "user", parts: [query] };
    setHistory((prev) => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    try {
      const res = await fetch(`/api/decks/${deckId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, history: history }),
      });
      const data = await res.json();
      if (data.response) {
        setHistory((prev) => [...prev, { role: "model", parts: [data.response] }]);
      } else {
        setHistory((prev) => [...prev, { role: "model", parts: ["Sorry, I couldn't process that."] }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button 
        id="chat-trigger"
        onClick={() => setIsOpen(true)}
        className="btn btn-secondary"
        style={{ position: "fixed", bottom: 24, right: 24, borderRadius: "50%", width: 60, height: 60, fontSize: "1.5rem", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", zIndex: 100 }}
      >
        💬
      </button>
    );
  }

  return (
    <div className="card" style={{ 
      position: "fixed", bottom: 24, right: 24, width: 400, height: 500, 
      display: "flex", flexDirection: "column", zIndex: 100,
      boxShadow: "0 20px 40px rgba(0,0,0,0.3)", padding: 0, overflow: "hidden"
    }}>
      <div style={{ padding: "1rem", background: "var(--accent-light)", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 600 }}>Chat: {title}</div>
        <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "white", fontSize: "1.25rem", cursor: "pointer" }}>×</button>
      </div>
      
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {history.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "2rem" }}>
            Ask me anything about this document!
          </div>
        )}
        {history.map((msg, i) => (
          <div key={i} style={{ 
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "80%",
            padding: "0.75rem 1rem",
            borderRadius: msg.role === "user" ? "15px 15px 0 15px" : "15px 15px 15px 0",
            background: msg.role === "user" ? "var(--accent-light)" : "var(--bg-elevated)",
            color: msg.role === "user" ? "white" : "var(--text-primary)",
            fontSize: "0.9rem",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
          }}>
            {msg.parts[0]}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", padding: "0.5rem", color: "var(--text-muted)" }}>Thinking...</div>
        )}
      </div>

      <div style={{ padding: "1rem", borderTop: "1px solid var(--border)", display: "flex", gap: "0.5rem" }}>
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask a question..."
          style={{ 
            flex: 1, 
            padding: "0.75rem", 
            borderRadius: 8, 
            border: "1px solid var(--border)", 
            background: "var(--bg-elevated)",
            color: "var(--text-primary)",
            fontSize: "0.9rem"
          }}
        />
        <button onClick={handleSend} disabled={loading} className="btn btn-primary btn-sm">Send</button>
      </div>
    </div>
  );
}
