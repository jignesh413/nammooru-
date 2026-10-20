import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let apiKey = process.env.GEMINI_API_KEY || process.env.geminiApiKey;

  // Local development fallback to .env.local or api-config.json
  if (!apiKey) {
    try {
      const envPath = path.join(process.cwd(), '.env.local');
      if (fs.existsSync(envPath)) {
        const raw = fs.readFileSync(envPath, 'utf8');
        const match = raw.match(/GEMINI_API_KEY=(.*)/);
        if (match && match[1]) apiKey = match[1].trim();
      }
    } catch (e) {
      // ignore
    }
  }

  if (!apiKey) {
    try {
      const cfgPath = path.join(process.cwd(), 'api-config.json');
      if (fs.existsSync(cfgPath)) {
        const raw = fs.readFileSync(cfgPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.geminiApiKey) apiKey = parsed.geminiApiKey.trim();
      }
    } catch (e) {
      // ignore
    }
  }

  if (!apiKey) {
    console.error('FATAL: GEMINI_API_KEY is not defined in environment variables.');
    return res.status(500).json({ error: 'Server misconfiguration: GEMINI_API_KEY is missing.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON body.' });
    }
  }

  let { imageBase64 } = body || {};
  if (!imageBase64) {
    return res.status(400).json({ error: 'No image payload provided.' });
  }

  // Strip data URL scheme prefix if present
  if (imageBase64.includes(',')) {
    imageBase64 = imageBase64.split(',')[1];
  }
  imageBase64 = imageBase64.trim();

  // Grounding prompt with few-shot Bengaluru cultural examples
  const prompt = `
You are the visual recognition and Kannada linguistic engine for the Nammooru app in Bengaluru.
Identify the primary object in the center reticle of this image.

KNOWLEDGE BASE & FEW-SHOT TARGET EXAMPLES:
- Cup / mug / steel tumbler -> english: "Filter Coffee", kannada: "ಕಾಫಿ", transliteration: "Kaapi", category: "Daily Food"
- Three-wheeler auto -> english: "Auto Rickshaw", kannada: "ಆಟೋ", transliteration: "Auto", category: "Transport"
- Tree / foliage -> english: "Tree", kannada: "ಮರ", transliteration: "Mara", category: "Nature"
- Water bottle / glass -> english: "Water Bottle", kannada: "ನೀರು", transliteration: "Neeru", category: "Daily Object"
- Footwear -> english: "Chappal / Shoes", kannada: "ಚಪ್ಪಲಿ", transliteration: "Chappali", category: "Daily Object"
- Book / notebook -> english: "Book", kannada: "ಪುಸ್ತಕ", transliteration: "Pusthaka", category: "Daily Object"

STRICT OUTPUT RULES:
1. Identify the most prominent item in the frame. Even if lighting is dim or blurred, infer the closest real-world object. Never return "unknown" or decline to answer.
2. Return ONLY a valid JSON object matching this exact schema with NO markdown fences, NO backticks, and NO conversational filler:
{
  "english": "Concise English name",
  "kannada": "Authentic Kannada script (Unicode)",
  "transliteration": "Phonetic Roman pronunciation",
  "category": "Daily Food | Transport | Nature | Daily Object | City Life",
  "cp": 450
}
`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: imageBase64
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json"
    }
  };

  // Primary model as specified: gemini-1.5-flash with fallback to gemini-flash-latest
  const candidateModels = ['gemini-1.5-flash', 'gemini-flash-latest'];
  let lastError = null;

  for (const model of candidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`Google Gemini API [${model}] Error:`, JSON.stringify(data));
        lastError = data.error?.message || `Upstream status ${response.status}`;
        continue;
      }

      const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidateText) {
        console.warn(`[${model}] Returned empty payload`);
        continue;
      }

      // Sanitize any stray backticks or whitespace
      const cleanJson = candidateText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      // Normalize fields
      if (!parsed.transliteration && parsed.pronunciation) {
        parsed.transliteration = parsed.pronunciation;
      }
      if (!parsed.pronunciation && parsed.transliteration) {
        parsed.pronunciation = parsed.transliteration;
      }
      if (typeof parsed.cp !== 'number') {
        parsed.cp = 450;
      }
      if (!parsed.category) {
        parsed.category = 'Daily Object';
      }

      return res.status(200).json(parsed);
    } catch (err) {
      console.error(`API Handler [${model}] Exception:`, err);
      lastError = err.message;
    }
  }

  // Graceful fallback to prevent user blockage
  return res.status(200).json({
    english: "Bengaluru Discovery",
    kannada: "ನಮ್ಮೂರು ಅನ್ವೇಷಣೆ",
    transliteration: "Nammooru Anveshane",
    pronunciation: "Nammooru Anveshane",
    category: "City Life",
    cp: 450,
    note: lastError ? `AI fallback: ${lastError}` : undefined
  });
}
