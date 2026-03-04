import { useState } from 'react';
import { motion } from 'framer-motion';
import { loginStudent } from '../../supabase/client';

const RE = /^\s*\w+\s*=\s*["'](.+)["']\s*$/;

function BoxCharacter({ gender }) {
  const body = gender === 'female' ? '#ec4899' : '#3b82f6';
  const legs = gender === 'female' ? '#be185d' : '#1d4ed8';
  const hair = gender === 'female' ? '#f472b6' : '#92400e';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, userSelect: 'none' }}>
      {/* hair */}
      <div style={{ width: 34, height: 8, background: hair, borderRadius: '6px 6px 0 0' }} />
      {/* head */}
      <div style={{ width: 34, height: 34, background: '#fbbf24', borderRadius: 6, border: '2px solid #d97706' }} />
      {/* body */}
      <div style={{ width: 30, height: 44, background: body, borderRadius: 4 }} />
      {/* legs */}
      <div style={{ display: 'flex', gap: 4 }}>
        <div style={{ width: 12, height: 28, background: legs, borderRadius: '0 0 4px 4px' }} />
        <div style={{ width: 12, height: 28, background: legs, borderRadius: '0 0 4px 4px' }} />
      </div>
    </div>
  );
}

export default function NameDialog({ onSubmit }) {
  const [value, setValue] = useState('');
  const [gender, setGender] = useState('male');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const match = value.match(RE);
    if (!match) { setError('Формат: name = "Твоє ім\'я"'); return; }
    const firstName = match[1].trim();
    if (!firstName) { setError("Ім'я не може бути порожнім"); return; }

    setLoading(true);
    try {
      const user = await loginStudent(firstName, '', gender);
      onSubmit(user);
    } catch {
      setError('Помилка підключення. Спробуй ще раз.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
      }}>
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        style={{
          background: '#1e293b',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: '32px 36px',
          width: 360,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          fontFamily: 'system-ui, sans-serif',
        }}>
        <BoxCharacter gender={gender} />

        {/* speech bubble */}
        <div
          style={{
            background: '#334155',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: '12px 16px',
            width: '100%',
            color: '#e2e8f0',
            fontSize: 14,
            lineHeight: 1.5,
            textAlign: 'center',
            position: 'relative',
          }}>
          Привіт! Напиши своє ім&apos;я у форматі Python як змінну:
          <br />
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError('');
            }}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: '#0f172a',
              border: `1px solid ${error ? '#f87171' : 'rgba(255,255,255,0.15)'}`,
              borderRadius: 10,
              padding: '10px 14px',
              color: '#86efac',
              fontFamily: 'monospace',
              fontSize: 15,
              outline: 'none',
            }}
          />
          {error && <p style={{ color: '#f87171', fontSize: 12, margin: 0 }}>{error}</p>}

          {/* gender toggle */}
          <div style={{ display: 'flex', gap: 8 }}>
            {['male', 'female'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                style={{
                  flex: 1,
                  padding: '7px 0',
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                  border: `1px solid ${gender === g ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
                  background: gender === g ? 'rgba(59,130,246,0.2)' : 'transparent',
                  color: gender === g ? '#93c5fd' : '#94a3b8',
                }}>
                {g === 'male' ? '🧑 Хлопець' : '👧 Дівчина'}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px 0',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              border: 'none',
              background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
              color: '#fff',
              opacity: loading ? 0.7 : 1,
            }}>
            {loading ? 'Завантаження...' : 'Увійти'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
