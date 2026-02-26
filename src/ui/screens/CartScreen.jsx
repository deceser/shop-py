import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../game/store';

export default function CartScreen() {
  const { cart, products, removeFromCart, setScreen, cartTotal, openCheckout } = useGameStore();

  const total = cartTotal();

  if (cart.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 p-8">
        <span className="text-7xl">🛒</span>
        <p className="text-slate-400">Кошик порожній</p>
        <button
          onClick={() => setScreen('shop')}
          className="rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-500 transition-colors"
        >
          До магазину
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 pb-32">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-900/80 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button onClick={() => setScreen('shop')} className="text-slate-400 hover:text-white transition-colors">
            ← Назад
          </button>
          <h1 className="flex-1 text-center text-lg font-bold text-white">🛒 Кошик</h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg p-4 flex flex-col gap-3">
        <AnimatePresence>
          {cart.map((item) => {
            const p = products.find((pr) => pr.id === item.productId);
            if (!p) return null;
            return (
              <motion.div
                key={item.productId}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <span className="text-3xl">{p.emoji}</span>
                <div className="flex-1">
                  <p className="font-medium text-white">{p.name}</p>
                  <p className="text-sm text-slate-400">{p.price} ₴ × {item.qty}</p>
                </div>
                <span className="font-semibold text-white">{p.price * item.qty} ₴</span>
                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="ml-2 text-slate-500 hover:text-red-400 transition-colors text-lg"
                >
                  ✕
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between">
          <span className="text-slate-300 font-medium">Разом</span>
          <span className="text-xl font-bold text-white">{total} ₴</span>
        </div>
      </div>

      {/* Checkout belt */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-slate-900/90 backdrop-blur-md p-4">
        <div className="mx-auto max-w-lg">
          <p className="mb-3 text-center text-sm text-slate-400">
            Обери товар щоб пройти касу
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {cart.map((item) => {
              const p = products.find((pr) => pr.id === item.productId);
              if (!p) return null;
              return (
                <motion.button
                  key={item.productId}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openCheckout(item.productId)}
                  className="flex shrink-0 flex-col items-center gap-1 rounded-xl border-2 border-amber-500/50 bg-amber-500/10 px-3 py-2 text-center hover:border-amber-400 transition-colors"
                >
                  <span className="text-2xl">{p.emoji}</span>
                  <span className="text-xs text-amber-300">{p.name}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
