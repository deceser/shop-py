import { Suspense, lazy, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameStore } from './game/store';
import NameDialog from './ui/components/NameDialog';
import CheckoutScreen from './ui/screens/CheckoutScreen';
import { getSavedUserId, loadProfileById, loadProgress } from './supabase/client';

const ShopScene3D = lazy(() => import('./ui/screens/ShopScene3D'));
const CartScene3D = lazy(() => import('./ui/screens/CartScene3D'));
const DungeonScreen = lazy(() => import('./ui/screens/DungeonScreen'));

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
  const { user, setUser, setCoins, setProgress, screen } = useGameStore();
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    const savedId = getSavedUserId();
    if (!savedId) { setRestoring(false); return; }
    (async () => {
      const profile = await loadProfileById(savedId);
      if (profile) {
        const progress = await loadProgress(savedId);
        setUser(profile);
        setCoins(profile.coins);
        setProgress(progress);
      }
      setRestoring(false);
    })();
  }, []);

  if (restoring) return <Loader />;

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#0f172a', position: 'relative' }}>
      <Suspense fallback={<Loader />}>
        <AnimatePresence mode="wait">
          {screen === 'shop' && <ShopScene3D key="shop" />}
          {screen === 'cart' && <CartScene3D key="cart" />}
          {screen === 'dungeon' && <DungeonScreen key="dungeon" />}
          {(screen === 'checkout' || screen === 'result') && (
            <div key="checkout" style={{ position: 'relative', width: '100vw', height: '100vh' }}>
              <CartScene3D />
              <CheckoutScreen />
            </div>
          )}
        </AnimatePresence>
      </Suspense>

      {!user && <NameDialog onSubmit={setUser} />}
    </div>
  );
}
