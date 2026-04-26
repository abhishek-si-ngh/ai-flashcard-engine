"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface QuizCard {
  id: string;
  question: string;
  correctAnswer: string;
  options: string[];
  hint: string | null;
}

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [cards, setCards] = useState<QuizCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime] = useState(Date.now());

  const loadQuiz = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/decks/${id}/quiz`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to generate quiz. AI might be busy.");
        return res.json();
      })
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setCards(data.quiz);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    loadQuiz();
  }, [loadQuiz]);

  async function handleFinish() {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    await fetch("/api/sessions", {
      method: "POST",
      body: JSON.stringify({
        deckId: id,
        cardsStudied: cards.length,
        correctCount: score,
        duration,
        type: "quiz"
      }),
    });
    setIsFinished(true);
  }

  function handleOptionSelect(option: string) {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    if (option === cards[currentIndex].correctAnswer) {
      setScore(score + 1);
    }
  }

  function handleNext() {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      handleFinish();
    }
  }

  if (error) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "var(--bg-base)", padding: "2rem" }}>
        <div className="card" style={{ maxWidth: 400, textAlign: "center", padding: "2.5rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
          <h3 style={{ marginBottom: "0.5rem" }}>Failed to load Quiz</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>{error}</p>
          <button onClick={loadQuiz} className="btn btn-primary" style={{ width: "100%" }}>Try Again</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "var(--bg-base)", padding: "2rem" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 1.5rem" }} />
          <h3 style={{ color: "var(--text-primary)", marginBottom: "0.5rem" }}>AI is crafting your custom quiz...</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Generating fresh, rephrased questions.</p>
        </div>
      </div>
    );
  }
  
  if (isFinished) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div className="card" style={{ maxWidth: 500, width: "100%", textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎉</div>
          <h2>Quiz Completed!</h2>
          <div style={{ fontSize: "3rem", fontWeight: 800, margin: "1.5rem 0", color: "var(--accent-light)" }}>
            {score} / {cards.length}
          </div>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
            You earned {score * 10} XP! Your progress has been saved.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <Link href={`/deck/${id}`} className="btn btn-primary">Back to Deck</Link>
            <button onClick={() => window.location.reload()} className="btn btn-secondary">Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", padding: "1.5rem" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <Link href={`/deck/${id}`} style={{ textDecoration: "none", color: "var(--text-muted)", fontSize: "0.85rem" }}>← Quit Quiz</Link>
          <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>Question {currentIndex + 1} of {cards.length}</div>
          <div style={{ color: "var(--accent-light)", fontWeight: 700, fontSize: "0.9rem" }}>Score: {score}</div>
        </div>

        <div className="progress-bar" style={{ marginBottom: "1.5rem", height: 6 }}>
          <div className="progress-fill" style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }} />
        </div>

        <div className="card" style={{ padding: "3rem 2rem", marginBottom: "1.5rem", textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
          <h2 style={{ fontSize: "1.5rem", lineHeight: 1.4, color: "var(--text-primary)", fontWeight: 600, maxWidth: 700, margin: "0 auto" }}>{currentCard.question}</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {currentCard.options.map((option, i) => {
            const isCorrect = option === currentCard.correctAnswer;
            const isSelected = option === selectedOption;
            
            let borderColor = "var(--border)";
            let bgColor = "var(--bg-surface)";
            
            if (isAnswered) {
              if (isCorrect) {
                borderColor = "#10b981";
                bgColor = "rgba(16, 185, 129, 0.15)";
              } else if (isSelected) {
                borderColor = "#ef4444";
                bgColor = "rgba(239, 68, 68, 0.15)";
              }
            } else if (isSelected) {
              borderColor = "var(--accent-light)";
              bgColor = "rgba(99, 102, 241, 0.05)";
            }

            return (
              <button
                key={i}
                onClick={() => handleOptionSelect(option)}
                className="card option-card"
                style={{ 
                  padding: "1.25rem", 
                  textAlign: "left", 
                  cursor: isAnswered ? "default" : "pointer",
                  border: `2px solid ${borderColor}`, 
                  background: bgColor,
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  display: "flex",
                  gap: "1rem",
                  alignItems: "center",
                  width: "100%",
                  minHeight: "80px",
                  position: "relative"
                }}
              >
                <div style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: "50%", 
                  border: `1px solid ${isSelected ? "transparent" : "var(--border)"}`,
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  flexShrink: 0,
                  background: isSelected ? "var(--accent-light)" : "var(--bg-elevated)",
                  color: isSelected ? "white" : "var(--text-secondary)",
                  boxShadow: isSelected ? "0 4px 10px rgba(99, 102, 241, 0.3)" : "none"
                }}>
                  {String.fromCharCode(65 + i)}
                </div>
                <span style={{ 
                  fontWeight: 500, 
                  fontSize: "0.95rem", 
                  color: "var(--text-primary)",
                  lineHeight: 1.4,
                  flex: 1
                }}>
                  {option}
                </span>
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className="animate-fade-in" style={{ marginTop: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button onClick={handleNext} className="btn btn-primary btn-lg" style={{ minWidth: 200, padding: "0.75rem 1.5rem", fontSize: "1rem" }}>
                {currentIndex < cards.length - 1 ? "Next Question →" : "Finish Quiz"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
