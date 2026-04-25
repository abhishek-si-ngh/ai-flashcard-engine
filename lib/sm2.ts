export interface CardSM2State {
  repetitions: number;
  easeFactor: number;
  interval: number;
  nextReviewAt: Date;
  totalReviews: number;
  correctCount: number;
}

// Quality: 0=Forgot, 1=Hard, 2=Good, 3=Easy  (mapped to SM-2 0,3,4,5)
const QUALITY_MAP: Record<number, number> = { 0: 0, 1: 3, 2: 4, 3: 5 };

export function computeSM2(
  state: CardSM2State,
  rating: number // 0-3 from UI
): CardSM2State {
  const q = QUALITY_MAP[rating] ?? 0;

  const { repetitions, easeFactor, interval } = state;

  // Update ease factor
  const newEF = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
  );

  let newRepetitions: number;
  let newInterval: number;

  if (q < 3) {
    // Failed — reset
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Passed
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEF);
    }
    newRepetitions = repetitions + 1;
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

  return {
    repetitions: newRepetitions,
    easeFactor: newEF,
    interval: newInterval,
    nextReviewAt,
    totalReviews: state.totalReviews + 1,
    correctCount: state.correctCount + (q >= 3 ? 1 : 0),
  };
}

export function getCardStatus(
  state: Pick<CardSM2State, "repetitions" | "interval" | "nextReviewAt">
): "new" | "learning" | "review" | "mastered" {
  const now = new Date();
  if (state.repetitions === 0) return "new";
  if (state.interval >= 21) return "mastered";
  if (state.nextReviewAt > now) return "review";
  return "learning";
}

export function isDue(nextReviewAt: Date): boolean {
  return new Date() >= nextReviewAt;
}
