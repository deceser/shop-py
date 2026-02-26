import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { runPyTest } from '../../game/pyodide';

export default function CodeCard({ card, onSubmit }) {
  const [value, setValue] = useState('');
  const [hint, setHint] = useState(false);
  const [running, setRunning] = useState(false);
  const [pyResult, setPyResult] = useState(null);

  async function handleSubmit() {
    if (card.pyTest) {
      setRunning(true);
      setPyResult(null);
      const res = await runPyTest(value, card.pyTest);
      setRunning(false);
      if (!res.ok) {
        setPyResult({ ok: false, error: res.error });
        return;
      }
    }
    onSubmit(value);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          spellCheck={false}
          rows={6}
          placeholder="# Напиши код тут..."
          className="w-full rounded-xl border-2 border-white/10 bg-slate-900 p-3 font-mono text-sm text-green-300 placeholder:text-slate-600 focus:border-violet-500 focus:outline-none resize-none"
        />
        <span className="absolute top-2 right-3 text-xs text-slate-600 select-none">Python</span>
      </div>

      <AnimatePresence>
        {pyResult && !pyResult.ok && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg bg-red-900/40 border border-red-700/50 px-3 py-2 text-xs font-mono text-red-300"
          >
            {pyResult.error}
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
        <motion.button
          whileTap={{ scale: 0.96 }}
          disabled={!value.trim() || running}
          onClick={handleSubmit}
          className="flex-1 rounded-xl bg-violet-600 py-2 font-semibold text-white disabled:opacity-40 hover:bg-violet-500 transition-colors"
        >
          {running ? 'Перевіряю...' : 'Запустити'}
        </motion.button>
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
