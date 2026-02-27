import { useEffect, useState, Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import { loadProfileById, loadProgress, getSavedUserId } from './supabase/client';
import { useGameStore } from './game/store';
import LoginScreen from './ui/screens/LoginScreen';
import CheckoutScreen from './ui/screens/CheckoutScreen';

const ShopScene3D = lazy(() => import('./ui/screens/ShopScene3D'));
const CartScene3D = lazy(() => import('./ui/screens/CartScene3D'));

const Loader = () => (
  <div style={{
    display: 'flex', height: '100vh', alignItems: 'center',
    justifyContent: 'center', background: '#0f172a',
    color: '#94a3b8', fontFamily: 'system-ui, sans-serif', fontSize: 18,
  }}>
    Завантаження...
  </div>
);

export default function App() {
  const { user, setUser, setCoins, screen, setProgress } = useGameStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const savedId = getSavedUserId();
      if (savedId) {
        const profile = await loadProfileById(savedId);
        if (profile) {
          setUser(profile);
          setCoins(profile.coins ?? 0);
          const prog = await loadProgress(savedId);
          setProgress(prog);
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  async function handleLogin(u) {
    setUser(u);
    setCoins(u.coins ?? 0);
    const prog = await loadProgress(u.id);
    setProgress(prog);
  }

  if (loading) return <Loader />;
  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#0f172a' }}>
      <Suspense fallback={<Loader />}>
        <AnimatePresence mode="wait">
          {screen === 'shop' && <ShopScene3D key="shop" />}
          {screen === 'cart' && <CartScene3D key="cart" />}
          {(screen === 'checkout' || screen === 'result') && (
            <div key="checkout" style={{ position: 'relative', width: '100vw', height: '100vh' }}>
              <CartScene3D />
              <CheckoutScreen />
            </div>
          )}
        </AnimatePresence>
      </Suspense>
    </div>
  );
}
