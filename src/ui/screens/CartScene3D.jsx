import { Canvas } from '@react-three/fiber';
import { Billboard, OrbitControls, Html } from '@react-three/drei';
import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../game/store';

function makeCartTexture(emoji, name, qty, done) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, size, size);
  ctx.shadowColor = done ? '#22c55e' : '#7c3aed';
  ctx.shadowBlur = 20;
  ctx.fillStyle = done ? '#14532d' : '#1e1b4b';
  ctx.beginPath();
  ctx.roundRect(10, 10, size - 20, size - 20, 28);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = done ? '#22c55e' : '#7c3aed';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(10, 10, size - 20, size - 20, 28);
  ctx.stroke();

  ctx.font = `${Math.round(size * 0.42)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, size / 2, size * 0.43);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = `bold ${Math.round(size * 0.1)}px system-ui, Arial, sans-serif`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(name, size / 2, size * 0.8);

  // qty badge
  if (qty > 1) {
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(size - 28, 28, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = `bold ${Math.round(size * 0.13)}px system-ui, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`×${qty}`, size - 28, 28);
  }

  if (done) {
    ctx.font = `${Math.round(size * 0.18)}px serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('✅', size - 14, 42);
  }

  return new THREE.CanvasTexture(canvas);
}

function CartItem({ product, qty, position, onScan, done }) {
  const mesh = useRef();
  const [hovered, setHovered] = useState(false);

  const texture = useMemo(
    () => makeCartTexture(product.emoji, product.name, qty, done),
    [product.emoji, product.name, qty, done],
  );

  useFrame((_, delta) => {
    if (!mesh.current) return;
    const target = hovered ? 1.15 : 1;
    mesh.current.scale.lerp(new THREE.Vector3(target, target, target), delta * 8);
  });

  return (
    <Billboard position={position}>
      <mesh
        ref={mesh}
        onClick={(e) => { e.stopPropagation(); onScan(product.id); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <planeGeometry args={[1.2, 1.2]} />
        <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
      </mesh>
    </Billboard>
  );
}

function ConveyorBelt() {
  const stripes = 18;
  return (
    <group>
      {/* основная лента */}
      <mesh position={[0, -1.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 2.4]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* полосы */}
      {Array.from({ length: stripes }).map((_, i) => (
        <mesh
          key={i}
          position={[-6.5 + i * (13 / stripes) + 0.2, -1.59, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.12, 2.2]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      ))}
      {/* борта */}
      <mesh position={[0, -1.4, 1.3]}>
        <boxGeometry args={[14.2, 0.15, 0.08]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <mesh position={[0, -1.4, -1.3]}>
        <boxGeometry args={[14.2, 0.15, 0.08]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
    </group>
  );
}

function Register() {
  return (
    <group position={[5.8, 0, 0]}>
      <mesh position={[0, -0.7, 0]}>
        <boxGeometry args={[1.2, 1.8, 1.2]} />
        <meshStandardMaterial color="#1e293b" metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.35, 0.2]}>
        <boxGeometry args={[0.9, 0.6, 0.07]} />
        <meshStandardMaterial color="#0f172a" emissive="#7c3aed" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0.1, -0.05, 0.62]}>
        <boxGeometry args={[0.55, 0.35, 0.06]} />
        <meshStandardMaterial color="#0f172a" emissive="#3b82f6" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

export default function CartScene3D() {
  const { cart, products, progress, removeFromCart, openCheckout, setScreen, cartTotal, coins } = useGameStore();
  const total = cartTotal();

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 2, 9], fov: 55 }}
        style={{ background: 'linear-gradient(to bottom, #0f172a 0%, #1e293b 100%)' }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 8, 4]} intensity={1} />
        <pointLight position={[5, 3, 2]} intensity={0.8} color="#7c3aed" />
        <pointLight position={[-5, 3, 2]} intensity={0.4} color="#3b82f6" />

        <ConveyorBelt />
        <Register />

        {cart.map((item, i) => {
          const p = products.find((pr) => pr.id === item.productId);
          if (!p) return null;
          const x = -4.5 + i * 1.55;
          const done = progress[p.cardId]?.status === 'done';
          return (
            <CartItem
              key={item.productId}
              product={p}
              qty={item.qty}
              position={[x, -0.55, 0]}
              onScan={openCheckout}
              done={done}
            />
          );
        })}

        {cart.length === 0 && (
          <Html center>
            <div style={{
              textAlign: 'center',
              color: '#94a3b8',
              fontFamily: 'system-ui, sans-serif',
              pointerEvents: 'none',
            }}>
              <div style={{ fontSize: 48 }}>🛒</div>
              <div style={{ marginTop: 8 }}>Кошик порожній</div>
            </div>
          </Html>
        )}

        <mesh position={[0, -3.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[30, 20]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>

        <OrbitControls
          enablePan={false}
          minDistance={5}
          maxDistance={16}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>

      {/* HUD overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px', pointerEvents: 'none',
      }}>
        <button
          onClick={() => setScreen('shop')}
          style={{
            pointerEvents: 'auto',
            background: 'rgba(30,41,59,0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            color: '#94a3b8',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          ← Назад
        </button>

        <div style={{ display: 'flex', gap: 10, pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(30,41,59,0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            color: '#fde68a',
            padding: '8px 14px',
            fontSize: 14,
            fontWeight: 600,
          }}>
            🪙 {coins}
          </div>
          <div style={{
            background: 'rgba(30,41,59,0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            color: '#e2e8f0',
            padding: '8px 14px',
            fontSize: 14,
            fontWeight: 600,
          }}>
            Разом: {total} ₴
          </div>
        </div>
      </div>

      {/* нижняя подсказка */}
      <div style={{
        position: 'absolute', bottom: 24, left: 0, right: 0,
        textAlign: 'center', color: '#64748b',
        fontSize: 13, fontFamily: 'system-ui, sans-serif',
        pointerEvents: 'none',
      }}>
        Натисни на товар щоб відповісти на питання і просканувати
      </div>
    </div>
  );
}
