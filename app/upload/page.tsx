"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "generating" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Check if user is signed in by hitting the session endpoint
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(data => setIsGuest(!data?.user))
      .catch(() => setIsGuest(true));
  }, []);

  function handleFile(f: File) {
    if (f.type !== "application/pdf") { setError("Please upload a PDF file."); return; }
    if (f.size > 20 * 1024 * 1024) { setError("File must be under 20MB."); return; }
    setFile(f);
    setError("");
  }

  async function handleSubmit() {
    if (!file) return;
    setStatus("uploading");
    setProgress(20);
    setError("");

    try {
      const fd = new FormData();
      fd.append("pdf", file);

      setStatus("generating");
      setProgress(50);

      // Use guest route if not signed in
      const endpoint = isGuest ? "/api/guest/generate" : "/api/generate";
      const res = await fetch(endpoint, { method: "POST", body: fd });
      setProgress(90);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      setProgress(100);
      setStatus("done");

      if (isGuest) {
        // Store deck in sessionStorage, redirect to guest study page
        sessionStorage.setItem("guest_deck", JSON.stringify(data.deck));
        setTimeout(() => router.push("/guest-deck"), 600);
      } else {
        setTimeout(() => router.push(`/deck/${data.deck.id}`), 600);
      }
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  const isLoading = status === "uploading" || status === "generating";

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: 580, animation: "fadeUp 0.5s ease" }}>

          {/* Guest Banner */}
          {isGuest && (
            <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "var(--radius-sm)", padding: "0.75rem 1.2rem", marginBottom: "1.5rem", fontSize: "0.825rem", color: "var(--accent-light)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span>👤 You&apos;re in <strong>Guest Mode</strong> — cards won&apos;t be saved after you close the browser.</span>
              <Link href="/api/auth/signin" className="btn btn-primary btn-sm">Sign In to Save</Link>
            </div>
          )}

          <div style={{ marginBottom: "2rem" }}>
            <h1 style={{ marginBottom: "0.5rem" }}>Create New Deck</h1>
            <p style={{ color: "var(--text-secondary)" }}>Upload a PDF and let AI generate your flashcards</p>
          </div>

          {/* Upload Zone */}
          <div
            className={`upload-zone ${dragOver ? "drag-over" : ""}`}
            onClick={() => !file && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) handleFile(f);
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />

            {!file ? (
              <>
                <div className="upload-icon">📄</div>
                <h3 style={{ marginBottom: "0.5rem" }}>Drop your PDF here</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>
                  or click to browse · Max 20MB
                </p>
                <span className="btn btn-secondary btn-sm">Choose File</span>
              </>
            ) : (
              <div>
                <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>✅</div>
                <h3 style={{ marginBottom: "0.25rem" }}>{file.name}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "1rem" }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                >
                  Change File
                </button>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "var(--danger-glow)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-sm)", color: "#f87171", fontSize: "0.875rem" }}>
              ❌ {error}
            </div>
          )}

          {/* Progress */}
          {isLoading && (
            <div style={{ marginTop: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                <span>{status === "uploading" ? "Uploading PDF…" : "🧠 AI generating cards…"}</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              {status === "generating" && (
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem", textAlign: "center" }}>
                  Gemini is reading your PDF and crafting teacher-quality flashcards…
                </p>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            className="btn btn-primary btn-lg"
            style={{ width: "100%", marginTop: "1.5rem", justifyContent: "center" }}
            onClick={handleSubmit}
            disabled={!file || isLoading}
          >
            {isLoading ? (
              <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Processing…</>
            ) : (
              <><span>⚡</span> Generate Flashcards</>
            )}
          </button>

          <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "1rem" }}>
            Powered by Google Gemini 2.0 Flash · Usually takes 10-20 seconds
          </p>

          {/* Tips */}
          <div className="card" style={{ marginTop: "2rem" }}>
            <h3 style={{ fontSize: "0.9rem", marginBottom: "0.75rem" }}>💡 Tips for best results</h3>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                "Use PDFs with clear text (not scanned images)",
                "Textbook chapters, lecture notes, and study guides work great",
                "The AI generates 20-40 cards depending on content length",
                "You can edit any card after generation",
              ].map((tip) => (
                <li key={tip} style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", gap: "0.5rem" }}>
                  <span style={{ color: "var(--success)" }}>✓</span> {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
