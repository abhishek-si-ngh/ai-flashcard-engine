"use client";

import { useState, useEffect } from "react";
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
  const [isFinished, setIsFinished] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    fetch(`/api/decks/${id}/quiz`)
      .then((res) => res.json())
      .then((data) => {
        setCards(data.quiz);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

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

  if (loading) return <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}><div className="spinner" /></div>;
  
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
    <div style={{ minHeight: "100vh", background: "var(--bg-surface)", padding: "2rem" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <Link href={`/deck/${id}`} style={{ textDecoration: "none", color: "var(--text-muted)" }}>← Quit Quiz</Link>
          <div style={{ fontWeight: 600 }}>Question {currentIndex + 1} of {cards.length}</div>
          <div style={{ color: "var(--accent-light)", fontWeight: 700 }}>Score: {score}</div>
        </div>

        <div className="progress-bar" style={{ marginBottom: "3rem" }}>
          <div className="progress-fill" style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }} />
        </div>

        <div className="card" style={{ padding: "3rem", marginBottom: "2rem", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.5rem", lineHeight: 1.5 }}>{currentCard.question}</h2>
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
                bgColor = "rgba(16, 185, 129, 0.1)";
              } else if (isSelected) {
                borderColor = "#ef4444";
                bgColor = "rgba(239, 68, 68, 0.1)";
              }
            } else if (isSelected) {
              borderColor = "var(--accent-light)";
            }

            return (
              <button
                key={i}
                onClick={() => handleOptionSelect(option)}
                className="card"
                style={{ 
                  padding: "1.5rem", textAlign: "left", cursor: isAnswered ? "default" : "pointer",
                  border: `2px solid ${borderColor}`, background: bgColor,
                  transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <div style={{ 
                    width: 24, height: 24, borderRadius: "50%", border: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem",
                    background: isSelected ? "var(--accent-light)" : "transparent",
                    color: isSelected ? "white" : "var(--text-muted)"
                  }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span style={{ fontWeight: 500 }}>{option}</span>
                </div>
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div style={{ marginTop: "2rem", display: "flex", justifyContent: "center", animation: "fadeIn 0.3s ease" }}>
            <button onClick={handleNext} className="btn btn-primary btn-lg" style={{ minWidth: 200 }}>
              {currentIndex < cards.length - 1 ? "Next Question" : "Finish Quiz"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
