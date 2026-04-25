"use client";
import { useEffect, useRef } from "react";

export default function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#6366f1","#a78bfa","#f472b6","#34d399","#fbbf24","#60a5fa"];
    const particles = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: Math.random() * 4 + 2,
      angle: Math.random() * 360,
      spin: (Math.random() - 0.5) * 6,
      drift: (Math.random() - 0.5) * 2,
    }));

    let frame = 0;
    function draw() {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      particles.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.angle * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
        ctx.restore();
        p.y += p.speed;
        p.x += p.drift;
        p.angle += p.spin;
      });
      frame++;
      if (frame < 180) rafRef.current = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas!.width, canvas!.height);
    }
    draw();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      id="confetti-canvas"
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9998 }}
    />
  );
}
