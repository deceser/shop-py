import { useState } from 'react';
import { motion } from 'framer-motion';

export default function OutputCard({ onSubmit }) {
  const [value, setValue] = useState('');

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Введи що виведе код..."
        rows={4}
        className="w-full rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none font-mono resize-none"
      />
      <motion.button
        whileTap={{ scale: 0.96 }}
        disabled={!value.trim()}
        onClick={() => onSubmit(value)}
        className="rounded-xl bg-violet-600 py-3 font-semibold text-white disabled:opacity-40 hover:bg-violet-500 transition-colors"
      >
        Відповісти
      </motion.button>
    </div>
  );
}
