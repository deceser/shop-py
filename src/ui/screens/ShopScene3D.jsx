import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../game/store';

// ── Layout constants ───────────────────────────────────────────────────────
const SHELF_Z = [5, 2.5, 0, -2, -4];
const SHELF_HALF_W = 5.5;
const SHELF_D = 0.7;
const SPEED = 5;
const INTERACT_R = 1.8;
const CASHIER_R = 2.4;
const PLAYER_R = 0.35;
const CASHIER_POS = [0, 0, -7.5];

const SHELF_AABBS = SHELF_Z.map((z) => ({
  xMin: -SHELF_HALF_W, xMax: SHELF_HALF_W,
  zMin: z - SHELF_D / 2 - PLAYER_R,
  zMax: z + SHELF_D / 2 + PLAYER_R,
}));

const COUNTER_AABB = { xMin: -2.5 - PLAYER_R, xMax: 2.5 + PLAYER_R, zMin: -8.6 - PLAYER_R, zMax: -7.4 + PLAYER_R };

function blockedBy(x, z) {
  if (x > COUNTER_AABB.xMin && x < COUNTER_AABB.xMax && z > COUNTER_AABB.zMin && z < COUNTER_AABB.zMax) return true;
  return SHELF_AABBS.some((s) => x > s.xMin && x < s.xMax && z > s.zMin && z < s.zMax);
}

// ── Textures ───────────────────────────────────────────────────────────────
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
  t.repeat.set(5, 6);
  return t;
}

function makeProductTex(emoji, name, highlighted, done, inCart) {
  const s = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, s, s);

  const bg = done ? '#f0fdf4' : highlighted ? '#ede9fe' : inCart ? '#fef3c7' : '#ffffff';
  const border = done ? '#22c55e' : highlighted ? '#7c3aed' : inCart ? '#f59e0b' : '#e2e8f0';

  ctx.shadowColor = highlighted ? '#7c3aed' : 'rgba(0,0,0,0.12)';
  ctx.shadowBlur = highlighted ? 24 : 6;
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.roundRect(6, 6, s - 12, s - 12, 22); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = border;
  ctx.lineWidth = highlighted || done ? 7 : 3;
  ctx.beginPath(); ctx.roundRect(6, 6, s - 12, s - 12, 22); ctx.stroke();

  ctx.font = `${Math.round(s * 0.4)}px serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(emoji, s / 2, s * 0.44);

  ctx.fillStyle = '#1e293b';
  ctx.font = `bold ${Math.round(s * 0.098)}px system-ui,Arial,sans-serif`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(name, s / 2, s * 0.8);

  if (done) {
    ctx.font = `${Math.round(s * 0.14)}px serif`;
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText('✅', s - 10, 8);
  }
  if (inCart && !done) {
    ctx.font = `${Math.round(s * 0.14)}px serif`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('🛒', 10, 8);
  }

  return new THREE.CanvasTexture(cv);
}

// ── Shelf product ──────────────────────────────────────────────────────────
function ShelfProduct({ product, position, highlighted, done, inCart, cartFull }) {
  const tex = useMemo(
    () => makeProductTex(product.emoji, product.name, highlighted, done, inCart),
    [product.emoji, product.name, highlighted, done, inCart],
  );

  return (
    <Billboard position={position}>
      <mesh>
        <planeGeometry args={[0.9, 0.9]} />
        <meshBasicMaterial map={tex} transparent side={THREE.DoubleSide} />
      </mesh>
      {highlighted && !done && (
        <Html center position={[0, 0.62, 0]} distanceFactor={9} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: cartFull ? '#b45309' : '#7c3aed',
            color: '#fff', borderRadius: 8,
            padding: '3px 9px', fontSize: 12, fontWeight: 700,
            fontFamily: 'system-ui,sans-serif', whiteSpace: 'nowrap',
            boxShadow: cartFull ? '0 2px 8px rgba(180,83,9,0.5)' : '0 2px 8px rgba(124,58,237,0.5)',
          }}>
            {cartFull ? '🛒 Спочатку до касирші!' : 'E — взяти'}
          </div>
        </Html>
      )}
    </Billboard>
  );
}

// ── Shelf row ──────────────────────────────────────────────────────────────
function ShelfRow({ z }) {
  const w = SHELF_HALF_W * 2;
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[w + 0.4, 0.2, SHELF_D + 0.1]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[w + 0.4, 0.06, SHELF_D + 0.1]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.1, SHELF_D / 2 - 0.02]}>
        <boxGeometry args={[w + 0.4, 1.1, 0.04]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.9} />
      </mesh>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[-SHELF_HALF_W + i * (w / 5) + 0.2, 0.9, 0]}>
          <boxGeometry args={[0.05, 1.8, SHELF_D + 0.1]} />
          <meshStandardMaterial color="#cbd5e1" />
        </mesh>
      ))}
    </group>
  );
}

// ── Cashier NPC ────────────────────────────────────────────────────────────
function CashierNPC({ nearCashier, cartEmpty }) {
  const bodyBob = useRef(0);
  const groupRef = useRef();

  useFrame((_, dt) => {
    bodyBob.current += dt * 1.2;
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(bodyBob.current) * 0.04;
    }
  });

  return (
    <group position={[0.6, 0, -9.1]} rotation={[0, Math.PI, 0]}>
      <group ref={groupRef}>
        {/* legs */}
        <mesh position={[-0.12, 0.28, 0]}>
          <boxGeometry args={[0.18, 0.56, 0.18]} />
          <meshStandardMaterial color="#1e3a5f" />
        </mesh>
        <mesh position={[0.12, 0.28, 0]}>
          <boxGeometry args={[0.18, 0.56, 0.18]} />
          <meshStandardMaterial color="#1e3a5f" />
        </mesh>
        {/* uniform body */}
        <mesh position={[0, 0.78, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.3]} />
          <meshStandardMaterial color="#16a34a" />
        </mesh>
        {/* arms */}
        <mesh position={[-0.36, 0.78, 0]}>
          <boxGeometry args={[0.18, 0.44, 0.18]} />
          <meshStandardMaterial color="#16a34a" />
        </mesh>
        <mesh position={[0.36, 0.78, 0]}>
          <boxGeometry args={[0.18, 0.44, 0.18]} />
          <meshStandardMaterial color="#16a34a" />
        </mesh>
        {/* head */}
        <mesh position={[0, 1.25, 0]}>
          <boxGeometry args={[0.44, 0.44, 0.44]} />
          <meshStandardMaterial color="#fde68a" />
        </mesh>
        {/* hair */}
        <mesh position={[0, 1.5, 0.05]}>
          <boxGeometry args={[0.46, 0.14, 0.48]} />
          <meshStandardMaterial color="#92400e" />
        </mesh>
        <mesh position={[0, 1.25, 0.26]}>
          <boxGeometry args={[0.44, 0.44, 0.06]} />
          <meshStandardMaterial color="#92400e" />
        </mesh>
        {/* eyes */}
        <mesh position={[-0.1, 1.27, -0.23]}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0.1, 1.27, -0.23]}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        {/* smile */}
        <mesh position={[0, 1.17, -0.23]}>
          <boxGeometry args={[0.12, 0.04, 0.02]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
        {/* cap */}
        <mesh position={[0, 1.52, -0.1]}>
          <boxGeometry args={[0.48, 0.08, 0.36]} />
          <meshStandardMaterial color="#15803d" />
        </mesh>
      </group>

      {/* hint above cashier */}
      <Html position={[0, 2.2, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: nearCashier ? '#7c3aed' : 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(6px)',
          color: nearCashier ? '#fff' : '#475569',
          border: `1px solid ${nearCashier ? '#7c3aed' : '#e2e8f0'}`,
          borderRadius: 8, padding: '3px 10px',
          fontSize: nearCashier ? 12 : 11,
          fontFamily: 'system-ui,sans-serif', fontWeight: 700,
          whiteSpace: 'nowrap', transition: 'all 0.2s',
          boxShadow: nearCashier ? '0 0 12px rgba(124,58,237,0.6)' : 'none',
        }}>
          {nearCashier ? (cartEmpty ? '🛒 Спочатку візьми товари!' : 'E — до кошика 🛒') : '👩‍💼 Касирша'}
        </div>
      </Html>
    </group>
  );
}

// ── Cash register on counter ───────────────────────────────────────────────
function CashRegister() {
  return (
    <group position={[-1.2, 1.15, -8]}>
      {/* base */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.6, 0.3, 0.5]} />
        <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* screen */}
      <mesh position={[0, 0.42, -0.1]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.5, 0.32, 0.05]} />
        <meshStandardMaterial color="#0f172a" emissive="#3b82f6" emissiveIntensity={0.6} />
      </mesh>
      {/* keys */}
      {[-0.15, 0, 0.15].map((x) =>
        [-0.06, 0.06].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.31, z + 0.08]}>
            <boxGeometry args={[0.08, 0.04, 0.07]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        ))
      )}
    </group>
  );
}

// ── Store environment ──────────────────────────────────────────────────────
function StoreEnv() {
  const floorTex = useMemo(() => makeTileTexture(), []);

  return (
    <>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[20, 22]} />
        <meshStandardMaterial map={floorTex} />
      </mesh>

      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4.5, 0]}>
        <planeGeometry args={[20, 22]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>

      {/* walls */}
      {[
        { p: [0, 2.2, -9.5], r: [0, 0, 0], s: [20, 4.5] },
        { p: [0, 2.2, 9.5], r: [0, Math.PI, 0], s: [20, 4.5] },
        { p: [-9.5, 2.2, 0], r: [0, Math.PI / 2, 0], s: [22, 4.5] },
        { p: [9.5, 2.2, 0], r: [0, -Math.PI / 2, 0], s: [22, 4.5] },
      ].map((w, i) => (
        <mesh key={i} position={w.p} rotation={w.r}>
          <planeGeometry args={w.s} />
          <meshStandardMaterial color="#f1f5f9" />
        </mesh>
      ))}

      {/* fluorescent lights */}
      {[-3.5, 0, 3.5].map((x) => (
        <mesh key={x} position={[x, 4.4, 0]}>
          <boxGeometry args={[0.22, 0.06, 9]} />
          <meshStandardMaterial color="#fff" emissive="#e0f2fe" emissiveIntensity={0.8} />
        </mesh>
      ))}

      {/* shelf rows */}
      {SHELF_Z.map((z) => <ShelfRow key={z} z={z} />)}

      {/* checkout counter */}
      <mesh position={[0, 0.55, -8]}>
        <boxGeometry args={[5, 1.1, 1.2]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.12, -8]}>
        <boxGeometry args={[5, 0.06, 1.2]} />
        <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.4} />
      </mesh>
      {/* counter dividers */}
      {[-2.2, 2.2].map((x) => (
        <mesh key={x} position={[x, 1.3, -8]}>
          <boxGeometry args={[0.06, 0.4, 1.2]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      ))}
      {/* conveyor belt on counter */}
      <mesh position={[0.6, 1.16, -8]}>
        <boxGeometry args={[2.2, 0.03, 0.9]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>

      {/* entrance mat */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 8.2]}>
        <planeGeometry args={[5, 1.6]} />
        <meshStandardMaterial color="#7c3aed" />
      </mesh>

      {/* aisle arrows on floor */}
      {[6, 2, -2, -6].map((z) => (
        <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, z]}>
          <planeGeometry args={[0.18, 1.8]} />
          <meshStandardMaterial color="#c7d2fe" opacity={0.7} transparent />
        </mesh>
      ))}
    </>
  );
}

// ── Player ─────────────────────────────────────────────────────────────────
function Player({ nearIdRef, onNearChange, productsWithPos, nearCashierRef, onNearCashierChange, gender, displayName }) {
  const bodyColor = gender === 'female' ? '#ec4899' : '#3b82f6';
  const legColor = gender === 'female' ? '#be185d' : '#1d4ed8';
  const hairColor = gender === 'female' ? '#f472b6' : '#92400e';
  const { camera } = useThree();
  const groupRef = useRef();
  const keys = useRef(new Set());
  const camPos = useRef(new THREE.Vector3(0, 12, 14));
  const stepT = useRef(0);

  useEffect(() => {
    const dn = (e) => keys.current.add(e.key.toLowerCase());
    const up = (e) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, []);

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    const pos = groupRef.current.position;
    const k = keys.current;

    let dx = 0, dz = 0;
    if (k.has('w') || k.has('arrowup')) dz -= 1;
    if (k.has('s') || k.has('arrowdown')) dz += 1;
    if (k.has('a') || k.has('arrowleft')) dx -= 1;
    if (k.has('d') || k.has('arrowright')) dx += 1;

    const moving = dx !== 0 || dz !== 0;
    if (moving) {
      const len = Math.sqrt(dx * dx + dz * dz);
      dx = (dx / len) * SPEED * dt;
      dz = (dz / len) * SPEED * dt;
      groupRef.current.rotation.y = Math.atan2(dx, dz) + Math.PI;
      stepT.current += dt * 8;
    }

    const nx = Math.max(-8.8, Math.min(8.8, pos.x + dx));
    const nz = Math.max(-8.8, Math.min(8.5, pos.z + dz));
    if (!blockedBy(nx, pos.z)) pos.x = nx;
    if (!blockedBy(pos.x, nz)) pos.z = nz;

    // leg animation
    const legSwing = moving ? Math.sin(stepT.current) * 0.25 : 0;
    if (groupRef.current.children[0]) groupRef.current.children[0].rotation.x = legSwing;
    if (groupRef.current.children[1]) groupRef.current.children[1].rotation.x = -legSwing;

    // camera follow
    camPos.current.lerp(new THREE.Vector3(pos.x, 11, pos.z + 5), dt * 5);
    camera.position.copy(camPos.current);
    camera.lookAt(pos.x, 0, pos.z);

    // nearest product
    let nearId = null, nearDist = INTERACT_R;
    productsWithPos.forEach((p) => {
      const d = Math.hypot(pos.x - p.wp[0], pos.z - p.wp[2]);
      if (d < nearDist) { nearDist = d; nearId = p.id; }
    });

    // cashier proximity (проверяем первой — имеет приоритет)
    const distCashier = Math.hypot(pos.x - CASHIER_POS[0], pos.z - CASHIER_POS[2]);
    const isNearCashier = distCashier < CASHIER_R;
    if (isNearCashier !== nearCashierRef.current) {
      nearCashierRef.current = isNearCashier;
      onNearCashierChange(isNearCashier);
    }

    // товар подсвечивается только если не у кассы
    const resolvedNearId = isNearCashier ? null : nearId;
    if (resolvedNearId !== nearIdRef.current) {
      nearIdRef.current = resolvedNearId;
      onNearChange(resolvedNearId);
    }
  });

  const t = stepT.current;

  return (
    <group ref={groupRef} position={[0, 0, 7]}>
      {/* left leg */}
      <mesh position={[-0.13, 0.28, 0]}>
        <boxGeometry args={[0.18, 0.56, 0.18]} />
        <meshStandardMaterial color={legColor} />
      </mesh>
      {/* right leg */}
      <mesh position={[0.13, 0.28, 0]}>
        <boxGeometry args={[0.18, 0.56, 0.18]} />
        <meshStandardMaterial color={legColor} />
      </mesh>
      {/* body */}
      <mesh position={[0, 0.78, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.3]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      {/* left arm */}
      <mesh position={[-0.36, 0.78, 0]}>
        <boxGeometry args={[0.18, 0.44, 0.18]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      {/* right arm */}
      <mesh position={[0.36, 0.78, 0]}>
        <boxGeometry args={[0.18, 0.44, 0.18]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      {/* head */}
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[0.44, 0.44, 0.44]} />
        <meshStandardMaterial color="#fde68a" />
      </mesh>
      {/* hair top */}
      <mesh position={[0, 1.5, 0.04]}>
        <boxGeometry args={[0.46, 0.12, 0.48]} />
        <meshStandardMaterial color={hairColor} />
      </mesh>
      {/* female: long hair behind */}
      {gender === 'female' && (
        <mesh position={[0, 1.2, 0.26]}>
          <boxGeometry args={[0.44, 0.52, 0.06]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>
      )}
      {/* eyes */}
      <mesh position={[-0.1, 1.27, -0.23]}>
        <boxGeometry args={[0.08, 0.08, 0.02]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.1, 1.27, -0.23]}>
        <boxGeometry args={[0.08, 0.08, 0.02]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* name tag */}
      <Html position={[0, 1.85, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(15,23,42,0.75)', color: '#e2e8f0',
          borderRadius: 6, padding: '2px 7px', fontSize: 10,
          fontFamily: 'system-ui,sans-serif', fontWeight: 600,
          whiteSpace: 'nowrap', backdropFilter: 'blur(4px)',
        }}>
          {gender === 'female' ? '👧' : '👦'} {displayName}
        </div>
      </Html>
    </group>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function ShopScene3D() {
  const { products, cart, addToCart, progress, setScreen, coins, scanned, cartLimit, user } = useGameStore();
  const cartCount = cart.length;
  const cartFull = cartCount >= cartLimit;
  const cartEmpty = cartCount === 0;
  const [nearId, setNearId] = useState(null);
  const [nearCashier, setNearCashier] = useState(false);
  const nearIdRef = useRef(null);
  const nearCashierRef = useRef(false);
  const cartEmptyRef = useRef(cartEmpty);
  useEffect(() => { cartEmptyRef.current = cartEmpty; }, [cartEmpty]);

  // E / Space key → pick up product OR go to cashier
  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'e' && e.key !== 'E' && e.key !== ' ') return;
      if (nearCashierRef.current) {
        if (cartEmptyRef.current) return;
        setScreen('cart');
      } else if (nearIdRef.current) {
        addToCart(nearIdRef.current);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [addToCart, setScreen]);

  const MAX_PRODUCTS = SHELF_Z.length * 5;

  const productsWithPos = useMemo(() =>
    products.slice(0, MAX_PRODUCTS).map((p, i) => {
      const row = Math.floor(i / 5);
      const col = i % 5;
      const x = (col - 2) * 2.3;
      const z = SHELF_Z[row];
      return { ...p, wp: [x, 1.05, z - 0.05] };
    }),
    [products],
  );

  const interactableProducts = useMemo(
    () => productsWithPos.filter((p) => !scanned.includes(p.id)),
    [productsWithPos, scanned],
  );

  const handleNearChange = useCallback((id) => setNearId(id), []);
  const handleNearCashier = useCallback((v) => setNearCashier(v), []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 11, 14], fov: 55 }}
        gl={{ antialias: true }}
        style={{ background: '#e8edf2' }}
      >
        <ambientLight intensity={2.8} />
        <directionalLight position={[0, 10, 2]} intensity={1.2} />
        <pointLight position={[-5, 5, 5]} intensity={0.4} color="#fff" />
        <pointLight position={[5, 5, -5]} intensity={0.4} color="#fff" />

        <StoreEnv />

        {productsWithPos.map((p) => (
          <ShelfProduct
            key={p.id}
            product={p}
            position={p.wp}
            highlighted={nearId === p.id}
            done={progress[p.cardId]?.status === 'done'}
            inCart={!!cart.find((i) => i.productId === p.id)}
            cartFull={cartFull}
          />
        ))}

        <CashierNPC nearCashier={nearCashier} cartEmpty={cartEmpty} />
        <CashRegister />

        <Player
          nearIdRef={nearIdRef}
          onNearChange={handleNearChange}
          productsWithPos={interactableProducts}
          nearCashierRef={nearCashierRef}
          onNearCashierChange={handleNearCashier}
          gender={user?.gender ?? 'male'}
          displayName={user ? user.firstName : 'Гравець'}
        />
      </Canvas>

      {/* HUD */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 18px', pointerEvents: 'none',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
          border: '1px solid #e2e8f0', borderRadius: 12,
          padding: '7px 14px', color: '#1e293b',
          fontFamily: 'system-ui,sans-serif', fontSize: 15, fontWeight: 700,
        }}>
          🛒 Python Market
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
            border: '1px solid #e2e8f0', borderRadius: 12,
            padding: '7px 14px', color: '#92400e',
            fontFamily: 'system-ui,sans-serif', fontSize: 14, fontWeight: 600,
          }}>
            🪙 {coins}
          </div>
          {cartCount > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
              border: '1px solid #e2e8f0', borderRadius: 12,
              padding: '7px 14px', color: '#475569',
              fontFamily: 'system-ui,sans-serif', fontSize: 13,
            }}>
              🛒 {cartCount} — підійди до касирші
            </div>
          )}
        </div>
      </div>

      {/* controls hint */}
      <div style={{
        position: 'absolute', bottom: 18, left: 0, right: 0,
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(6px)',
          border: '1px solid #e2e8f0', borderRadius: 10,
          padding: '6px 16px', color: '#475569',
          fontFamily: 'system-ui,sans-serif', fontSize: 13,
        }}>
          WASD / ↑↓←→ — рух &nbsp;•&nbsp; E або Пробіл — взяти товар
        </div>
      </div>
    </div>
  );
}
