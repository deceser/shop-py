import { create } from 'zustand';
import { cards, PRODUCTS } from '../data/cards';

const INITIAL_CART = [];

export const useGameStore = create((set, get) => ({
  // auth
  user: null,
  setUser: (user) => set({ user }),

  // progress map: cardId -> { status, bestScore, bestTimeMs }
  progress: {},
  setProgress: (list) => {
    const map = {};
    list.forEach((p) => {
      map[p.card_id] = { status: p.status, bestScore: p.best_score, bestTimeMs: p.best_time_ms };
    });
    set({ progress: map });
  },
  markDone: (cardId, score, durationMs) => {
    set((s) => {
      const prev = s.progress[cardId];
      return {
        progress: {
          ...s.progress,
          [cardId]: {
            status: 'done',
            bestScore: Math.max(score, prev?.bestScore ?? 0),
            bestTimeMs: prev?.bestTimeMs ? Math.min(durationMs, prev.bestTimeMs) : durationMs,
          },
        },
      };
    });
  },

  // total coins
  coins: 0,
  setCoins: (n) => set({ coins: n }),
  addCoins: (n) => set((s) => ({ coins: s.coins + n })),

  // combo
  combo: 0,
  resetCombo: () => set({ combo: 0 }),
  incCombo: () => set((s) => ({ combo: s.combo + 1 })),

  // shop / cart
  products: PRODUCTS,
  cart: INITIAL_CART,
  cartLimit: 3,
  addToCart: (productId) =>
    set((s) => {
      if (s.cart.length >= s.cartLimit) return s;
      if (s.cart.find((i) => i.productId === productId)) return s;
      if (s.scanned.includes(productId)) return s;
      return { cart: [...s.cart, { productId, qty: 1 }] };
    }),
  removeFromCart: (productId) =>
    set((s) => ({ cart: s.cart.filter((i) => i.productId !== productId) })),
  clearCart: () => set({ cart: [] }),

  // screen: 'shop' | 'cart' | 'checkout' | 'result' | 'dungeon'
  screen: 'shop',
  setScreen: (screen) => set({ screen }),

  // active checkout card
  activeCard: null,
  activeProduct: null,
  checkoutStartTime: null,
  openCheckout: (productId) => {
    const product = PRODUCTS.find((p) => p.id === productId);
    const card = cards.find((c) => c.id === product?.cardId);
    if (!card) return;
    set({ screen: 'checkout', activeCard: card, activeProduct: product, checkoutStartTime: Date.now() });
  },

  // last result
  lastResult: null,
  setLastResult: (r) => set({ lastResult: r, screen: 'result' }),

  // scanned items (products that passed checkout)
  scanned: [],
  addScanned: (productId) => set((s) => ({ scanned: [...s.scanned, productId] })),

  // helpers
  cartTotal: () => {
    const { cart, products } = get();
    return cart.reduce((sum, item) => {
      const p = products.find((pr) => pr.id === item.productId);
      return sum + (p?.price ?? 0) * item.qty;
    }, 0);
  },

  isCardDone: (cardId) => get().progress[cardId]?.status === 'done',
}));
