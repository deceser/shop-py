export function evaluateCard(card, answer) {
  switch (card.type) {
    case 'mcq':
      return Number(answer) === card.answerIndex;

    case 'output': {
      const normalize = (s) => s.trim().replace(/\r\n/g, '\n');
      return normalize(answer) === normalize(card.answer);
    }

    case 'text': {
      const lower = answer.toLowerCase();
      const hits = card.keywordsAny.filter((kw) => lower.includes(kw.toLowerCase())).length;
      return hits >= card.minHits;
    }

    case 'code':
      return card.mustMatch.every((re) => re.test(answer));

    default:
      return false;
  }
}

export function calcScore(card, durationMs, attempts) {
  const base = { text: 30, output: 20, mcq: 15, code: 40 }[card.type] ?? 20;
  const timePenalty = Math.floor(durationMs / 10000);
  const attemptPenalty = (attempts - 1) * 5;
  return Math.max(5, base - timePenalty - attemptPenalty);
}
