import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../supabase/client';

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('anon');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  // loading/error used only for email mode

  function handleAnon() {
    onLogin({ id: 'local-' + Date.now() }, username || 'Гравець');
  }

  async function handleMagic() {
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const { error: e } = await supabase.auth.signInWithOtp({ email });
      if (e) throw e;
      setSent(true);
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
          <p className="text-sm text-slate-400 mt-1">Навчись Python, купуючи продукти</p>
        </div>

        <div className="mb-4 flex rounded-xl bg-slate-700/50 p-1">
          {['anon', 'email'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors
                ${mode === m ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {m === 'anon' ? 'Швидкий старт' : 'Email'}
            </button>
          ))}
        </div>

        {mode === 'anon' && (
          <div className="flex flex-col gap-3">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Твоє ім'я (необов'язково)"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
            />
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleAnon}
          className="rounded-xl bg-violet-600 py-3 font-semibold text-white hover:bg-violet-500 transition-colors"
        >
          Грати
        </motion.button>
          </div>
        )}

        {mode === 'email' && !sent && (
          <div className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleMagic}
              disabled={loading || !email}
              className="rounded-xl bg-violet-600 py-3 font-semibold text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Надсилаю...' : 'Надіслати магічне посилання'}
            </motion.button>
          </div>
        )}

        {sent && (
          <div className="rounded-xl bg-green-900/40 border border-green-700/50 p-4 text-center text-green-300 text-sm">
            Перевір пошту! Натисни на посилання, щоб увійти.
          </div>
        )}

        {error && (
          <p className="mt-3 text-center text-sm text-red-400">{error}</p>
        )}
      </motion.div>
    </div>
  );
}
