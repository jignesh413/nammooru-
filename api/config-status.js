module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  let configured = true;
  return res.status(200).json({
    configured: true,
    hasApiKey: !!(process.env.GEMINI_API_KEY || process.env.geminiApiKey)
  });
};
