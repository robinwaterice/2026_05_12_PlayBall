import React, { useEffect, useRef, useState } from 'react';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 120;
const PADDLE_HEIGHT = 16;
const BALL_RADIUS = 8;
const BRICK_ROW_COUNT = 6;
const BRICK_COLUMN_COUNT = 10;
const BRICK_PADDING = 8;
const BRICK_WIDTH = 68;
const BRICK_HEIGHT = 24;
const BRICK_OFFSET_TOP = 80;
const BRICK_OFFSET_LEFT = (CANVAS_WIDTH - (BRICK_COLUMN_COUNT * BRICK_WIDTH + BRICK_PADDING * (BRICK_COLUMN_COUNT - 1))) / 2;

const BRICK_THEMES = [
  { start: '#f472b6', end: '#db2777', shadow: 'rgba(236,72,153,0.4)' }, // pink
  { start: '#c084fc', end: '#9333ea', shadow: 'rgba(168,85,247,0.4)' }, // purple
  { start: '#22d3ee', end: '#0891b2', shadow: 'rgba(6,182,212,0.4)' }   // cyan
];

type Brick = { x: number; y: number; status: boolean; theme: typeof BRICK_THEMES[0] };

export default function BreakoutGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  const [uiState, setUiState] = useState({
    status: 'idle',
    score: 0,
    lives: 3
  });

  const state = useRef({
    status: 'idle',
    score: 0,
    lives: 3,
    paddle: { x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, width: PADDLE_WIDTH, dx: 8 },
    ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 80, dx: 6, dy: -6 },
    bricks: [] as Brick[][]
  });

  const keys = useRef({ right: false, left: false });

  const initBricks = () => {
    const bricks: Brick[][] = [];
    for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
      bricks[c] = [];
      for (let r = 0; r < BRICK_ROW_COUNT; r++) {
        bricks[c][r] = {
          x: BRICK_OFFSET_LEFT + c * (BRICK_WIDTH + BRICK_PADDING),
          y: BRICK_OFFSET_TOP + r * (BRICK_HEIGHT + BRICK_PADDING),
          status: true,
          theme: BRICK_THEMES[Math.floor(r / 2) % BRICK_THEMES.length]
        };
      }
    }
    return bricks;
  };

  const handleStart = () => {
    state.current.status = 'playing';
    state.current.score = 0;
    state.current.lives = 3;
    state.current.paddle.x = CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2;
    state.current.ball.x = CANVAS_WIDTH / 2;
    state.current.ball.y = CANVAS_HEIGHT - 80;
    
    const dir = Math.random() > 0.5 ? 1 : -1;
    state.current.ball.dx = 6 * dir;
    state.current.ball.dy = -6;

    state.current.bricks = initBricks();

    setUiState({ status: 'playing', score: 0, lives: 3 });
  };

  useEffect(() => {
    state.current.bricks = initBricks();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    const draw = () => {
      if (!ctx || !canvas) return;
      const s = state.current;
      
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw Bricks
      for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
        for (let r = 0; r < BRICK_ROW_COUNT; r++) {
          const b = s.bricks[c][r];
          if (b.status) {
            ctx.shadowColor = b.theme.shadow;
            ctx.shadowBlur = 15;
            ctx.shadowOffsetY = 0;

            const gradient = ctx.createLinearGradient(b.x, b.y, b.x + BRICK_WIDTH, b.y + BRICK_HEIGHT);
            gradient.addColorStop(0, b.theme.start);
            gradient.addColorStop(1, b.theme.end);
            
            ctx.beginPath();
            ctx.roundRect(b.x, b.y, BRICK_WIDTH, BRICK_HEIGHT, 4);
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.closePath();
          }
        }
      }

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Draw Paddle
      ctx.shadowColor = 'rgba(6,182,212,0.4)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 8;
      
      const paddleGradient = ctx.createLinearGradient(s.paddle.x, 0, s.paddle.x + s.paddle.width, 0);
      paddleGradient.addColorStop(0, '#22d3ee'); 
      paddleGradient.addColorStop(0.5, '#3b82f6'); 
      paddleGradient.addColorStop(1, '#22d3ee');

      ctx.beginPath();
      ctx.roundRect(s.paddle.x, CANVAS_HEIGHT - PADDLE_HEIGHT - 32, s.paddle.width, PADDLE_HEIGHT, 8);
      ctx.fillStyle = paddleGradient;
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.closePath();

      // Draw Ball
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 0;

      ctx.beginPath();
      ctx.arc(s.ball.x, s.ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.closePath();

      ctx.shadowColor = 'transparent';
    };

    const update = () => {
      const s = state.current;
      if (s.status !== 'playing') return;

      // Move Paddle
      if (keys.current.right && s.paddle.x < CANVAS_WIDTH - s.paddle.width) {
        s.paddle.x += s.paddle.dx;
      } else if (keys.current.left && s.paddle.x > 0) {
        s.paddle.x -= s.paddle.dx;
      }

      // Move Ball
      s.ball.x += s.ball.dx;
      s.ball.y += s.ball.dy;

      // Wall Bounds
      if (s.ball.x + s.ball.dx > CANVAS_WIDTH - BALL_RADIUS || s.ball.x + s.ball.dx < BALL_RADIUS) {
        s.ball.dx = -s.ball.dx;
      }
      if (s.ball.y + s.ball.dy < BALL_RADIUS) {
        s.ball.dy = -s.ball.dy;
      }
      // Paddle Bounds
      else if (
        s.ball.y + s.ball.dy > CANVAS_HEIGHT - PADDLE_HEIGHT - BALL_RADIUS - 32 &&
        s.ball.y < CANVAS_HEIGHT - 32 &&
        s.ball.x > s.paddle.x - BALL_RADIUS &&
        s.ball.x < s.paddle.x + s.paddle.width + BALL_RADIUS
      ) {
        s.ball.dy = -Math.abs(s.ball.dy);
        const hitPoint = s.ball.x - (s.paddle.x + s.paddle.width / 2);
        s.ball.dx = hitPoint * 0.15;
      }
      // Bottom Bounds (Death)
      else if (s.ball.y + s.ball.dy > CANVAS_HEIGHT - BALL_RADIUS) {
        s.lives--;
        if (s.lives <= 0) {
          s.status = 'gameover';
          setUiState({ status: 'gameover', score: s.score, lives: s.lives });
        } else {
          s.paddle.x = CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2;
          s.ball.x = s.paddle.x + PADDLE_WIDTH / 2;
          s.ball.y = CANVAS_HEIGHT - PADDLE_HEIGHT - BALL_RADIUS - 40;
          s.ball.dy = -6;
          s.ball.dx = (Math.random() > 0.5 ? 1 : -1) * 6;
          setUiState({ status: 'playing', score: s.score, lives: s.lives });
        }
      }

      // Brick Collision
      let activeBricks = 0;
      let matchedBrick = false;
      for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
        for (let r = 0; r < BRICK_ROW_COUNT; r++) {
          const b = s.bricks[c][r];
          if (b.status) {
            activeBricks++;
            if (!matchedBrick &&
                s.ball.x + BALL_RADIUS > b.x &&
                s.ball.x - BALL_RADIUS < b.x + BRICK_WIDTH &&
                s.ball.y + BALL_RADIUS > b.y &&
                s.ball.y - BALL_RADIUS < b.y + BRICK_HEIGHT) {
              
              const overlapLeft = (s.ball.x + BALL_RADIUS) - b.x;
              const overlapRight = (b.x + BRICK_WIDTH) - (s.ball.x - BALL_RADIUS);
              const overlapTop = (s.ball.y + BALL_RADIUS) - b.y;
              const overlapBottom = (b.y + BRICK_HEIGHT) - (s.ball.y - BALL_RADIUS);

              const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

              if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                s.ball.dx = -s.ball.dx;
              } else {
                s.ball.dy = -s.ball.dy;
              }

              b.status = false;
              s.score += 10;
              matchedBrick = true;
              
              if (Math.abs(s.ball.dy) < 12) {
                 s.ball.dy *= 1.02;
                 s.ball.dx *= 1.02;
              }

              setUiState({ status: s.status, score: s.score, lives: s.lives });
            }
          }
        }
      }

      if (activeBricks === 0 && s.status === 'playing') {
        s.status = 'won';
        setUiState({ status: 'won', score: s.score, lives: s.lives });
      }
    };

    const gameLoop = () => {
      update();
      draw();
      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.current.right = true;
      if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') keys.current.left = true;
      if (e.key === ' ' && state.current.status !== 'playing') handleStart();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.current.right = false;
      if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') keys.current.left = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current || state.current.status !== 'playing') return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = canvasRef.current.width / rect.width;
      const relativeX = (e.clientX - rect.left) * scaleX;

      if (relativeX > 0 && relativeX < CANVAS_WIDTH) {
        state.current.paddle.x = relativeX - state.current.paddle.width / 2;
        if (state.current.paddle.x < 0) state.current.paddle.x = 0;
        if (state.current.paddle.x + state.current.paddle.width > CANVAS_WIDTH) {
           state.current.paddle.x = CANVAS_WIDTH - state.current.paddle.width;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="w-full max-w-[1024px] mx-auto h-screen flex flex-col p-4 md:p-8 overflow-hidden select-none relative">
      <header className="flex flex-col md:flex-row justify-between items-end mb-6 border-b border-slate-800 pb-4 shrink-0 gap-4">
        <div className="flex flex-col">
          <span className="text-xs font-bold tracking-[0.3em] text-cyan-400 uppercase mb-1">Development Build v1.0.4</span>
          <h1 className="text-4xl font-black italic tracking-tighter bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">BREAKOUT.TS</h1>
        </div>
        <div className="flex gap-6 md:gap-12 items-center">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-slate-500">Current Score</div>
            <div className="text-3xl font-mono font-bold text-yellow-400 leading-none">{uiState.score.toString().padStart(6, '0')}</div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-[10px] uppercase tracking-widest text-slate-500">Lives</div>
            <div className="text-3xl font-mono font-bold text-pink-500 leading-none">{uiState.lives} / 3</div>
          </div>
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i} 
                className={`w-3 h-8 rounded-sm ${i < uiState.lives ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-slate-800'}`}
              ></div>
            ))}
          </div>
        </div>
      </header>

      <main className="flex flex-col lg:flex-row gap-8 grow min-h-0">
        <section className="relative w-full lg:w-[760px] max-h-full aspect-[4/3] bg-black rounded-xl border-2 border-slate-800 shadow-2xl overflow-hidden shrink-0 flex items-center justify-center mx-auto lg:mx-0">
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          
          {uiState.status !== 'playing' && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
              <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
                {uiState.status === 'idle' && (
                  <>
                    <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">READY</h2>
                    <p className="text-slate-400 mb-6 uppercase tracking-widest text-sm">Press Space to Start</p>
                  </>
                )}
                {uiState.status === 'gameover' && (
                  <>
                    <h2 className="text-4xl font-black italic tracking-tighter mb-4 text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]">GAME OVER</h2>
                    <p className="text-slate-400 mb-6 uppercase tracking-widest text-sm">Score: <span className="text-white font-mono">{uiState.score}</span></p>
                  </>
                )}
                {uiState.status === 'won' && (
                  <>
                    <h2 className="text-4xl font-black italic tracking-tighter mb-4 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">VICTORY</h2>
                    <p className="text-slate-400 mb-6 uppercase tracking-widest text-sm">Final Score: <span className="text-white font-mono">{uiState.score}</span></p>
                  </>
                )}
                
                <button 
                  onClick={handleStart} 
                  className="w-full py-3 px-8 bg-pink-600 hover:bg-pink-500 rounded-lg font-bold text-sm transition-colors uppercase tracking-widest shadow-lg shadow-pink-900/20 active:scale-95"
                >
                  {uiState.status === 'idle' ? 'Start Game' : 'Restart Game'}
                </button>
              </div>
            </div>
          )}

          <canvas 
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-full block relative z-10 touch-none object-contain"
          />
        </section>

        <aside className="flex-1 flex flex-row lg:flex-col gap-4 lg:gap-6 lg:min-w-[200px] overflow-y-auto lg:overflow-visible">
          <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800 flex-1 lg:flex-none">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Engine Status</h3>
            <div className="space-y-3 font-mono text-xs sm:text-sm">
              <div className="flex justify-between">
                <span>Status</span>
                <span className={uiState.status === 'playing' ? "text-green-400" : "text-yellow-400"}>
                  {uiState.status === 'playing' ? 'RUNNING' : 'SUSPENDED'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Score</span>
                <span className="text-blue-400">{uiState.score} pts</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Controls</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <kbd className="bg-slate-800 px-2 py-1 rounded text-xs border-b-2 border-slate-700 min-w-[28px] text-center font-mono">A / ←</kbd>
                  <kbd className="bg-slate-800 px-2 py-1 rounded text-xs border-b-2 border-slate-700 min-w-[28px] text-center font-mono">D / →</kbd>
                  <span className="text-xs text-slate-400 uppercase tracking-wider ml-2">Move</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 mt-2">
                  <kbd className="bg-slate-800 px-2 py-1 rounded text-xs border-b-2 border-slate-700 w-full text-center uppercase font-mono max-w-[100px]">Space</kbd>
                  <span className="text-xs text-slate-400 shrink-0 uppercase tracking-wider ml-2">Interact</span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 hidden lg:block">
              <button 
                onClick={handleStart}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold text-sm transition-colors uppercase tracking-widest border border-slate-700 active:scale-95"
              >
                Restart Game
              </button>
            </div>
          </div>
        </aside>
      </main>

      <footer className="mt-auto pt-6 flex justify-between items-center text-[10px] text-slate-600 font-mono shrink-0">
        <div>VIBRANT ENGINE... READY (OK)</div>
        <div>© {new Date().getFullYear()} AI STUDIO CANVAS</div>
      </footer>
    </div>
  );
}
