import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import CheckoutModal from '../components/CheckoutModal';
import ResultOverlay from '../components/ResultOverlay';
import { useGameStore } from '../../game/store';

export default function CheckoutScreen() {
  const { setScreen, removeFromCart, addScanned, activeProduct, sayInspector } = useGameStore();
  const [result, setResult] = useState(null);

  function handleDone(res) {
    setResult(res);
  }

  function handleContinue() {
    const isCorr = result?.isCorrect;
    if (isCorr && activeProduct) {
      addScanned(activeProduct.id);
      removeFromCart(activeProduct.id);
    }
    setResult(null);
    // inspector реагує після повернення на сцену кошика
    sayInspector(
      isCorr
        ? 'Непогано… але дисципліна кульгає.'
        : 'Незадовільно. Повторіть матеріал.',
    );
    setScreen('cart');
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <AnimatePresence>
        {!result && <CheckoutModal key="modal" onDone={handleDone} />}
      </AnimatePresence>
      <AnimatePresence>
        {result && <ResultOverlay key="result" result={result} onContinue={handleContinue} />}
      </AnimatePresence>
    </div>
  );
}
