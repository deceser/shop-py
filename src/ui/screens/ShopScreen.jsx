import { motion } from 'framer-motion';
import { useGameStore } from '../../game/store';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function ShopScreen() {
  const { products, cart, addToCart, setScreen, coins, progress } = useGameStore();
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-900/80 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">🛒 Python Market</h1>
            <p className="text-xs text-slate-400">Натисни на товар, щоб додати до кошика</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-yellow-300">🪙 {coins}</span>
            {cartCount > 0 && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setScreen('cart')}
                className="relative rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
              >
                Кошик
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold">
                  {cartCount}
                </span>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto grid max-w-2xl grid-cols-3 gap-3 p-4 sm:grid-cols-4 md:grid-cols-5"
      >
        {products.map((p) => {
          const inCart = cart.find((i) => i.productId === p.id);
          const done = progress[p.cardId]?.status === 'done';

          return (
            <motion.button
              key={p.id}
              variants={item}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => addToCart(p.id)}
              className={`relative flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center transition-colors
                ${inCart
                  ? 'border-violet-500 bg-violet-500/10'
                  : 'border-white/10 bg-white/5 hover:border-violet-400/50'
                }`}
            >
              {done && (
                <span className="absolute -top-1.5 -right-1.5 text-base">✅</span>
              )}
              <span className="text-3xl">{p.emoji}</span>
              <span className="text-xs font-medium text-white leading-tight">{p.name}</span>
              <span className="text-xs text-slate-400">{p.price} ₴</span>
              {inCart && (
                <span className="text-xs font-bold text-violet-300">×{inCart.qty}</span>
              )}
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
