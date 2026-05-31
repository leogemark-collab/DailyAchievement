const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = 'gemini-2.5-flash';
const DEFAULT_MAX_OUTPUT_TOKENS = 2048;
const RETRY_MAX_OUTPUT_TOKENS = 3072;

type GeminiCandidate = {
  content?: {
    parts?: Array<{ text?: string }>;
  };
  finishReason?: string;
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
  error?: { message?: string };
};

type GenerateGeminiTextOptions = {
  maxOutputTokens?: number;
  temperature?: number;
};

const getGeminiApiKey = () => process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const getCandidateText = (candidate: GeminiCandidate | undefined) =>
  candidate?.content?.parts
    ?.map((part) => part.text?.trim() ?? '')
    .filter(Boolean)
    .join('\n')
    .trim() ?? '';

const hasCompleteEnding = (text: string) => /[.!?]["')\]]*$/.test(text.trim());

const buildRetryPrompt = (prompt: string) => `The previous answer was cut off or incomplete.
Rewrite the full answer from the beginning. Keep it concise, but make sure every sentence is complete and every requested labeled section is present.

Original request:
${prompt}`;

async function requestGeminiText(
  prompt: string,
  apiKey: string,
  options: Required<GenerateGeminiTextOptions>
) {
  const response = await fetch(`${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxOutputTokens,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed (${response.status}). ${errorText}`);
  }

  const data = (await response.json()) as GeminiResponse;
  const candidate = data.candidates?.[0];
  const text = getCandidateText(candidate);

  if (!text) {
    const fallbackMessage = data.error?.message ?? 'No response text returned by Gemini.';
    throw new Error(fallbackMessage);
  }

  return {
    finishReason: candidate?.finishReason,
    text,
  };
}

export async function generateGeminiText(prompt: string, options: GenerateGeminiTextOptions = {}) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      'Missing Gemini API key. Set EXPO_PUBLIC_GEMINI_API_KEY or app.json extra.geminiApiKey.'
    );
  }

  const requestOptions = {
    maxOutputTokens: options.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
    temperature: options.temperature ?? 0.55,
  };

  const firstAttempt = await requestGeminiText(prompt, apiKey, requestOptions);
  const shouldRetry =
    firstAttempt.finishReason === 'MAX_TOKENS' || !hasCompleteEnding(firstAttempt.text);

  if (!shouldRetry) {
    return firstAttempt.text;
  }

  const retryAttempt = await requestGeminiText(buildRetryPrompt(prompt), apiKey, {
    ...requestOptions,
    maxOutputTokens: Math.max(requestOptions.maxOutputTokens, RETRY_MAX_OUTPUT_TOKENS),
    temperature: Math.min(requestOptions.temperature, 0.45),
  });

  return retryAttempt.text || firstAttempt.text;
}
