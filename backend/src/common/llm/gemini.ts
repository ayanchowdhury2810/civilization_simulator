import { env } from "../../config/env.js";

export function isLlmConfigured(): boolean {
  return env.GEMINI_API_KEY.trim().length > 0;
}

interface GeminiPart {
  text?: string;
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiPart[];
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: { message?: string };
}

export async function generateText(
  system: string,
  user: string,
): Promise<string> {
  const apiKey = env.GEMINI_API_KEY.trim();
  if (!apiKey) throw new Error("LLM is not configured (GEMINI_API_KEY missing)");

  const model = env.LLM_MODEL.replace(/^models\//, "");
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}` +
    `:generateContent?key=${encodeURIComponent(apiKey)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.LLM_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `LLM request failed (${response.status}): ${detail.slice(0, 200)}`,
      );
    }

    const data = (await response.json()) as GeminiResponse;
    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("") ?? "";

    if (!text.trim()) {
      throw new Error(
        data.error?.message ?? "LLM returned an empty response",
      );
    }
    return text.trim();
  } finally {
    clearTimeout(timer);
  }
}
