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

  // Support both pre-parsed JSON bodies and raw string bodies
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  const imageBase64 = body?.imageBase64;
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
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server' });
  }

  if (!imageBase64) {
    return res.status(400).json({ error: 'No image data provided' });
  }

  const prompt = `
    You are an expert cultural guide and Kannada linguist for the Nammooru app in Bengaluru.
    Analyze the primary real-world object in the center of this image frame.
    
    Return ONLY a valid, raw JSON object (with NO Markdown formatting, NO backticks, and NO extra text) matching this schema:
    {
      "english": "Concise English name (e.g. Filter Coffee Tumbler, Auto Rickshaw, Gulmohar Flower)",
      "kannada": "Accurate Kannada script (e.g. ಫಿಲ್ಟರ್ ಕಾಫಿ ಲೋಟ, ಆಟೋ ರಿಕ್ಷಾ, ಗುಲ್ಮೊಹರ್ ಹೂವು)",
      "transliteration": "Phonetic Roman pronunciation (e.g. Filter Kaapi Lota, Auto Riksha)",
      "category": "One of: Daily Food, Transport, Daily Object, Nature, City Landmark",
      "cp": 450,
      "conversation_starters": [
        {
          "kannada": "First natural Kannada sentence using this object",
          "pronunciation": "English transliteration of the sentence",
          "english": "English translation"
        },
        {
          "kannada": "Second useful colloquial phrase for life in Bengaluru",
          "pronunciation": "English transliteration of the sentence",
          "english": "English translation"
        }
      ]
    }
    
    Note: 'cp' should be an integer between 250 and 850 reflecting rarity or vocabulary level.
  `;

  // Model fallback chain: Primary gemini-1.5-flash as specified, followed by gemini-flash-latest and gemini-2.0-flash
  const models = ['gemini-1.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash'];
  let lastError = null;

  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: imageBase64
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 500
          }
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.warn(`Gemini API [${model}] status ${response.status}:`, errBody);
        lastError = `Upstream ${response.status}: ${errBody}`;
        continue;
      }

      const data = await response.json();
      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidateText) {
        console.warn(`[${model}] Empty response text`);
        continue;
      }

      const cleanJsonText = candidateText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJsonText);

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
      console.warn(`[${model}] fetch exception:`, err.message);
      lastError = err.message;
    }
  }

  // Graceful fallback to prevent frontend crash
  return res.status(200).json({
    english: "Bengaluru Discovery",
    kannada: "ನಮ್ಮೂರು ಅನ್ವೇಷಣೆ",
    transliteration: "Nammooru Anveshane",
    pronunciation: "Nammooru Anveshane",
    category: "City Landmark",
    cp: 450,
    conversation_starters: [
      {
        kannada: "ಇದು ಎಷ್ಟು ರೂಪಾಯಿ?",
        pronunciation: "Idu eshtu roopaayi?",
        english: "How many rupees is this?"
      },
      {
        kannada: "ಇದು ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ.",
        pronunciation: "Idu thumba chennaagide.",
        english: "This is very nice."
      }
    ]
  });
}
