"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const ROWS = 5;
const COLS = 8;
const COLORS = ["#ff6b6b", "#ff9f43", "#feca57", "#1dd1a1", "#54a0ff"];

type Game = { x: number; y: number; dx: number; dy: number; paddle: number; bricks: boolean[][]; score: number; lives: number; running: boolean; ended: string };

function newGame(): Game {
  return { x: 200, y: 325, dx: 3.1, dy: -3.1, paddle: 200, bricks: Array.from({ length: ROWS }, () => Array(COLS).fill(true)), score: 0, lives: 3, running: false, ended: "" };
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const game = useRef<Game>(newGame());
  const pointer = useRef<number | null>(null);
  const [hud, setHud] = useState({ score: 0, lives: 3, message: "시작 버튼을 눌러 도전하세요" });

  const sync = useCallback(() => setHud({ score: game.current.score, lives: game.current.lives, message: game.current.ended || (game.current.running ? "벽돌을 모두 부숴보세요!" : "시작 버튼을 눌러 도전하세요") }), []);
  const restart = useCallback(() => { game.current = newGame(); sync(); }, [sync]);
  const start = useCallback(() => { if (game.current.ended) restart(); game.current.running = true; sync(); }, [restart, sync]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let frame = 0;
    const draw = () => {
      const g = game.current; const W = canvas.width; const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#152457"); sky.addColorStop(1, "#071128"); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 34; i++) { ctx.fillStyle = "rgba(255,255,255,.3)"; ctx.fillRect((i * 83) % W, (i * 47) % 230, 2, 2); }
      const gap = 7, bw = (W - 48 - gap * (COLS - 1)) / COLS, bh = 20;
      g.bricks.forEach((row, r) => row.forEach((alive, c) => { if (!alive) return; const x = 24 + c * (bw + gap), y = 37 + r * (bh + gap); ctx.fillStyle = COLORS[r]; ctx.shadowColor = COLORS[r]; ctx.shadowBlur = 12; ctx.fillRect(x, y, bw, bh); ctx.shadowBlur = 0; ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.fillRect(x, y, bw, 4); }));
      ctx.fillStyle = "#dff8ff"; ctx.shadowColor = "#67e8f9"; ctx.shadowBlur = 15; ctx.beginPath(); ctx.arc(g.x, g.y, 7, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      const px = Math.max(12, Math.min(W - 12 - 88, g.paddle - 44)); g.paddle = px + 44; const pg = ctx.createLinearGradient(px, 0, px + 88, 0); pg.addColorStop(0, "#38bdf8"); pg.addColorStop(.5, "#e0f2fe"); pg.addColorStop(1, "#38bdf8"); ctx.fillStyle = pg; ctx.fillRect(px, H - 30, 88, 10);
      if (g.running) {
        g.x += g.dx; g.y += g.dy;
        if (g.x < 7 || g.x > W - 7) g.dx *= -1;
        if (g.y < 7) g.dy *= -1;
        if (g.y > H - 43 && g.y < H - 20 && g.x > px - 8 && g.x < px + 96 && g.dy > 0) { g.dy = -Math.abs(g.dy); g.dx = (g.x - g.paddle) / 13; }
        g.bricks.forEach((row, r) => row.forEach((alive, c) => { const bx = 24 + c * (bw + gap), by = 37 + r * (bh + gap); if (alive && g.x > bx && g.x < bx + bw && g.y > by && g.y < by + bh) { row[c] = false; g.dy *= -1; g.score += 10; sync(); } }));
        if (g.y > H + 12) { g.lives--; if (g.lives === 0) { g.running = false; g.ended = "게임 오버! 다시 한 번?"; } else { g.x = W / 2; g.y = 325; g.dy = -3.1; } sync(); }
        if (g.score === ROWS * COLS * 10) { g.running = false; g.ended = "완벽해요! 모든 벽돌을 깼습니다 ✨"; sync(); }
      }
      frame = requestAnimationFrame(draw);
    }; draw(); return () => cancelAnimationFrame(frame);
  }, [sync]);

  useEffect(() => { const key = (e: KeyboardEvent) => { if (e.key === "ArrowLeft" || e.key === "a") game.current.paddle -= 24; if (e.key === "ArrowRight" || e.key === "d") game.current.paddle += 24; if (e.key === " ") { e.preventDefault(); start(); } }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, [start]);
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => { const rect = e.currentTarget.getBoundingClientRect(); game.current.paddle = ((e.clientX - rect.left) / rect.width) * 400; };

  return <main>
    <section className="game-card" aria-label="벽돌 깨기 게임">
      <header><div><p className="eyebrow">ARCADE CLASSIC</p><h1>BRICK <em>BLAST</em></h1></div><div className="stats"><span>점수 <b>{hud.score.toString().padStart(4, "0")}</b></span><span>목숨 <b>{"●".repeat(hud.lives)}{"○".repeat(3 - hud.lives)}</b></span></div></header>
      <div className="screen"><canvas ref={canvasRef} width="400" height="430" onPointerMove={move} onPointerDown={(e) => { pointer.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); move(e); }} aria-label="게임 화면. 좌우 방향키 또는 마우스로 패들을 움직이세요." /><p className="hint">← → 또는 A · D 키로 패들을 움직이세요</p></div>
      <footer><p aria-live="polite">{hud.message}</p><button onClick={game.current.running ? restart : start}>{game.current.running ? "새 게임" : game.current.ended ? "다시 하기" : "게임 시작"}<span>▶</span></button></footer>
    </section>
  </main>;
}
