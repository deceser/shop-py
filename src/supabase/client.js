import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL ?? '';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const supabase = url && key ? createClient(url, key) : null;

const USER_KEY = 'pythonmarket_user_id';

export function getSavedUserId() {
  return localStorage.getItem(USER_KEY);
}

export async function loginStudent(firstName, lastName, gender) {
  if (!supabase) {
    return { id: `local-${firstName}-${lastName}`, firstName, lastName, gender, coins: 0 };
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('first_name', firstName)
    .eq('last_name', lastName)
    .maybeSingle();

  if (existing) {
    localStorage.setItem(USER_KEY, existing.id);
    return {
      id: existing.id,
      firstName: existing.first_name,
      lastName: existing.last_name,
      gender: existing.gender,
      coins: existing.coins,
    };
  }

  const { data: created, error } = await supabase
    .from('profiles')
    .insert({ first_name: firstName, last_name: lastName, gender })
    .select()
    .single();

  if (error) throw error;
  localStorage.setItem(USER_KEY, created.id);
  return {
    id: created.id,
    firstName: created.first_name,
    lastName: created.last_name,
    gender: created.gender,
    coins: 0,
  };
}

export async function loadProfileById(id) {
  if (!supabase) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    gender: data.gender,
    coins: data.coins,
  };
}

export async function loadProgress(userId) {
  if (!supabase || userId.startsWith('local-')) return [];
  const { data } = await supabase.from('game_progress').select('*').eq('user_id', userId);
  return data ?? [];
}

export async function updateCoins(userId, coins) {
  if (!supabase || userId.startsWith('local-')) return;
  await supabase.from('profiles').update({ coins }).eq('id', userId);
}

export async function saveAttempt({ userId, cardId, answerText, isCorrect, score, durationMs }) {
  if (!supabase || userId.startsWith('local-')) return;
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
  if (!supabase || userId.startsWith('local-')) return;
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
    { user_id: userId, card_id: cardId, status, best_score: bestScore, best_time_ms: bestTime, updated_at: now },
    { onConflict: 'user_id,card_id' },
  );
}
