// NASTY — /api/huggingface
const MODELS = {
  'image-classification': 'https://api-inference.huggingface.co/models/google/vit-base-patch16-224'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { task = 'image-classification', payload } = req.body;
    const modelUrl = MODELS[task] || MODELS['image-classification'];

    let body, headers = { 'Authorization': `Bearer ${process.env.HF_API_KEY}` };

    if (payload?.image?.startsWith('http')) {
      const imgRes = await fetch(payload.image);
      body = Buffer.from(await imgRes.arrayBuffer());
    } else if (payload?.image) {
      body = Buffer.from(payload.image, 'base64');
    } else {
      body = JSON.stringify(payload);
      headers['Content-Type'] = 'application/json';
    }

    const hfRes = await fetch(modelUrl, { method: 'POST', headers, body });
    if (hfRes.status === 503) return res.status(200).json([{ label: 'Loading', score: 0 }]);
    if (!hfRes.ok) return res.status(502).json({ error: 'HF API error' });

    const data = await hfRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Internal error', detail: err.message });
  }
}
