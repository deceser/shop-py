import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import CheckoutModal from '../components/CheckoutModal';
import ResultOverlay from '../components/ResultOverlay';
import { useGameStore } from '../../game/store';

export default function CheckoutScreen() {
  const { setScreen, removeFromCart, addScanned, activeProduct } = useGameStore();
  const [result, setResult] = useState(null);

  function handleDone(res) {
    setResult(res);
  }

  function handleContinue() {
    if (result?.isCorrect && activeProduct) {
      addScanned(activeProduct.id);
      removeFromCart(activeProduct.id);
    }
    setResult(null);
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
