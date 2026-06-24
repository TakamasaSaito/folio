/* ===== Gemini API 呼び出し ===== */

const GEMINI_URL = key =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

async function callGeminiVision(base64, mimeType) {
  if (!apiKey) throw new Error('APIキーが設定されていません');

  const prompt =
    'この画像は証券会社や銀行アプリのスクリーンショットです。' +
    '以下の情報をJSONのみで回答してください（説明文・マークダウン不可）:\n' +
    '{"month":"YYYY-MM形式の年月（不明なら今月）","total":総資産の数値,' +
    '"categories":{"株式":株式金額,"投資信託":投信金額,"現金・預金":現金金額,"その他":その他金額},' +
    '"note":"証券会社名など"}\n金額が不明なカテゴリは0にしてください。';

  const res = await fetch(GEMINI_URL(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [
        { inline_data: { mime_type: mimeType, data: base64 } },
        { text: prompt },
      ]}],
      generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

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
