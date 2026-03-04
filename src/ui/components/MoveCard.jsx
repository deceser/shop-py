import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { runMoveCode } from '../../game/pyodide';

const CELL = 38;

function drawGrid(ctx, card, pos) {
  const { cols, rows } = card.grid;
  const walls = card.walls ?? [];

  ctx.clearRect(0, 0, cols * CELL, rows * CELL);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const isWall = walls.some((w) => w.x === x && w.y === y);
      const isGoal = card.goal.x === x && card.goal.y === y;
      const isStart = card.start.x === x && card.start.y === y;

      ctx.fillStyle = isWall ? '#1e293b' : '#0f172a';
      ctx.fillRect(x * CELL, y * CELL, CELL, CELL);

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(x * CELL, y * CELL, CELL, CELL);

      if (isWall) {
        ctx.fillStyle = '#475569';
        ctx.fillRect(x * CELL + 3, y * CELL + 3, CELL - 6, CELL - 6);
      }

      if (isGoal) {
        ctx.fillStyle = '#15803d';
        ctx.fillRect(x * CELL + 3, y * CELL + 3, CELL - 6, CELL - 6);
        ctx.font = `${Math.round(CELL * 0.55)}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏁', x * CELL + CELL / 2, y * CELL + CELL / 2);
      }

      if (isStart && !(pos.x === x && pos.y === y)) {
        ctx.fillStyle = 'rgba(124,58,237,0.15)';
        ctx.fillRect(x * CELL + 3, y * CELL + 3, CELL - 6, CELL - 6);
      }
    }
  }

  ctx.font = `${Math.round(CELL * 0.55)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🤖', pos.x * CELL + CELL / 2, pos.y * CELL + CELL / 2);
}

export default function MoveCard({ card, onSubmit }) {
  const canvasRef = useRef(null);
  const [code, setCode] = useState(card.starterCode ?? '');
  const [hint, setHint] = useState(false);
  const [running, setRunning] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [error, setError] = useState(null);
  const [missed, setMissed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawGrid(canvas.getContext('2d'), card, card.start);
  }, [card]);

  async function handleRun() {
    setRunning(true);
    setError(null);
    setMissed(false);

    const res = await runMoveCode(code, card.maxSteps ?? 50);
    setRunning(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    animate(res.actions);
  }

  function handleReset() {
    setMissed(false);
    setError(null);
    const canvas = canvasRef.current;
    if (canvas) drawGrid(canvas.getContext('2d'), card, card.start);
  }

  function animate(actions) {
    setAnimating(true);
    const { cols, rows } = card.grid;
    const walls = card.walls ?? [];
    let pos = { ...card.start };
    let i = 0;

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    drawGrid(ctx, card, pos);

    function step() {
      if (i >= actions.length) {
        setAnimating(false);
        const reached = pos.x === card.goal.x && pos.y === card.goal.y;
        if (reached) {
          onSubmit('reached');
        } else {
          setMissed(true);
        }
        return;
      }

      const action = actions[i];
      const next = { ...pos };
      if (action === 'R') next.x += 1;
      if (action === 'L') next.x -= 1;
      if (action === 'U') next.y -= 1;
      if (action === 'D') next.y += 1;

      const inBounds = next.x >= 0 && next.x < cols && next.y >= 0 && next.y < rows;
      const blocked = walls.some((w) => w.x === next.x && w.y === next.y);
      if (inBounds && !blocked) pos = next;

      drawGrid(ctx, card, pos);
      i++;
      setTimeout(step, 350);
    }

    step();
  }

  const busy = running || animating;

  return (
    <div className="flex flex-col gap-3">
      <canvas
        ref={canvasRef}
        width={card.grid.cols * CELL}
        height={card.grid.rows * CELL}
        className="rounded-lg border border-white/10 mx-auto block"
      />

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        rows={5}
        className="w-full rounded-xl border-2 border-white/10 bg-slate-900 p-3 font-mono text-sm text-green-300 placeholder:text-slate-600 focus:border-violet-500 focus:outline-none resize-none"
      />

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg bg-red-900/40 border border-red-700/50 px-3 py-2 text-xs font-mono text-red-300"
          >
            {error}
          </motion.div>
        )}
        {missed && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg bg-orange-900/40 border border-orange-700/50 px-3 py-2 text-sm text-orange-300 text-center"
          >
            Не дійшов до цілі — спробуй ще раз
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2">
        <button
          onClick={() => setHint((h) => !h)}
          className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-400 hover:border-violet-400/50 transition-colors"
        >
          {hint ? 'Сховати' : '💡 Підказка'}
        </button>

        {missed ? (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleReset}
            className="flex-1 rounded-xl border border-violet-500/50 py-2 font-semibold text-violet-300 hover:bg-violet-500/10 transition-colors"
          >
            Спробувати знову
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={!code.trim() || busy}
            onClick={handleRun}
            className="flex-1 rounded-xl bg-violet-600 py-2 font-semibold text-white disabled:opacity-40 hover:bg-violet-500 transition-colors"
          >
            {running ? 'Запускаю...' : animating ? 'Анімація...' : '▶ Запустити'}
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {hint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-lg bg-slate-800 border border-white/10 p-3 font-mono text-sm text-yellow-300"
          >
            {card.hint}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
