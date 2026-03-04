import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { runDungeonCode } from '../../game/pyodide';
import { DUNGEON_LEVELS } from '../../data/dungeonLevels';
import { useGameStore } from '../../game/store';

const CELL = 44;
const ANIM_DELAY = 280;

const CONCEPT_COLORS = {
  variables: '#0284c7',
  for: '#0891b2',
  list: '#1d4ed8',
  dict: '#7c3aed',
  if_else: '#b45309',
  while: '#9333ea',
  collect: '#15803d',
  nested_loops: '#0e7490',
  dict_list: '#be185d',
  all: '#dc2626',
};

function drawDungeon(ctx, level, playerPos, remainingKeys) {
  const { cols, rows } = level.grid;
  ctx.clearRect(0, 0, cols * CELL, rows * CELL);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const isWall = (level.walls ?? []).some((w) => w.x === x && w.y === y);
      const isGoal = level.goal.x === x && level.goal.y === y;
      const isKey = remainingKeys.some((k) => k.x === x && k.y === y);

      ctx.fillStyle = isWall ? '#1e293b' : '#0f172a';
      ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 1;
      ctx.strokeRect(x * CELL, y * CELL, CELL, CELL);

      if (isWall) {
        ctx.fillStyle = '#334155';
        ctx.fillRect(x * CELL + 2, y * CELL + 2, CELL - 4, CELL - 4);
        ctx.fillStyle = '#475569';
        ctx.fillRect(x * CELL + 4, y * CELL + 4, CELL - 8, CELL - 8);
      }

      const fontSize = Math.round(CELL * 0.55);
      ctx.font = `${fontSize}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const cx = x * CELL + CELL / 2;
      const cy = y * CELL + CELL / 2;

      if (isGoal) {
        ctx.fillStyle = remainingKeys.length === 0 ? '#15803d' : '#374151';
        ctx.fillRect(x * CELL + 2, y * CELL + 2, CELL - 4, CELL - 4);
        ctx.fillText(remainingKeys.length === 0 ? '🏁' : '🔒', cx, cy);
      }

      if (isKey) ctx.fillText('🔑', cx, cy);
    }
  }

  const pcx = playerPos.x * CELL + CELL / 2;
  const pcy = playerPos.y * CELL + CELL / 2;
  ctx.font = `${Math.round(CELL * 0.6)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🤖', pcx, pcy);
}

function LevelBadge({ level }) {
  const color = CONCEPT_COLORS[level.concept] ?? '#475569';
  return (
    <span style={{
      background: `${color}30`, border: `1px solid ${color}60`,
      color, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600,
    }}>
      {level.conceptLabel}
    </span>
  );
}

function LevelSelect({ levels, current, completedIds, onSelect, onBack }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#0f172a', display: 'flex',
      flexDirection: 'column', alignItems: 'center', padding: '32px 16px',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '6px 12px', color: '#94a3b8', cursor: 'pointer', fontSize: 13,
            }}
          >
            ← Магазин
          </button>
          <h1 style={{ color: '#e2e8f0', fontSize: 22, fontWeight: 700, margin: 0 }}>
            🗺 Python Dungeon
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {levels.map((lvl) => {
            const done = completedIds.includes(lvl.id);
            const isCurrent = lvl.id === current;
            const locked = lvl.id > 1 && !completedIds.includes(lvl.id - 1);
            return (
              <motion.button
                key={lvl.id}
                whileHover={!locked ? { scale: 1.02 } : {}}
                whileTap={!locked ? { scale: 0.98 } : {}}
                onClick={() => !locked && onSelect(lvl.id)}
                style={{
                  background: isCurrent ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isCurrent ? '#7c3aed' : done ? '#15803d40' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 12, padding: '14px 16px', textAlign: 'left',
                  cursor: locked ? 'not-allowed' : 'pointer',
                  opacity: locked ? 0.4 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>Рівень {lvl.id}</span>
                  <span style={{ fontSize: 14 }}>{done ? '✅' : locked ? '🔒' : '▶'}</span>
                </div>
                <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{lvl.title}</div>
                <LevelBadge level={lvl} />
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function DungeonScreen() {
  const { setScreen } = useGameStore();
  const [view, setView] = useState('select');
  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [completedIds, setCompletedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dungeon_completed') ?? '[]'); } catch { return []; }
  });

  const level = DUNGEON_LEVELS.find((l) => l.id === currentLevelId);

  function handleSelectLevel(id) {
    setCurrentLevelId(id);
    setView('play');
  }

  function handleLevelComplete() {
    const next = [...new Set([...completedIds, currentLevelId])];
    setCompletedIds(next);
    localStorage.setItem('dungeon_completed', JSON.stringify(next));
    setView('select');
  }

  if (view === 'select') {
    return (
      <LevelSelect
        levels={DUNGEON_LEVELS}
        current={currentLevelId}
        completedIds={completedIds}
        onSelect={handleSelectLevel}
        onBack={() => setScreen('shop')}
      />
    );
  }

  return (
    <DungeonLevel
      key={currentLevelId}
      level={level}
      onComplete={handleLevelComplete}
      onBack={() => setView('select')}
    />
  );
}

function DungeonLevel({ level, onComplete, onBack }) {
  const canvasRef = useRef(null);
  const [code, setCode] = useState(level.starterCode ?? '');
  const [hint, setHint] = useState(false);
  const [running, setRunning] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [remainingKeys, setRemainingKeys] = useState(level.keys ?? []);

  const redraw = useCallback((pos, keys) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawDungeon(canvas.getContext('2d'), level, pos, keys);
  }, [level]);

  useEffect(() => {
    setRemainingKeys(level.keys ?? []);
    redraw(level.start, level.keys ?? []);
  }, [level, redraw]);

  async function handleRun() {
    setRunning(true);
    setError(null);
    setStatus(null);

    const res = await runDungeonCode(code, {
      playerPos: level.start,
      keys: level.keys ?? [],
      walls: level.walls ?? [],
      gridCols: level.grid.cols,
      gridRows: level.grid.rows,
    }, level.maxSteps);

    setRunning(false);

    if (!res.ok) { setError(res.error); return; }

    animate(res.actions, res.collected, res.finalPos);
  }

  function animate(actions, collectedList, finalPos) {
    setAnimating(true);
    let pos = { ...level.start };
    let keys = [...(level.keys ?? [])];
    let i = 0;

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    redraw(pos, keys);

    function step() {
      if (i >= actions.length) {
        setAnimating(false);
        const reached = finalPos.x === level.goal.x && finalPos.y === level.goal.y;
        const keysLeft = (level.keys ?? []).length - collectedList.length;
        if (reached && keysLeft === 0) {
          setStatus('win');
        } else if (reached && keysLeft > 0) {
          setStatus('need_key');
        } else {
          setStatus('miss');
        }
        return;
      }

      const action = actions[i];
      if (action === 'R') pos = { ...pos, x: pos.x + 1 };
      else if (action === 'L') pos = { ...pos, x: pos.x - 1 };
      else if (action === 'U') pos = { ...pos, y: pos.y - 1 };
      else if (action === 'D') pos = { ...pos, y: pos.y + 1 };
      else if (action === 'C') {
        keys = keys.filter((k) => !(k.x === pos.x && k.y === pos.y));
        setRemainingKeys([...keys]);
      }

      redraw(pos, keys);
      i++;
      setTimeout(step, ANIM_DELAY);
    }

    step();
  }

  function handleReset() {
    setStatus(null);
    setError(null);
    setRemainingKeys(level.keys ?? []);
    redraw(level.start, level.keys ?? []);
  }

  const busy = running || animating;
  const color = CONCEPT_COLORS[level.concept] ?? '#475569';

  return (
    <div style={{
      minHeight: '100vh', background: '#0f172a', display: 'flex',
      flexDirection: 'column', alignItems: 'center', padding: '20px 16px',
      fontFamily: 'system-ui, sans-serif', overflowY: 'auto',
    }}>
      <div style={{ width: '100%', maxWidth: 700 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '5px 10px', color: '#94a3b8', cursor: 'pointer', fontSize: 13,
            }}
          >
            ← Рівні
          </button>
          <div>
            <div style={{ color: '#94a3b8', fontSize: 12 }}>Рівень {level.id} / 10</div>
            <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 16 }}>{level.title}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}><LevelBadge level={level} /></div>
        </div>

        {/* Description */}
        <div style={{
          background: `${color}15`, border: `1px solid ${color}40`,
          borderRadius: 10, padding: '10px 14px', marginBottom: 14,
          color: '#cbd5e1', fontSize: 14, lineHeight: 1.5,
        }}>
          {level.description}
          {(level.keys ?? []).length > 0 && (
            <span style={{ marginLeft: 8, color: '#fbbf24' }}>
              🔑 × {remainingKeys.length} залишилось
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {/* Canvas */}
          <div style={{ flexShrink: 0 }}>
            <canvas
              ref={canvasRef}
              width={level.grid.cols * CELL}
              height={level.grid.rows * CELL}
              style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', display: 'block' }}
            />
          </div>

          {/* Editor */}
          <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <textarea
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(null); setStatus(null); }}
              spellCheck={false}
              rows={10}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#020817', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '10px 12px',
                color: '#86efac', fontFamily: 'monospace', fontSize: 13,
                resize: 'vertical', outline: 'none', lineHeight: 1.6,
              }}
            />

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{
                    background: '#7f1d1d40', border: '1px solid #b91c1c60',
                    borderRadius: 8, padding: '8px 12px',
                    color: '#fca5a5', fontFamily: 'monospace', fontSize: 12,
                  }}
                >
                  {error}
                </motion.div>
              )}
              {status === 'miss' && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{
                    background: '#78350f40', border: '1px solid #d9770660',
                    borderRadius: 8, padding: '8px 12px', color: '#fcd34d', fontSize: 13, textAlign: 'center',
                  }}
                >
                  Робот не дійшов до мети — спробуй ще раз
                </motion.div>
              )}
              {status === 'need_key' && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{
                    background: '#78350f40', border: '1px solid #d9770660',
                    borderRadius: 8, padding: '8px 12px', color: '#fcd34d', fontSize: 13, textAlign: 'center',
                  }}
                >
                  🔒 Не всі ключі зібрані! Використай collect()
                </motion.div>
              )}
              {status === 'win' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  style={{
                    background: '#14532d40', border: '1px solid #16a34a60',
                    borderRadius: 8, padding: '12px 16px', color: '#86efac', fontSize: 14,
                    textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8,
                  }}
                >
                  <div style={{ fontSize: 24 }}>🎉</div>
                  <div style={{ fontWeight: 700 }}>Рівень пройдено!</div>
                  <button
                    onClick={onComplete}
                    style={{
                      background: '#16a34a', border: 'none', borderRadius: 8,
                      padding: '8px 0', color: '#fff', fontWeight: 600,
                      cursor: 'pointer', fontSize: 14,
                    }}
                  >
                    Далі →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setHint((h) => !h)}
                style={{
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, padding: '8px 12px', color: '#94a3b8', cursor: 'pointer', fontSize: 13,
                }}
              >
                {hint ? 'Сховати' : '💡 Підказка'}
              </button>

              {(status === 'miss' || status === 'need_key') ? (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleReset}
                  style={{
                    flex: 1, background: 'transparent',
                    border: `1px solid ${color}80`, borderRadius: 8,
                    padding: '8px 0', color, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                  }}
                >
                  Спробувати знову
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  disabled={!code.trim() || busy || status === 'win'}
                  onClick={handleRun}
                  style={{
                    flex: 1,
                    background: busy ? 'rgba(124,58,237,0.3)' : `linear-gradient(135deg, ${color}, #6366f1)`,
                    border: 'none', borderRadius: 8,
                    padding: '8px 0', color: '#fff', cursor: busy ? 'wait' : 'pointer',
                    fontWeight: 600, fontSize: 13, opacity: (!code.trim() || status === 'win') ? 0.4 : 1,
                  }}
                >
                  {running ? 'Запускаю...' : animating ? 'Анімація...' : '▶ Запустити'}
                </motion.button>
              )}
            </div>

            <AnimatePresence>
              {hint && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{
                    overflow: 'hidden', background: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8, padding: '10px 12px',
                    color: '#fde68a', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.5,
                  }}
                >
                  💡 {level.hint}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
