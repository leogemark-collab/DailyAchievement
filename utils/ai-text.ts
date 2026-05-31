const COMPLETE_SENTENCE_PATTERN = /[.!?]["')\]]*$/;
const COMPLETE_QUESTION_PATTERN = /\?["')\]]*$/;

export const isCompleteSentence = (text?: string) => {
  const trimmed = text?.trim() ?? '';
  return trimmed.length > 0 && COMPLETE_SENTENCE_PATTERN.test(trimmed);
};

export const isCompleteQuestion = (text?: string) => {
  const trimmed = text?.trim() ?? '';
  return trimmed.length > 0 && COMPLETE_QUESTION_PATTERN.test(trimmed);
};

export const trimToCompleteSentence = (text: string | undefined, fallback: string) => {
  const trimmed = text?.trim() ?? '';
  if (!trimmed) return fallback;
  if (isCompleteSentence(trimmed)) return trimmed;

  const lastEnding = Math.max(
    trimmed.lastIndexOf('.'),
    trimmed.lastIndexOf('!'),
    trimmed.lastIndexOf('?')
  );

  if (lastEnding >= 40) {
    return trimmed.slice(0, lastEnding + 1).trim();
  }

  return fallback;
};
