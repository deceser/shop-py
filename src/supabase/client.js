import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL ?? '';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const supabase = url && key ? createClient(url, key) : null;

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signInAnonymously() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) console.error('Auth error:', error.message);
  return data?.user ?? null;
}

export async function ensureProfile(userId, username) {
  if (!supabase) return;
  await supabase
    .from('profiles')
    .upsert({ id: userId, username }, { onConflict: 'id', ignoreDuplicates: true });
}

export async function loadProgress(userId) {
  if (!supabase) return [];
  const { data } = await supabase
    .from('game_progress')
    .select('*')
    .eq('user_id', userId);
  return data ?? [];
}

export async function saveAttempt({ userId, cardId, answerText, isCorrect, score, durationMs }) {
  if (!supabase) return;
  await supabase.from('attempts').insert({
    user_id: userId,
    card_id: cardId,
    answer_text: answerText,
    is_correct: isCorrect,
    score,
    duration_ms: durationMs,
  });
}

export async function upsertProgress({ userId, cardId, status, score, durationMs }) {
  if (!supabase) return;
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from('game_progress')
    .select('best_score, best_time_ms')
    .eq('user_id', userId)
    .eq('card_id', cardId)
    .maybeSingle();

  const bestScore = Math.max(score, existing?.best_score ?? 0);
  const bestTime = existing?.best_time_ms
    ? Math.min(durationMs, existing.best_time_ms)
    : durationMs;

  await supabase.from('game_progress').upsert(
    {
      user_id: userId,
      card_id: cardId,
      status,
      best_score: bestScore,
      best_time_ms: bestTime,
      updated_at: now,
    },
    { onConflict: 'user_id,card_id' },
  );
}
