import { Canvas, useFrame } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../game/store';

// ── Tile floor texture ─────────────────────────────────────────────────────
function makeTileTexture() {
  const s = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  for (let i = 0; i <= s; i += 128) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i); ctx.stroke();
  }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 4);
  return t;
}

// ── Product card texture ───────────────────────────────────────────────────
function makeCartTex(emoji, name, qty, done, hovered) {
  const s = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, s, s);

  const bg = done ? '#f0fdf4' : hovered ? '#ede9fe' : '#ffffff';
  const border = done ? '#22c55e' : hovered ? '#7c3aed' : '#e2e8f0';

  ctx.shadowColor = hovered ? '#7c3aed' : 'rgba(0,0,0,0.1)';
  ctx.shadowBlur = hovered ? 24 : 6;
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.roundRect(6, 6, s - 12, s - 12, 22); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = border;
  ctx.lineWidth = hovered || done ? 7 : 3;
  ctx.beginPath(); ctx.roundRect(6, 6, s - 12, s - 12, 22); ctx.stroke();

  ctx.font = `${Math.round(s * 0.38)}px serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(emoji, s / 2, s * 0.43);

  ctx.fillStyle = '#1e293b';
  ctx.font = `bold ${Math.round(s * 0.095)}px system-ui,Arial,sans-serif`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(name, s / 2, s * 0.8);

  if (qty > 1) {
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(s - 26, 26, 20, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = `bold ${Math.round(s * 0.11)}px system-ui,Arial,sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`×${qty}`, s - 26, 26);
  }
  if (done) {
    ctx.font = `${Math.round(s * 0.13)}px serif`;
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText('✅', s - 10, 8);
  }

  return new THREE.CanvasTexture(cv);
}

// ── Belt product card ──────────────────────────────────────────────────────
function BeltProduct({ product, qty, position, done, onScan, onRemove, modalOpen, isMobile }) {
  const [hovered, setHovered] = useState(false);
  const mesh = useRef();

  const tex = useMemo(
    () => makeCartTex(product.emoji, product.name, qty, done, hovered),
    [product.emoji, product.name, qty, done, hovered],
  );

  useFrame((_, dt) => {
    if (!mesh.current) return;
    const target = hovered ? 1.12 : 1;
    mesh.current.scale.lerp(new THREE.Vector3(target, target, target), dt * 8);
  });

  return (
    <Billboard position={position}>
      <mesh
        ref={mesh}
        onClick={(e) => { e.stopPropagation(); onScan(product.id); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <planeGeometry args={[1.05, 1.05]} />
        <meshBasicMaterial map={tex} transparent side={THREE.DoubleSide} />
      </mesh>
      {!modalOpen && (
        <Html center position={[-0.62, 0.62, 0]} distanceFactor={isMobile ? 6 : 9}>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(product.id); }}
            style={{
              background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%',
              width: isMobile ? 32 : 22, height: isMobile ? 32 : 22,
              fontSize: isMobile ? 16 : 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(239,68,68,0.6)', lineHeight: 1,
            }}
          >
            ✕
          </button>
        </Html>
      )}
    </Billboard>
  );
}

// ── Cashier NPC ────────────────────────────────────────────────────────────
function CashierAtDesk() {
  const bobRef = useRef();
  const t = useRef(0);

  useFrame((_, dt) => {
    t.current += dt * 1.2;
    if (bobRef.current) bobRef.current.position.y = Math.sin(t.current) * 0.03;
  });

  return (
    <group position={[3.2, 0, -0.8]} rotation={[0, -Math.PI / 6, 0]}>
      <group ref={bobRef}>
        <mesh position={[-0.12, 0.28, 0]}>
          <boxGeometry args={[0.17, 0.54, 0.17]} />
          <meshStandardMaterial color="#1e3a5f" />
        </mesh>
        <mesh position={[0.12, 0.28, 0]}>
          <boxGeometry args={[0.17, 0.54, 0.17]} />
          <meshStandardMaterial color="#1e3a5f" />
        </mesh>
        <mesh position={[0, 0.76, 0]}>
          <boxGeometry args={[0.48, 0.48, 0.28]} />
          <meshStandardMaterial color="#16a34a" />
        </mesh>
        <mesh position={[-0.34, 0.76, 0]}>
          <boxGeometry args={[0.17, 0.42, 0.17]} />
          <meshStandardMaterial color="#16a34a" />
        </mesh>
        <mesh position={[0.34, 0.76, 0]}>
          <boxGeometry args={[0.17, 0.42, 0.17]} />
          <meshStandardMaterial color="#16a34a" />
        </mesh>
        <mesh position={[0, 1.22, 0]}>
          <boxGeometry args={[0.42, 0.42, 0.42]} />
          <meshStandardMaterial color="#fde68a" />
        </mesh>
        <mesh position={[0, 1.46, 0.04]}>
          <boxGeometry args={[0.44, 0.12, 0.46]} />
          <meshStandardMaterial color="#92400e" />
        </mesh>
        <mesh position={[0, 1.22, 0.25]}>
          <boxGeometry args={[0.42, 0.42, 0.06]} />
          <meshStandardMaterial color="#92400e" />
        </mesh>
        <mesh position={[-0.09, 1.24, -0.22]}>
          <boxGeometry args={[0.07, 0.07, 0.02]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0.09, 1.24, -0.22]}>
          <boxGeometry args={[0.07, 0.07, 0.02]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, 1.15, -0.22]}>
          <boxGeometry args={[0.11, 0.04, 0.02]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
        <mesh position={[0, 1.49, -0.1]}>
          <boxGeometry args={[0.46, 0.07, 0.34]} />
          <meshStandardMaterial color="#15803d" />
        </mesh>
      </group>
    </group>
  );
}

// ── Cash register ──────────────────────────────────────────────────────────
function CashRegister() {
  return (
    <group position={[3.1, 1.19, -0.55]}>
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[0.55, 0.28, 0.48]} />
        <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.38, -0.08]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.46, 0.3, 0.05]} />
        <meshStandardMaterial color="#0f172a" emissive="#3b82f6" emissiveIntensity={0.7} />
      </mesh>
      {[-0.13, 0, 0.13].map((x) =>
        [-0.05, 0.05].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.29, z + 0.08]}>
            <boxGeometry args={[0.08, 0.04, 0.06]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        )),
      )}
    </group>
  );
}

// ── Checkout counter ───────────────────────────────────────────────────────
function CheckoutCounter() {
  return (
    <group>
      {/* counter body */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[8, 1.1, 1.4]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* tabletop */}
      <mesh position={[0, 1.11, 0]}>
        <boxGeometry args={[8, 0.06, 1.4]} />
        <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.4} />
      </mesh>
      {/* dividers */}
      {[-3.8, 3.8].map((x) => (
        <mesh key={x} position={[x, 1.35, 0]}>
          <boxGeometry args={[0.06, 0.5, 1.4]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      ))}
      {/* belt surface */}
      <mesh position={[-0.4, 1.15, 0]}>
        <boxGeometry args={[6, 0.04, 1.1]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>
      {/* belt stripes */}
      {Array.from({ length: 16 }).map((_, i) => (
        <mesh key={i} position={[-3.1 + i * 0.42, 1.16, 0]}>
          <boxGeometry args={[0.1, 0.01, 1.1]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      ))}
      {/* belt rollers at ends */}
      {[-3.4, 2.6].map((x) => (
        <mesh key={x} position={[x, 1.12, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 1.1, 12]} />
          <meshStandardMaterial color="#475569" metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// ── Store walls / floor ────────────────────────────────────────────────────
function StoreEnv() {
  const floorTex = useMemo(() => makeTileTexture(), []);

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[22, 18]} />
        <meshStandardMaterial map={floorTex} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, 0]}>
        <planeGeometry args={[22, 18]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      {[
        { p: [0, 2.5, -8], r: [0, 0, 0], s: [22, 5] },
        { p: [0, 2.5, 8], r: [0, Math.PI, 0], s: [22, 5] },
        { p: [-10, 2.5, 0], r: [0, Math.PI / 2, 0], s: [18, 5] },
        { p: [10, 2.5, 0], r: [0, -Math.PI / 2, 0], s: [18, 5] },
      ].map((w, i) => (
        <mesh key={i} position={w.p} rotation={w.r}>
          <planeGeometry args={w.s} />
          <meshStandardMaterial color="#f1f5f9" />
        </mesh>
      ))}
      {/* floor mat */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 5]}>
        <planeGeometry args={[9, 1.6]} />
        <meshStandardMaterial color="#7c3aed" opacity={0.5} transparent />
      </mesh>
    </>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function CartScene3D() {
  const { cart, products, progress, screen, openCheckout, removeFromCart, setScreen, coins } = useGameStore();
  const modalOpen = screen === 'checkout';

  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const fn = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  const isPortrait = vp.h > vp.w;
  const isMobile = vp.w < 768;
  const camPos = isPortrait ? [0, 7, 9] : [0, 9, 8];
  const camFov = isPortrait ? 65 : 52;

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', touchAction: 'none' }}>
      <Canvas
        camera={{ position: camPos, fov: camFov }}
        gl={{ antialias: true }}
        style={{ background: '#e8edf2', touchAction: 'none' }}
      >
        <ambientLight intensity={2.8} />
        <directionalLight position={[0, 10, 3]} intensity={1.2} />
        <pointLight position={[-4, 5, 3]} intensity={0.4} color="#fff" />
        <pointLight position={[4, 5, -2]} intensity={0.4} color="#fff" />

        <StoreEnv />
        <CheckoutCounter />
        <CashierAtDesk />
        <CashRegister />

        {cart.length === 0 && (
          <Html position={[0, 1.8, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
            <div style={{
              textAlign: 'center', color: '#94a3b8',
              fontFamily: 'system-ui,sans-serif',
            }}>
              <div style={{ fontSize: 36 }}>🛒</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Кошик порожній</div>
            </div>
          </Html>
        )}

        {cart.map((item, i) => {
          const p = products.find((pr) => pr.id === item.productId);
          if (!p) return null;
          const x = (i - (cart.length - 1) / 2) * (isMobile ? 0.9 : 1.15);
          const done = progress[p.cardId]?.status === 'done';
          return (
            <BeltProduct
              key={item.productId}
              product={p}
              qty={item.qty}
              position={[x, 1.75, 0]}
              done={done}
              onScan={openCheckout}
              onRemove={removeFromCart}
              modalOpen={modalOpen}
              isMobile={isMobile}
            />
          );
        })}
      </Canvas>

      {/* HUD */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 14px', pointerEvents: 'none',
      }}>
        <button
          onClick={() => setScreen('shop')}
          style={{
            pointerEvents: 'auto', cursor: 'pointer',
            background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(8px)',
            border: '1px solid #e2e8f0', borderRadius: 12,
            color: '#475569', padding: '7px 14px',
            fontFamily: 'system-ui,sans-serif', fontSize: 13, fontWeight: 600,
          }}
        >
          ← Назад
        </button>

        <div style={{
          background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(8px)',
          border: '1px solid #e2e8f0', borderRadius: 12,
          padding: '7px 12px', color: '#92400e',
          fontFamily: 'system-ui,sans-serif', fontSize: 13, fontWeight: 600,
        }}>
          🪙 {coins}
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: 18, left: 0, right: 0,
        textAlign: 'center', pointerEvents: 'none',
        padding: '0 16px',
      }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(6px)',
          border: '1px solid #e2e8f0', borderRadius: 10,
          padding: '5px 14px', color: '#475569',
          fontFamily: 'system-ui,sans-serif', fontSize: 12,
        }}>
          {isPortrait ? '👆 Натисни на товар щоб просканувати' : 'Натисни на товар щоб відповісти на питання і просканувати'}
        </div>
      </div>
    </div>
  );
}
