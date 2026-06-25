/* ===== Gemini API 呼び出し (AIレポート・アドバイス用) ===== */

const GEMINI_URL = key =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

async function callGeminiText(prompt) {
  if (!apiKey) throw new Error('APIキーが未設定です');

  const res = await fetch(GEMINI_URL(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);

  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
