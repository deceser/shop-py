import { useEffect, useState, Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import { supabase, loadProgress, ensureProfile } from './supabase/client';
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
  const { user, setUser, screen, setProgress } = useGameStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      if (!supabase) { setLoading(false); return; }
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const prog = await loadProgress(session.user.id);
        setProgress(prog);
      }
      setLoading(false);
    }
    init();

    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_ev, session) => {
      if (session?.user) {
        setUser(session.user);
        const prog = await loadProgress(session.user.id);
        setProgress(prog);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogin(u, username) {
    setUser(u);
    if (supabase && !u.id.startsWith('local-')) {
      await ensureProfile(u.id, username);
      const prog = await loadProgress(u.id);
      setProgress(prog);
    }
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
