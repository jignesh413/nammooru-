module.exports = async function handler(req, res) {
  const text = req.query.text || '';
  if (!text) {
    return res.status(400).json({ error: 'Text query parameter is required.' });
  }

  const encoded = encodeURIComponent(text.slice(0, 250));
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=kn&client=tw-ob`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch TTS audio' });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).send(buffer);
  } catch (err) {
    return res.status(502).json({ error: 'TTS service unavailable', details: err.message });
  }
}
