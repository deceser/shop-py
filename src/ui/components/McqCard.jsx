import { useState } from 'react';
import { motion } from 'framer-motion';

export default function McqCard({ card, onSubmit }) {
  const [selected, setSelected] = useState(null);

  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="flex flex-col gap-3">
      {card.options.map((opt, i) => (
        <motion.button
          key={i}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setSelected(i)}
          className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors
            ${selected === i
              ? 'border-violet-500 bg-violet-500/20 text-white'
              : 'border-white/10 bg-white/5 text-slate-300 hover:border-violet-400/50'
            }`}
        >
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold
            ${selected === i ? 'bg-violet-500 text-white' : 'bg-white/10 text-slate-400'}`}>
            {letters[i]}
          </span>
          {opt}
        </motion.button>
      ))}

      <motion.button
        whileTap={{ scale: 0.96 }}
        disabled={selected === null}
        onClick={() => onSubmit(String(selected))}
        className="mt-2 rounded-xl bg-violet-600 py-3 font-semibold text-white disabled:opacity-40 hover:bg-violet-500 transition-colors"
      >
        Відповісти
      </motion.button>
    </div>
  );
}
