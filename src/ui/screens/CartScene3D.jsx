import { Canvas, useFrame } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../game/store';

// ── Sand floor texture ─────────────────────────────────────────────────────
function makeSandTexture() {
  const s = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#c8a96e';
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = 'rgba(160,120,60,0.35)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < s; i += 18) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i + 4); ctx.stroke();
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

// ── Palm tree ──────────────────────────────────────────────────────────────
function PalmTree({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.13, 0.21, 4.4, 8]} />
        <meshStandardMaterial color="#8b6914" roughness={0.9} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i * Math.PI) / 2) * 0.65,
            4.3,
            Math.sin((i * Math.PI) / 2) * 0.65,
          ]}
          rotation={[
            Math.sin((i * Math.PI) / 2) * 0.5,
            0,
            -Math.cos((i * Math.PI) / 2) * 0.5,
          ]}
        >
          <boxGeometry args={[0.28, 0.07, 1.5]} />
          <meshStandardMaterial color="#1e6b1e" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// ── Belt product card ──────────────────────────────────────────────────────
function BeltProduct({ product, qty, position, done, onScan }) {
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
      {hovered && (
        <Html center position={[0, 0.68, 0]} distanceFactor={9} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: '#7c3aed', color: '#fff', borderRadius: 8,
            padding: '3px 10px', fontSize: 12, fontWeight: 700,
            fontFamily: 'system-ui,sans-serif', whiteSpace: 'nowrap',
            boxShadow: '0 2px 10px rgba(124,58,237,0.5)',
          }}>
            Натисни — відповісти
          </div>
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

// ── Inspector NPC ──────────────────────────────────────────────────────────
function InspectorNPC() {
  const inspectorSpeech = useGameStore((s) => s.inspectorSpeech);
  const bobRef = useRef();
  const t = useRef(0);

  useFrame((_, dt) => {
    t.current += dt * 0.7;
    if (bobRef.current) bobRef.current.position.y = Math.sin(t.current) * 0.02;
  });

  return (
    <group position={[-4.5, 0, 0.5]} rotation={[0, Math.PI / 2, 0]}>
      <group ref={bobRef}>
        {/* dark trousers */}
        <mesh position={[-0.12, 0.28, 0]}>
          <boxGeometry args={[0.18, 0.56, 0.18]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        <mesh position={[0.12, 0.28, 0]}>
          <boxGeometry args={[0.18, 0.56, 0.18]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        {/* suit jacket */}
        <mesh position={[0, 0.76, 0]}>
          <boxGeometry args={[0.48, 0.48, 0.28]} />
          <meshStandardMaterial color="#1c1c3a" />
        </mesh>
        {/* white shirt front */}
        <mesh position={[0, 0.76, -0.15]}>
          <boxGeometry args={[0.14, 0.34, 0.02]} />
          <meshStandardMaterial color="#f0f0f0" />
        </mesh>
        {/* arms */}
        <mesh position={[-0.34, 0.76, 0]}>
          <boxGeometry args={[0.17, 0.42, 0.17]} />
          <meshStandardMaterial color="#1c1c3a" />
        </mesh>
        <mesh position={[0.34, 0.76, 0]}>
          <boxGeometry args={[0.17, 0.42, 0.17]} />
          <meshStandardMaterial color="#1c1c3a" />
        </mesh>
        {/* clipboard */}
        <mesh position={[0.44, 0.65, -0.06]}>
          <boxGeometry args={[0.22, 0.3, 0.04]} />
          <meshStandardMaterial color="#f5f5dc" />
        </mesh>
        {/* head */}
        <mesh position={[0, 1.22, 0]}>
          <boxGeometry args={[0.42, 0.42, 0.42]} />
          <meshStandardMaterial color="#f4c391" />
        </mesh>
        {/* glasses left */}
        <mesh position={[-0.1, 1.25, -0.22]}>
          <boxGeometry args={[0.13, 0.07, 0.02]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        {/* glasses right */}
        <mesh position={[0.1, 1.25, -0.22]}>
          <boxGeometry args={[0.13, 0.07, 0.02]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        {/* glasses bridge */}
        <mesh position={[0, 1.25, -0.22]}>
          <boxGeometry args={[0.04, 0.02, 0.02]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        {/* stern mouth */}
        <mesh position={[0, 1.12, -0.22]}>
          <boxGeometry args={[0.16, 0.03, 0.02]} />
          <meshStandardMaterial color="#8b5a4a" />
        </mesh>
        {/* silver hair */}
        <mesh position={[0, 1.46, 0.04]}>
          <boxGeometry args={[0.44, 0.12, 0.46]} />
          <meshStandardMaterial color="#9ca3af" />
        </mesh>
      </group>

      {/* label */}
      <Html position={[0, 1.88, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(28,28,58,0.88)', color: '#e2e8f0',
          borderRadius: 6, padding: '2px 8px', fontSize: 10,
          fontFamily: 'system-ui,sans-serif', fontWeight: 600,
          whiteSpace: 'nowrap', backdropFilter: 'blur(4px)',
        }}>
          🔍 Інспектор
        </div>
      </Html>

      {/* speech bubble — visible only when inspectorSpeech is set */}
      {inspectorSpeech && (
        <Html position={[0.2, 2.5, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: '#fff', border: '2px solid #1c1c3a',
            borderRadius: 10, padding: '7px 12px',
            fontSize: 12, fontFamily: 'system-ui,sans-serif',
            fontWeight: 700, color: '#1c1c3a',
            maxWidth: 160, textAlign: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.32)',
            position: 'relative',
          }}>
            {inspectorSpeech}
            <div style={{
              position: 'absolute', bottom: -9, left: '50%',
              transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '9px solid #1c1c3a',
            }} />
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Treasure chest on dock ─────────────────────────────────────────────────
function CashRegister() {
  return (
    <group position={[3.1, 1.19, -0.55]}>
      {/* chest body */}
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[0.58, 0.36, 0.48]} />
        <meshStandardMaterial color="#5c3d1a" roughness={0.85} />
      </mesh>
      {/* gold horizontal trim */}
      {[0.15, -0.15].map((y) => (
        <mesh key={y} position={[0, 0.18 + y, 0]}>
          <boxGeometry args={[0.6, 0.04, 0.5]} />
          <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* gold vertical trim */}
      {[-0.26, 0.26].map((x) => (
        <mesh key={x} position={[x, 0.18, 0]}>
          <boxGeometry args={[0.04, 0.38, 0.5]} />
          <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* open lid */}
      <mesh position={[0, 0.4, 0.17]} rotation={[-0.55, 0, 0]}>
        <boxGeometry args={[0.58, 0.06, 0.48]} />
        <meshStandardMaterial color="#5c3d1a" roughness={0.85} />
      </mesh>
      {/* glowing gold inside */}
      <mesh position={[0, 0.28, -0.03]}>
        <boxGeometry args={[0.5, 0.14, 0.4]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.7} />
      </mesh>
      {/* lock */}
      <mesh position={[0, 0.18, -0.26]}>
        <boxGeometry args={[0.1, 0.12, 0.04]} />
        <meshStandardMaterial color="#c9a227" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ── Wooden island dock ─────────────────────────────────────────────────────
function CheckoutCounter() {
  return (
    <group>
      {/* barrel legs */}
      {[-3.5, -1.2, 1.2, 3.5].map((x) => (
        <mesh key={x} position={[x, 0.42, 0]}>
          <cylinderGeometry args={[0.19, 0.21, 0.84, 10]} />
          <meshStandardMaterial color="#7a5230" roughness={0.9} />
        </mesh>
      ))}
      {/* dock body */}
      <mesh position={[0, 0.56, 0]}>
        <boxGeometry args={[8, 0.22, 1.4]} />
        <meshStandardMaterial color="#7a5230" roughness={0.9} />
      </mesh>
      {/* alternating dock planks */}
      {Array.from({ length: 17 }).map((_, i) => (
        <mesh key={i} position={[-3.7 + i * 0.46, 1.11, 0]}>
          <boxGeometry args={[0.38, 0.07, 1.4]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#a07848' : '#8b6533'} roughness={0.8} />
        </mesh>
      ))}
      {/* frame base under planks */}
      <mesh position={[0, 1.075, 0]}>
        <boxGeometry args={[8, 0.015, 1.4]} />
        <meshStandardMaterial color="#5c3a1e" roughness={1} />
      </mesh>
      {/* bamboo post dividers */}
      {[-3.8, 3.8].map((x) => (
        <mesh key={x} position={[x, 1.38, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.58, 6]} />
          <meshStandardMaterial color="#a07828" roughness={0.8} />
        </mesh>
      ))}
      {/* decorative rope along dock */}
      <mesh position={[0, 1.16, -0.62]}>
        <boxGeometry args={[7.8, 0.04, 0.04]} />
        <meshStandardMaterial color="#c8a060" roughness={1} />
      </mesh>
    </group>
  );
}

// ── Store walls / floor ────────────────────────────────────────────────────
function StoreEnv() {
  const sandTex = useMemo(() => makeSandTexture(), []);

  return (
    <>
      {/* ocean */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#1a78c2" transparent opacity={0.88} />
      </mesh>
      {/* sand island floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[22, 18]} />
        <meshStandardMaterial map={sandTex} />
      </mesh>
      {/* palm trees at island edges */}
      {[
        [9.5, 0, 7], [-9.5, 0, 7], [9.5, 0, -7], [-9.5, 0, -7],
      ].map(([x, y, z], i) => (
        <PalmTree key={i} position={[x, y, z]} />
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
  const { cart, products, progress, openCheckout, setScreen, cartTotal, coins } = useGameStore();
  const total = cartTotal();

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 9, 8], fov: 52 }}
        gl={{ antialias: true }}
        style={{ background: '#87ceeb' }}
      >
        <ambientLight intensity={2.8} />
        <directionalLight position={[5, 14, 3]} intensity={1.4} color="#fff9e0" />
        <pointLight position={[-4, 5, 3]} intensity={0.4} color="#fff" />
        <pointLight position={[4, 5, -2]} intensity={0.4} color="#fff" />

        <StoreEnv />
        <CheckoutCounter />
        <CashierAtDesk />
        <CashRegister />
        <InspectorNPC />

        {cart.length === 0 && (
          <Html position={[-1.5, 1.8, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
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
          const x = -2.8 + i * 1.25;
          const done = progress[p.cardId]?.status === 'done';
          return (
            <BeltProduct
              key={item.productId}
              product={p}
              qty={item.qty}
              position={[x, 1.75, 0]}
              done={done}
              onScan={openCheckout}
            />
          );
        })}
      </Canvas>

      {/* HUD */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 18px', pointerEvents: 'none',
      }}>
        <button
          onClick={() => setScreen('shop')}
          style={{
            pointerEvents: 'auto', cursor: 'pointer',
            background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(8px)',
            border: '1px solid #e2e8f0', borderRadius: 12,
            color: '#475569', padding: '8px 16px',
            fontFamily: 'system-ui,sans-serif', fontSize: 14, fontWeight: 600,
          }}
        >
          ← Назад
        </button>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{
            background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(8px)',
            border: '1px solid #e2e8f0', borderRadius: 12,
            padding: '8px 14px', color: '#92400e',
            fontFamily: 'system-ui,sans-serif', fontSize: 14, fontWeight: 600,
          }}>
            🐚 {coins}
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(8px)',
            border: '1px solid #e2e8f0', borderRadius: 12,
            padding: '8px 14px', color: '#1e293b',
            fontFamily: 'system-ui,sans-serif', fontSize: 14, fontWeight: 600,
          }}>
            Разом: {total} ₴
          </div>
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: 18, left: 0, right: 0,
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(6px)',
          border: '1px solid #e2e8f0', borderRadius: 10,
          padding: '6px 16px', color: '#475569',
          fontFamily: 'system-ui,sans-serif', fontSize: 13,
        }}>
          Натисни на товар щоб відповісти на питання і просканувати
        </div>
      </div>
    </div>
  );
}
