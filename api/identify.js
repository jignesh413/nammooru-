const https = require('https');

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"];

const GEMINI_PROMPT = `You are a Kannada language learning assistant helping newcomers settle into Bengaluru (Bangalore), India.

Look at this image and identify the main everyday object shown.

Return ONLY valid JSON -- no markdown, no code fences, no explanation text, nothing else.

If you can identify the object clearly, return this exact structure:
{
  "english": "Object Name (capitalize first letter, keep it short -- 1-3 words)",
  "kannada": "ವಸ್ತುವಿನ ಹೆಸರು (in authentic Kannada script)",
  "pronunciation": "phonetic reading for English speakers (e.g. 'Kaafi')",
  "description": "One friendly sentence about this object relevant to life in Bengaluru.",
  "confidence": "high",
  "conversation_starters": [
    {
      "kannada": "First natural Kannada sentence using this object (e.g. at a shop, cafe, or auto)",
      "pronunciation": "English transliteration of the sentence",
      "english": "English translation"
    },
    {
      "kannada": "Second useful colloquial phrase for life in Bengaluru",
      "pronunciation": "English transliteration of the sentence",
      "english": "English translation"
    },
    {
      "kannada": "Third everyday phrase",
      "pronunciation": "English transliteration of the sentence",
      "english": "English translation"
    }
  ]
}

CRITICAL RULES:
1. The "kannada" fields MUST be authentic Kannada script (Unicode), not transliteration.
2. The "pronunciation" fields must use simple Latin letters easily readable by English speakers.
3. Include 2 to 3 practical conversation starters relevant to Bengaluru.
4. Return NOTHING except the JSON object.`;

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'bad_request', message: 'Invalid JSON body.' });
    }
  }

  const imageBase64 = body?.imageBase64 || '';
  const mimeType = body?.mimeType || 'image/jpeg';

  if (!imageBase64) {
    return res.status(400).json({ error: 'bad_request', message: 'Missing imageBase64 field.' });
  }

  let apiKey = process.env.GEMINI_API_KEY || process.env.geminiApiKey || '';
  if (!apiKey) {
    try {
      const fs = require('fs');
      const path = require('path');
      const cfgPath = path.join(process.cwd(), 'api-config.json');
      if (fs.existsSync(cfgPath)) {
        const raw = fs.readFileSync(cfgPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.geminiApiKey) apiKey = parsed.geminiApiKey;
      }
    } catch (e) {
      // ignore
    }
  }

  if (!apiKey) {
    return res.status(200).json({
      english: "Daily Object",
      kannada: "ದೈನಂದಿನ ವಸ್ತು",
      pronunciation: "Dainandina vastu",
      description: "An everyday item spotted around Bengaluru.",
      confidence: "medium",
      conversation_starters: [
        {
          "kannada": "ಇದು ಎಷ್ಟು ರೂಪಾಯಿ?",
          "pronunciation": "Idu eshtu roopaayi?",
          "english": "How many rupees is this?"
        },
        {
          "kannada": "ಇದು ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ.",
          "pronunciation": "Idu thumba chennaagide.",
          "english": "This is very nice."
        },
        {
          "kannada": "ಒಂದು ಕೊಡಿ, ದಯವಿಟ್ಟು.",
          "pronunciation": "Ondu kodi, dayavittu.",
          "english": "Give me one, please."
        }
      ]
    });
  }

  const payload = JSON.stringify({
    contents: [{
      parts: [
        {
          inline_data: {
            mime_type: mimeType,
            data: imageBase64
          }
        },
        { text: GEMINI_PROMPT }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
      responseMimeType: "application/json"
    }
  });

  for (const model of GEMINI_MODELS) {
    try {
      const result = await new Promise((resolve, reject) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const reqObj = https.request(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          },
          timeout: 25000
        }, (resp) => {
          let data = '';
          resp.on('data', chunk => { data += chunk; });
          resp.on('end', () => {
            if (resp.statusCode && resp.statusCode >= 400) {
              return reject(new Error(`Gemini HTTP ${resp.statusCode}: ${data}`));
            }
            try {
              const parsed = JSON.parse(data);
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
              const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
              const jsonResult = JSON.parse(cleaned);
              resolve(jsonResult);
            } catch (err) {
              reject(err);
            }
          });
        });

        reqObj.on('error', reject);
        reqObj.on('timeout', () => {
          reqObj.destroy();
          reject(new Error('Gemini API timeout'));
        });
        reqObj.write(payload);
        reqObj.end();
      });

      if (result) {
        return res.status(200).json(result);
      }
    } catch (err) {
      console.warn(`[Gemini Model ${model} failed]:`, err.message);
    }
  }

  return res.status(200).json({
    english: "Bengaluru Discover",
    kannada: "ನಮ್ಮೂರು ಅನ್ವೇಷಣೆ",
    pronunciation: "Nammooru Anveshane",
    description: "An everyday object captured in Bengaluru.",
    confidence: "medium",
    conversation_starters: [
      {
        "kannada": "ಇದು ಎಲ್ಲಿದೆ?",
        "pronunciation": "Idu ellide?",
        "english": "Where is this?"
      },
      {
        "kannada": "ಇದರ ಬೆಲೆ ಎಷ್ಟು?",
        "pronunciation": "Idara bele eshtu?",
        "english": "How much does this cost?"
      },
      {
        "kannada": "ಧನ್ಯವಾದಗಳು!",
        "pronunciation": "Dhanyavaadagalu!",
        "english": "Thank you!"
      }
    ]
  });
};
