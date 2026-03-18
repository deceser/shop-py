import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SNIPPETS } from '../../data/snippets';

const PROGRESS_KEY = 'iw_progress';

function loadIndex() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY))?.index ?? 0;
  } catch {
    return 0;
  }
}

function saveIndex(index) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({ index }));
}

export default function TypingScreen({ student }) {
  const [snippetIndex, setSnippetIndex] = useState(loadIndex);
  const [typed, setTyped] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [errorFlash, setErrorFlash] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const wrapRef = useRef(null);
  const tickRef = useRef(null);
  const flashRef = useRef(null);
  const lastKeyRef = useRef(0);

  const isAllDone = snippetIndex >= SNIPPETS.length;
  const snippet = !isAllDone ? SNIPPETS[snippetIndex] : null;
  const text = snippet?.code ?? '';
  const finished = !isAllDone && typed.length >= text.length;

  useEffect(() => {
    if (startTime && !endTime) {
      tickRef.current = setInterval(() => setNow(Date.now()), 100);
    } else {
      clearInterval(tickRef.current);
    }
    return () => clearInterval(tickRef.current);
  }, [startTime, endTime]);

  useEffect(() => {
    if (finished && startTime && !endTime) setEndTime(Date.now());
  }, [finished, startTime, endTime]);

  useEffect(() => {
    wrapRef.current?.focus();
  }, [snippetIndex]);

  const elapsed = startTime ? ((endTime || now) - startTime) / 1000 : 0;
  const totalKeystrokes = typed.length + mistakes;
  const accuracy = totalKeystrokes > 0 ? Math.round((typed.length / totalKeystrokes) * 100) : 100;
  const wpm = startTime && elapsed > 0 ? Math.round((typed.length / 5) / (elapsed / 60)) : 0;
  const elapsedDisplay = elapsed.toFixed(1) + 's';

  function handleKeyDown(e) {
    if (!e.isTrusted) return;
    const t = Date.now();
    if (lastKeyRef.current && t - lastKeyRef.current < 30) return;
    if (finished || isAllDone) return;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() !== 'backspace') {
      e.preventDefault();
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      lastKeyRef.current = t;
      setTyped((prev) => prev.slice(0, -1));
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const pos = typed.length;
      let count = 0;
      while (pos + count < text.length && text[pos + count] === ' ') count++;
      if (count === 0) return;
      lastKeyRef.current = t;
      if (!startTime) setStartTime(Date.now());
      setTyped((prev) => [...prev, ...Array(count).fill(' ')]);
      return;
    }

    let char;
    if (e.key === 'Enter') char = '\n';
    else if (e.key.length === 1) char = e.key;
    else return;

    e.preventDefault();

    const expected = text[typed.length];
    if (char !== expected) {
      lastKeyRef.current = t;
      setMistakes((m) => m + 1);
      clearTimeout(flashRef.current);
      setErrorFlash(true);
      flashRef.current = setTimeout(() => setErrorFlash(false), 180);
      return;
    }

    lastKeyRef.current = t;
    if (!startTime) setStartTime(Date.now());
    setTyped((prev) => [...prev, char]);
  }

  function handleNext() {
    const next = snippetIndex + 1;
    saveIndex(next);
    lastKeyRef.current = 0;
    setSnippetIndex(next);
    setTyped([]);
    setStartTime(null);
    setEndTime(null);
    setNow(Date.now());
    setMistakes(0);
    setErrorFlash(false);
    clearInterval(tickRef.current);
    clearTimeout(flashRef.current);
    setTimeout(() => wrapRef.current?.focus(), 50);
  }

  function handleRetry() {
    lastKeyRef.current = 0;
    setTyped([]);
    setStartTime(null);
    setEndTime(null);
    setNow(Date.now());
    setMistakes(0);
    setErrorFlash(false);
    clearInterval(tickRef.current);
    clearTimeout(flashRef.current);
    setTimeout(() => wrapRef.current?.focus(), 50);
  }

  function handleRestart() {
    saveIndex(0);
    lastKeyRef.current = 0;
    setSnippetIndex(0);
    setTyped([]);
    setStartTime(null);
    setEndTime(null);
    setNow(Date.now());
    setMistakes(0);
    setErrorFlash(false);
    clearInterval(tickRef.current);
    clearTimeout(flashRef.current);
    setTimeout(() => wrapRef.current?.focus(), 50);
  }

  useEffect(() => {
    if (!finished || !startTime || !student) return;
    if (wpm > 300) {
      handleRetry();
      return;
    }
    const key = 'iw_results';
    const all = JSON.parse(localStorage.getItem(key) || '[]');
    all.push({
      name: `${student.firstName} ${student.lastName}`,
      wpm,
      accuracy,
      snippet: snippet.title,
      time: elapsedDisplay,
      date: new Date().toISOString().slice(0, 10),
    });
    localStorage.setItem(key, JSON.stringify(all));
  }, [finished]);

  if (isAllDone) {
    return (
      <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-2xl border border-white/10 bg-slate-800 p-10 w-full max-w-sm text-center shadow-2xl"
        >
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-3xl font-bold text-white mb-2">Всі завдання виконано!</h2>
          <p className="text-slate-400 mb-8">
            {student.firstName}, ти пройшов{student.gender === 'female' ? 'ла' : ''} всі 20 завдань
          </p>
          <button
            onClick={handleRestart}
            className="rounded-xl bg-violet-600 py-3 w-full font-semibold text-white hover:bg-violet-500 transition-colors"
          >
            Почати спочатку
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800 p-4 flex flex-col items-center focus:outline-none select-none"
    >
      <div className="w-full max-w-3xl mt-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span>{student.gender === 'female' ? '👧' : '👦'}</span>
            <span>
              {student.firstName} {student.lastName}
            </span>
          </div>
          <span className="text-sm text-slate-500">
            {snippetIndex + 1} / {SNIPPETS.length}
          </span>
        </div>

        {/* Overall progress bar */}
        <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden mb-8">
          <motion.div
            className="h-full rounded-full bg-violet-500"
            animate={{ width: `${((snippetIndex) / SNIPPETS.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'WPM', value: wpm, color: 'text-violet-400' },
            { label: 'Точність', value: `${accuracy}%`, color: 'text-green-400' },
            { label: 'Час', value: elapsedDisplay, color: 'text-blue-400' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl border border-white/10 bg-slate-800 p-4 text-center"
            >
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-slate-400 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Snippet title */}
        <p className="text-sm text-slate-400 mb-3">{snippet.title}</p>

        {/* Code display */}
        <div
          className="rounded-2xl border border-white/10 bg-slate-900 p-6 cursor-text max-h-72 overflow-y-auto"
          onClick={() => wrapRef.current?.focus()}
        >
          <pre className="text-base font-mono leading-relaxed whitespace-pre">
            {text.split('').map((char, i) => {
              const isTyped = i < typed.length;
              const isCurrent = i === typed.length;
              const isCorrect = isTyped && typed[i] === char;

              return (
                <span
                  key={i}
                  className={[
                    isCurrent ? 'typing-cursor' : '',
                    isCurrent && errorFlash ? 'typing-error' : '',
                    isCorrect ? 'text-green-400' : '',
                    !isTyped && !isCurrent ? 'text-slate-500' : '',
                    isCurrent && !errorFlash ? 'text-white' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {char === '\n' ? '↵\n' : char}
                </span>
              );
            })}
          </pre>
        </div>

        {/* Current snippet progress bar */}
        <div className="mt-3 h-1 rounded-full bg-slate-700 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-green-500"
            animate={{ width: `${(typed.length / text.length) * 100}%` }}
            transition={{ duration: 0.05 }}
          />
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          Клацніть на поле та починайте друкувати
        </p>
      </div>

      {/* Results overlay */}
      <AnimatePresence>
        {finished && endTime && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-slate-800 p-8 w-full max-w-sm text-center shadow-2xl"
            >
              <div className="text-5xl mb-2">
                {accuracy === 100 ? '🏆' : accuracy >= 90 ? '🎉' : '💪'}
              </div>
              <p className="text-slate-400 text-sm mb-5">{snippet.title}</p>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div>
                  <div className="text-3xl font-bold text-violet-400">{wpm}</div>
                  <div className="text-xs text-slate-400 mt-1">WPM</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-400">{accuracy}%</div>
                  <div className="text-xs text-slate-400 mt-1">Точність</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-400">{elapsedDisplay}</div>
                  <div className="text-xs text-slate-400 mt-1">Час</div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {snippetIndex + 1 < SNIPPETS.length ? (
                  <button
                    onClick={handleNext}
                    className="rounded-xl bg-violet-600 py-3 font-semibold text-white hover:bg-violet-500 transition-colors"
                  >
                    Далі → ({snippetIndex + 2} / {SNIPPETS.length})
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="rounded-xl bg-green-600 py-3 font-semibold text-white hover:bg-green-500 transition-colors"
                  >
                    Завершити 🏆
                  </button>
                )}
                <button
                  onClick={handleRetry}
                  className="rounded-xl border border-white/10 py-2.5 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                >
                  Повторити
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
