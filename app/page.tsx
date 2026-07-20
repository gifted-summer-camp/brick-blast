"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const W = 400, H = 430, R = 7, PW = 88, PH = 10, ROWS = 5, COLS = 8, GAP = 7, BRICK_H = 20;
const BRICK_W = (W - 48 - GAP * (COLS - 1)) / COLS;
const COLORS = ["#ff6b6b", "#ff9f43", "#feca57", "#1dd1a1", "#54a0ff"];
type Rank = { name: string; score: number };
type Game = { x: number; y: number; vx: number; vy: number; paddle: number; bricks: boolean[][]; score: number; lives: number; playing: boolean; message: string; saved: boolean };
const fresh = (): Game => ({ x: W / 2, y: 320, vx: 180, vy: -180, paddle: W / 2, bricks: Array.from({ length: ROWS }, () => Array(COLS).fill(true)), score: 0, lives: 3, playing: false, message: "시작 버튼을 눌러 도전하세요", saved: false });
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function circleHitsRect(x: number, y: number, r: number, left: number, top: number, width: number, height: number) {
  const cx = clamp(x, left, left + width), cy = clamp(y, top, top + height);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r ** 2;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const game = useRef<Game>(fresh());
  const keys = useRef({ left: false, right: false });
  const [hud, setHud] = useState({ score: 0, lives: 3, message: game.current.message });
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [name, setName] = useState("플레이어");
  const [ranks, setRanks] = useState<Rank[]>([]);
  const sync = useCallback(() => { const g = game.current; setHud({ score: g.score, lives: g.lives, message: g.message }); }, []);

  useEffect(() => { try { setRanks(JSON.parse(localStorage.getItem("brick-blast-ranks") || "[]")); } catch { setRanks([]); } }, []);
  const saveRank = useCallback(() => { const g = game.current; if (g.saved || !g.score) return; g.saved = true; setRanks(old => { const next = [...old, { name: name.trim().slice(0, 12) || "플레이어", score: g.score }].sort((a, b) => b.score - a.score).slice(0, 5); localStorage.setItem("brick-blast-ranks", JSON.stringify(next)); return next; }); }, [name]);
  const restart = useCallback(() => { game.current = fresh(); sync(); }, [sync]);
  const start = useCallback(() => { if (game.current.message.includes("게임") || game.current.message.includes("완료")) restart(); game.current.playing = true; game.current.message = "모든 벽돌을 깨보세요!"; sync(); }, [restart, sync]);

  useEffect(() => {
    const canvas = canvasRef.current!, ctx = canvas.getContext("2d")!; let id = 0, previous = performance.now();
    const render = (now: number) => {
      const g = game.current, dt = Math.min((now - previous) / 1000, 0.033); previous = now;
      if (g.playing) {
        const direction = Number(keys.current.right) - Number(keys.current.left);
        g.paddle = clamp(g.paddle + direction * 310 * dt, PW / 2 + 12, W - PW / 2 - 12);
        let nx = g.x + g.vx * dt, ny = g.y + g.vy * dt;
        if (nx - R <= 0 || nx + R >= W) { g.vx *= -1; nx = clamp(nx, R, W - R); }
        if (ny - R <= 0) { g.vy = Math.abs(g.vy); ny = R; }
        const paddleX = g.paddle - PW / 2, paddleY = H - 30;
        if (g.vy > 0 && circleHitsRect(nx, ny, R, paddleX, paddleY, PW, PH)) { g.vy = -Math.abs(g.vy); g.vx = clamp((nx - g.paddle) * 5.2, -290, 290); ny = paddleY - R - .1; }
        let hit = false;
        for (let row = 0; row < ROWS && !hit; row++) for (let col = 0; col < COLS && !hit; col++) if (g.bricks[row][col]) {
          const bx = 24 + col * (BRICK_W + GAP), by = 37 + row * (BRICK_H + GAP);
          if (circleHitsRect(nx, ny, R, bx, by, BRICK_W, BRICK_H)) {
            g.bricks[row][col] = false; g.score += 10; hit = true;
            const previousX = g.x, previousY = g.y;
            const crossedVertical = previousY + R <= by || previousY - R >= by + BRICK_H;
            g.vy = crossedVertical ? -g.vy : g.vy; g.vx = crossedVertical ? g.vx : -g.vx;
            nx = g.x + g.vx * dt; ny = g.y + g.vy * dt; sync();
          }
        }
        g.x = nx; g.y = ny;
        if (g.score === ROWS * COLS * 10) { g.playing = false; g.message = "게임 완료! 최고 기록에 등록됐어요 ✨"; saveRank(); sync(); }
        else if (g.y - R > H) { g.lives--; if (!g.lives) { g.playing = false; g.message = "게임 오버 — 기록을 확인해보세요"; saveRank(); } else { g.x = W / 2; g.y = 320; g.vx = 180; g.vy = -180; g.message = "공을 다시 발사합니다!"; } sync(); }
      }
      ctx.clearRect(0, 0, W, H); const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, theme === "light" ? "#dff4ff" : "#152457"); bg.addColorStop(1, theme === "light" ? "#f9fbff" : "#071128"); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      g.bricks.forEach((row, r) => row.forEach((alive, c) => { if (!alive) return; const x = 24 + c * (BRICK_W + GAP), y = 37 + r * (BRICK_H + GAP); ctx.fillStyle = COLORS[r]; ctx.fillRect(x, y, BRICK_W, BRICK_H); ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(x, y, BRICK_W, 4); }));
      ctx.fillStyle = "#ffffff"; ctx.shadowColor = "#22d3ee"; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(g.x, g.y, R, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      const px = g.paddle - PW / 2, grad = ctx.createLinearGradient(px, 0, px + PW, 0); grad.addColorStop(0, "#0ea5e9"); grad.addColorStop(.5, "#e0f2fe"); grad.addColorStop(1, "#0ea5e9"); ctx.fillStyle = grad; ctx.fillRect(px, H - 30, PW, PH); id = requestAnimationFrame(render);
    }; id = requestAnimationFrame(render); return () => cancelAnimationFrame(id);
  }, [saveRank, sync, theme]);

  useEffect(() => { const down = (e: KeyboardEvent) => { if (["ArrowLeft", "ArrowRight", "a", "d", "A", "D", " "].includes(e.key)) e.preventDefault(); if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") keys.current.left = true; if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") keys.current.right = true; if (e.key === " ") start(); }; const up = (e: KeyboardEvent) => { if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") keys.current.left = false; if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") keys.current.right = false; }; window.addEventListener("keydown", down); window.addEventListener("keyup", up); return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); }; }, [start]);
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => { const rect = e.currentTarget.getBoundingClientRect(); game.current.paddle = clamp(((e.clientX - rect.left) / rect.width) * W, PW / 2 + 12, W - PW / 2 - 12); };

  return <main data-theme={theme}><section className="game-card"><header><div><p className="eyebrow">ARCADE CLASSIC</p><h1>BRICK <em>BLAST</em></h1></div><button className="theme" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label="테마 전환">{theme === "light" ? "☾ 다크" : "☀ 라이트"}</button><div className="stats"><span>점수 <b>{hud.score.toString().padStart(4, "0")}</b></span><span>목숨 <b>{"●".repeat(hud.lives)}{"○".repeat(3 - hud.lives)}</b></span></div></header><div className="screen"><canvas ref={canvasRef} width={W} height={H} onPointerMove={move} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); move(e); }} aria-label="게임 화면"/><p className="hint">← → 또는 A · D 키를 누르고 있으면 부드럽게 이동합니다</p></div><footer><div><p aria-live="polite">{hud.message}</p><label>랭킹 이름 <input value={name} onChange={e => setName(e.target.value)} maxLength={12}/></label></div><button className="start" onClick={game.current.playing ? restart : start}>{game.current.playing ? "새 게임" : "게임 시작"} <span>▶</span></button></footer><section className="ranking" aria-label="이 기기 랭킹"><div><h2>🏆 이 기기 랭킹</h2><small>상위 5개 기록이 이 브라우저에 저장됩니다</small></div><ol>{ranks.length ? ranks.map((rank, i) => <li key={`${rank.name}-${i}`}><b>{i + 1}</b><span>{rank.name}</span><strong>{rank.score.toString().padStart(4, "0")}</strong></li>) : <li className="empty">아직 등록된 기록이 없어요</li>}</ol></section></section></main>;
}
