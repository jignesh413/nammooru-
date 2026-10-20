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

  let apiKey = process.env.GEMINI_API_KEY || process.env.geminiApiKey || process.env.GEMINI_KEY;

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

  if (apiKey) {
    apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
  }

  if (!apiKey) {
    console.error('FATAL: GEMINI_API_KEY is not defined in environment variables.');
    return res.status(500).json({ error: 'no_api_key', message: 'Server misconfiguration: GEMINI_API_KEY environment variable is missing.' });
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

  // Grounding prompt with 3 to 5 realistic, natural, situation-specific conversation starters
  const prompt = `
You are the visual recognition and Kannada linguistic engine for the Nammooru app in Bengaluru.
Analyze this image frame and accurately identify the primary real-world object.

RULES:
1. Identify the most prominent real-world object in the frame (e.g. Spectacles, Laptop, Mobile Phone, Water Bottle, Filter Coffee Tumbler, Auto Rickshaw, Watch, Book, Pen, Key, Bag, Cup, Plant, Chair, Shoes). Even if lighting is dim or tilted, deduce the exact object. Never return "unknown".
2. Generate 3 to 5 UNIQUE, REALISTIC, natural conversational phrases specifically tailored to how this exact item is used or talked about in daily life in Bengaluru.
   - Do NOT use repetitive formulas like "Where can I get {item}?" or "Give me one {item}" for every object.
   - For Spectacles (ಕನ್ನಡಕ): talk about finding glasses, spectacle frames, eye test, keeping glass clean.
   - For Speaker (ಸ್ಪೀಕರ್): talk about sound volume, bluetooth connection, favourite song.
   - For Laptop / Computer (ಲ್ಯಾಪ್ಟಾಪ್): talk about charger, battery, working on project.
   - For Water Bottle (ನೀರಿನ ಬಾಟಲ್): talk about cold water, refill, carrying water.
   - For Coffee / Tea (ಕಾಫಿ / ಚಹಾ): talk about hot filter coffee, less sugar, morning freshness.
   - For Auto / Bus: talk about meter, destination, traffic, fare.
3. Return ONLY a valid JSON object matching this schema with NO markdown fences, NO backticks:
{
  "english": "Concise English name (e.g. Spectacles, Filter Coffee, Laptop)",
  "kannada": "Authentic Kannada script Unicode (e.g. ಕನ್ನಡಕ, ಫಿಲ್ಟರ್ ಕಾಫಿ, ಲ್ಯಾಪ್ಟಾಪ್)",
  "transliteration": "Phonetic Roman pronunciation (e.g. Kannadaka, Filter Kaapi, Laptop)",
  "category": "Daily Object | Daily Food | Transport | Nature | City Life",
  "cp": 450,
  "conversation_starters": [
    {
      "kannada": "First authentic natural Kannada sentence specific to this item",
      "pronunciation": "Phonetic Roman transliteration",
      "english": "Natural English translation"
    },
    {
      "kannada": "Second natural phrase specific to this item",
      "pronunciation": "Phonetic Roman transliteration",
      "english": "Natural English translation"
    },
    {
      "kannada": "Third natural phrase specific to this item",
      "pronunciation": "Phonetic Roman transliteration",
      "english": "Natural English translation"
    }
  ]
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

  // Primary model fallback chain with active Google AI Studio models
  const candidateModels = [
    'gemini-3.1-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
    'gemini-flash-latest'
  ];
  let lastError = null;

  for (const model of candidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 16000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        console.warn(`Gemini [${model}] responded with HTTP ${response.status}:`, data.error?.message);
        lastError = data.error?.message || `Upstream status ${response.status}`;
        continue;
      }

      const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidateText) {
        console.warn(`[${model}] Returned empty payload`);
        continue;
      }

      let parsed = null;
      const cleanJson = candidateText.replace(/```json/gi, '').replace(/```/g, '').trim();
      try {
        parsed = JSON.parse(cleanJson);
      } catch (parseErr) {
        const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch (innerErr) {
            // failed
          }
        }
      }

      if (!parsed || typeof parsed !== 'object') {
        console.warn(`[${model}] Could not parse JSON from output:`, candidateText.slice(0, 100));
        continue;
      }

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
      console.warn(`API Handler [${model}] Exception:`, err.message);
      lastError = err.message;
    }
  }

  // Graceful fallback with authentic context
  return res.status(200).json({
    english: "Bengaluru Discovery",
    kannada: "ನಮ್ಮೂರು ಅನ್ವೇಷಣೆ",
    transliteration: "Nammooru Anveshane",
    pronunciation: "Nammooru Anveshane",
    category: "City Life",
    cp: 450,
    conversation_starters: [
      {
        kannada: "ಇದು ನಮ್ಮ ಬೆಂಗಳೂರಿನ ವಿಶೇಷ ವಸ್ತು.",
        pronunciation: "Idu namma Bengalurina vishesha vastu.",
        english: "This is a special everyday item in our Bengaluru."
      },
      {
        kannada: "ಇದನ್ನು ಪ್ರತಿದಿನ ನಾವು ಬಳಸುತ್ತೇವೆ.",
        pronunciation: "Idannu pratidina naavu balasutteve.",
        english: "We use this item every single day."
      },
      {
        kannada: "ನನಗೆ ಈ ವಸ್ತು ತುಂಬಾ ಇಷ್ಟವಾಯಿತು.",
        pronunciation: "Nanage ee vastu thumba ishtavaayitu.",
        english: "I really like this item."
      }
    ],
    note: lastError ? `AI status note: ${lastError}` : undefined
  });
}
