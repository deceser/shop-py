import { motion, AnimatePresence } from 'framer-motion';
import McqCard from './McqCard';
import TextCard from './TextCard';
import OutputCard from './OutputCard';
import CodeCard from './CodeCard';
import { useGameStore } from '../../game/store';
import { evaluateCard, calcScore } from '../../game/evaluate';
import { saveAttempt, upsertProgress, updateCoins } from '../../supabase/client';
import { useGameStore as _store } from '../../game/store';

const CATEGORY_COLORS = {
  'Теорія': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Що виведе?': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Напиши код': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Вибір відповіді': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
};

function renderPrompt(prompt) {
  const parts = prompt.split(/(\n\n[\s\S]+)/);
  if (parts.length < 2) return <p className="text-slate-300 leading-relaxed">{prompt}</p>;
  return (
    <>
      <p className="text-slate-300 leading-relaxed">{parts[0]}</p>
      <pre className="mt-3 rounded-lg bg-slate-900 border border-white/10 p-3 text-sm font-mono text-green-300 whitespace-pre overflow-x-auto">
        {parts[1].trimStart()}
      </pre>
    </>
  );
}

export default function CheckoutModal({ onDone }) {
  const { activeCard, activeProduct, checkoutStartTime, user, combo } = useGameStore();
  const { markDone, addCoins, incCombo, resetCombo } = useGameStore();

  if (!activeCard) return null;

  const colorCls = CATEGORY_COLORS[activeCard.category] ?? 'bg-slate-500/20 text-slate-300 border-slate-500/30';

  async function handleSubmit(answer) {
    const isCorrect = evaluateCard(activeCard, answer);
    const durationMs = Date.now() - checkoutStartTime;
    const baseScore = calcScore(activeCard, durationMs, 1);
    const comboMult = combo >= 2 ? 1.5 : 1;
    const score = isCorrect ? Math.round(baseScore * comboMult) : 0;

    if (isCorrect) {
      markDone(activeCard.id, score, durationMs);
      addCoins(score);
      incCombo();
    } else {
      resetCombo();
    }

    if (user) {
      const newCoins = _store.getState().coins;
      await Promise.all([
        saveAttempt({
          userId: user.id,
          cardId: activeCard.id,
          answerText: String(answer).slice(0, 500),
          isCorrect,
          score,
          durationMs,
        }),
        isCorrect && upsertProgress({
          userId: user.id,
          cardId: activeCard.id,
          status: 'done',
          score,
          durationMs,
        }),
        isCorrect && updateCoins(user.id, newCoins),
      ]);
    }

    onDone({ isCorrect, score, product: activeProduct, card: activeCard, comboMult });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-lg rounded-2xl bg-slate-800 border border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <span className="text-3xl">{activeProduct?.emoji}</span>
          <div className="flex-1">
            <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${colorCls}`}>
              {activeCard.category}
            </span>
            <h2 className="mt-0.5 font-semibold text-white">{activeCard.title}</h2>
          </div>
          {combo >= 2 && (
            <div className="rounded-lg bg-orange-500/20 border border-orange-500/30 px-2 py-1 text-xs font-bold text-orange-300">
              🔥 ×{combo}
            </div>
          )}
        </div>

        <div className="px-5 py-4">
          <div className="mb-4">{renderPrompt(activeCard.prompt)}</div>

          {activeCard.type === 'mcq' && <McqCard card={activeCard} onSubmit={handleSubmit} />}
          {activeCard.type === 'text' && <TextCard onSubmit={handleSubmit} />}
          {activeCard.type === 'output' && <OutputCard onSubmit={handleSubmit} />}
          {activeCard.type === 'code' && <CodeCard card={activeCard} onSubmit={handleSubmit} />}
        </div>
      </motion.div>
    </motion.div>
  );
}
