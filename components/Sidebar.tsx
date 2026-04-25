"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home", icon: <HomeIcon /> },
    { href: "/library", label: "My Library", icon: <LibraryIcon /> },
    { href: "/upload", label: "New Deck", icon: <PlusIcon /> },
  ];

  return (
    <aside className="sidebar">
      <Link href="/" className="logo">
        <div className="logo-icon">⚡</div>
        <span className="logo-text">FlashForge</span>
      </Link>

      <nav className="nav-section">
        <div className="nav-label">Navigation</div>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`nav-link ${pathname === l.href ? "active" : ""}`}
          >
            {l.icon}
            {l.label}
          </Link>
        ))}
      </nav>

      <div style={{ marginTop: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div className="nav-label" style={{ marginBottom: 0 }}>Theme</div>
          <ThemeToggle />
        </div>
        <div className="nav-label">About</div>
        <div style={{ padding: "0.75rem", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
            📊 SM-2 spaced repetition ensures you review cards at the perfect moment for long-term retention.
          </p>
        </div>
      </div>
    </aside>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}
