import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import McqCard from '../components/McqCard';
import TextCard from '../components/TextCard';
import OutputCard from '../components/OutputCard';
import CodeCard from '../components/CodeCard';
import { useGameStore } from '../../game/store';
import { cards, getMaterial } from '../../data/cards';
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

export default function TrainerScreen() {
  const { user, progress, setScreen, markDone, addCoins } = useGameStore();
  const [cardIndex, setCardIndex] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [materialModal, setMaterialModal] = useState(null);

  const card = cards[cardIndex];
  const isLast = cardIndex >= cards.length - 1;
  const doneCount = cards.filter((c) => progress[c.id]?.status === 'done').length;

  const handleSubmit = useCallback(
    async (answer) => {
      const isCorrect = evaluateCard(card, answer);
      const durationMs = Date.now() - startTime;
      const score = isCorrect ? calcScore(card, durationMs, 1) : 0;

      if (isCorrect) {
        markDone(card.id, score, durationMs);
        addCoins(score);
      }

      if (user?.id && !user.id.startsWith('local-')) {
        const newCoins = _store.getState().coins;
        await Promise.all([
          saveAttempt({
            userId: user.id,
            cardId: card.id,
            answerText: String(answer).slice(0, 500),
            isCorrect,
            score,
            durationMs,
          }),
          isCorrect &&
            upsertProgress({
              userId: user.id,
              cardId: card.id,
              status: 'done',
              score,
              durationMs,
            }),
          isCorrect && updateCoins(user.id, newCoins),
        ]);
      }

      if (isCorrect) {
        setMaterialModal({ card, material: getMaterial(card) });
      } else {
        setStartTime(Date.now());
      }
    },
    [card, startTime, user, markDone, addCoins],
  );

  function handleNext() {
    setMaterialModal(null);
    if (isLast) {
      setScreen('shop');
    } else {
      setCardIndex((i) => i + 1);
      setStartTime(Date.now());
    }
  }

  const colorCls = CATEGORY_COLORS[card?.category] ?? 'bg-slate-500/20 text-slate-300 border-slate-500/30';

  if (!card) return null;

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setScreen('shop')}
            className="text-slate-400 hover:text-white text-sm"
          >
            ← До магазину
          </button>
          <span className="text-slate-400 text-sm">
            {cardIndex + 1} / {cards.length} • {doneCount} пройдено
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-800 p-5">
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${colorCls}`}
            >
              {card.category}
            </span>
            <h2 className="font-semibold text-white">{card.title}</h2>
          </div>
          <div className="mb-4">{renderPrompt(card.prompt)}</div>

          {card.type === 'mcq' && <McqCard card={card} onSubmit={handleSubmit} />}
          {card.type === 'text' && <TextCard onSubmit={handleSubmit} />}
          {card.type === 'output' && <OutputCard onSubmit={handleSubmit} />}
          {card.type === 'code' && <CodeCard card={card} onSubmit={handleSubmit} />}
        </div>
      </div>

      <AnimatePresence>
        {materialModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => handleNext()}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-slate-800 border border-green-500/30 p-6 shadow-2xl"
            >
              <div className="text-4xl mb-3 text-center">✅</div>
              <h3 className="text-lg font-bold text-white mb-2 text-center">
                {materialModal.card.title}
              </h3>
              <p className="text-sm text-slate-300 whitespace-pre-wrap mb-6">
                {materialModal.material}
              </p>
              <p className="text-xs text-slate-500 mb-4 text-center">
                Прочитай матеріал та натисни кнопку
              </p>
              <button
                onClick={handleNext}
                className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white hover:bg-green-500"
              >
                {isLast ? 'Завершити тренажер' : 'Далі'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
