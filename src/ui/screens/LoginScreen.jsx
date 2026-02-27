import { useState } from 'react';
import { motion } from 'framer-motion';
import { STUDENTS } from '../../data/students';
import { loginStudent } from '../../supabase/client';

export default function LoginScreen({ onLogin }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filtered = query.length >= 1
    ? STUDENTS.filter((s) =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(query.toLowerCase()),
      )
    : STUDENTS;

  async function handleLogin() {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      const u = await loginStudent(selected.firstName, selected.lastName, selected.gender);
      onLogin(u);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-800 p-8 shadow-2xl"
      >
        <div className="mb-6 text-center">
          <div className="text-5xl mb-3">🛒</div>
          <h1 className="text-2xl font-bold text-white">Python Market</h1>
          <p className="text-sm text-slate-400 mt-1">Оберіть своє ім&apos;я зі списку</p>
        </div>

        <div className="flex flex-col gap-3">
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
            placeholder="Пошук за ім'ям..."
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
          />

          <div className="max-h-52 overflow-y-auto flex flex-col gap-1 rounded-xl border border-white/10 bg-white/5 p-2">
            {filtered.map((s) => {
              const isSelected =
                selected?.firstName === s.firstName && selected?.lastName === s.lastName;
              return (
                <button
                  key={`${s.firstName}-${s.lastName}`}
                  onClick={() => setSelected(s)}
                  className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors
                    ${isSelected ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}
                >
                  {s.gender === 'female' ? '👧' : '👦'} {s.firstName} {s.lastName}
                </button>
              );
            })}
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleLogin}
            disabled={!selected || loading}
            className="rounded-xl bg-violet-600 py-3 font-semibold text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Завантаження...' : 'Грати'}
          </motion.button>
        </div>

        {error && <p className="mt-3 text-center text-sm text-red-400">{error}</p>}
      </motion.div>
    </div>
  );
}
