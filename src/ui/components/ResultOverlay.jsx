import { motion } from 'framer-motion';
import { useGameStore } from '../../game/store';

export default function ResultOverlay({ result, onContinue }) {
  const { coins } = useGameStore();

  if (!result) return null;

  const { isCorrect, score, product, comboMult } = result;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.7 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`rounded-2xl border p-8 text-center shadow-2xl max-w-sm w-full mx-4
          ${isCorrect
            ? 'bg-green-900/80 border-green-500/50'
            : 'bg-red-900/80 border-red-500/50'
          }`}
      >
        <div className="text-6xl mb-3">{isCorrect ? '✅' : '❌'}</div>
        <div className="text-4xl mb-2">{product?.emoji}</div>
        <h2 className="text-xl font-bold text-white mb-1">
          {isCorrect ? 'Правильно!' : 'Не вірно'}
        </h2>
        <p className="text-slate-300 text-sm mb-4">
          {isCorrect
            ? `${product?.name} відсканований`
            : 'Спробуй ще раз наступного разу'}
        </p>

        {isCorrect && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl font-bold text-yellow-300">+{score} 🪙</span>
            {comboMult > 1 && (
              <span className="rounded-full bg-orange-500/20 border border-orange-500/40 px-2 py-0.5 text-xs text-orange-300 font-bold">
                ×{comboMult} комбо!
              </span>
            )}
          </div>
        )}

        <div className="mb-5 text-sm text-slate-400">
          Всього монет: <span className="text-yellow-300 font-semibold">{coins} 🪙</span>
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onContinue}
          className={`w-full rounded-xl py-3 font-semibold text-white
            ${isCorrect ? 'bg-green-600 hover:bg-green-500' : 'bg-slate-600 hover:bg-slate-500'}
            transition-colors`}
        >
          Продовжити
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
