import { motion } from 'framer-motion';
import { useGameStore } from '../../game/store';
import { getGrade, GRADE_SCALE, TOTAL_COINS } from '../../data/cards';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function ShopScreen() {
  const { products, cart, addToCart, setScreen, coins, scanned } = useGameStore();
  const cartCount = cart.length;
  const grade = getGrade(coins);
  const nextGrade = GRADE_SCALE.find((g) => g.grade === grade + 1);

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
            <div className="text-right">
              <div className="text-sm font-semibold text-yellow-300">🪙 {coins} / {TOTAL_COINS}</div>
              <div className="text-xs text-slate-400">
                Оцінка: <span className="font-bold text-green-400">{grade}/12</span>
                {nextGrade && (
                  <span className="ml-1 text-slate-500">→ {nextGrade.grade}б від {nextGrade.min}🪙</span>
                )}
              </div>
            </div>
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
          const bought = scanned.includes(p.id);

          return (
            <motion.button
              key={p.id}
              variants={item}
              whileHover={!bought ? { scale: 1.05 } : {}}
              whileTap={!bought ? { scale: 0.95 } : {}}
              onClick={() => !bought && addToCart(p.id)}
              disabled={bought}
              className={`relative flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center transition-colors
                ${bought
                  ? 'border-green-600/40 bg-green-900/20 opacity-60 cursor-not-allowed'
                  : inCart
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-white/10 bg-white/5 hover:border-violet-400/50'
                }`}
            >
              {bought && (
                <span className="absolute -top-1.5 -right-1.5 text-base">✅</span>
              )}
              <span className="text-3xl">{p.emoji}</span>
              <span className="text-xs font-medium text-white leading-tight">{p.name}</span>
              <span className="text-xs text-slate-400">{p.price} ₴</span>
              {bought && <span className="text-xs text-green-400 font-semibold">Куплено</span>}
              {inCart && !bought && <span className="text-xs font-bold text-violet-300">У кошику</span>}
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
