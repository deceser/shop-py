import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { STUDENTS } from '../../data/students';
import { loginStudent } from '../../supabase/client';
import TypingScreen from './TypingScreen';

const SESSION_KEY = 'iw_session';

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export default function HomeScreen({ onLogin }) {
  const saved = loadSession();

  const [started, setStarted] = useState(!!saved);
  const [selected, setSelected] = useState(
    saved ? { firstName: saved.firstName, lastName: saved.lastName, gender: saved.gender } : null,
  );
  const [query, setQuery] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (started && selected) {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          firstName: selected.firstName,
          lastName: selected.lastName,
          gender: selected.gender,
        }),
      );
    }
  }, [started, selected]);

  const filtered =
    query.length >= 1
      ? STUDENTS.filter((s) =>
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(query.toLowerCase()),
        )
      : STUDENTS;

  function handleStart() {
    if (!selected) return;
    setStarted(true);
  }

  function handleBack() {
    localStorage.removeItem(SESSION_KEY);
    setStarted(false);
    setSelected(null);
    setQuery('');
  }

  async function handleGameLogin() {
    if (!selected) return;
    setLoginLoading(true);
    setLoginError('');
    try {
      const u = await loginStudent(selected.firstName, selected.lastName, selected.gender);
      onLogin(u);
    } catch (e) {
      setLoginError(e.message);
    } finally {
      setLoginLoading(false);
    }
  }

  if (started && selected) {
    return <TypingScreen student={selected} />;
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800 p-4 flex flex-col items-center">
      <div className="w-full max-w-sm mt-16">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐍</div>
          <h1 className="text-3xl font-bold text-white">Python Тренажер</h1>
          <p className="text-slate-400 mt-2">Оберіть своє ім&apos;я, щоб розпочати</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-slate-800 p-6 flex flex-col gap-3"
        >
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            placeholder="Пошук за ім'ям..."
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none text-sm"
          />

          <div className="max-h-72 overflow-y-auto flex flex-col gap-1 rounded-xl border border-white/10 bg-white/5 p-2">
            {filtered.map((s) => {
              const isSel =
                selected?.firstName === s.firstName && selected?.lastName === s.lastName;
              return (
                <button
                  key={`${s.firstName}-${s.lastName}`}
                  onClick={() => setSelected(s)}
                  className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors
                    ${isSel ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}
                >
                  {s.gender === 'female' ? '👧' : '👦'} {s.firstName} {s.lastName}
                </button>
              );
            })}
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleStart}
            disabled={!selected}
            className="rounded-xl bg-violet-600 py-3 font-semibold text-white hover:bg-violet-500 disabled:opacity-40 transition-colors"
          >
            Грати →
          </motion.button>

          <button
            onClick={handleGameLogin}
            disabled={!selected || loginLoading}
            className="rounded-xl border border-white/10 py-2.5 text-sm text-slate-400 hover:bg-white/5 disabled:opacity-40 transition-colors"
          >
            {loginLoading ? 'Завантаження...' : 'Увійти до гри'}
          </button>

          {loginError && <p className="text-center text-sm text-red-400">{loginError}</p>}
        </motion.div>
      </div>
    </div>
  );
}
