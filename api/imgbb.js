// NASTY — /api/imgbb
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { image, name } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    const form = new URLSearchParams();
    form.append('image', image);
    if (name) form.append('name', name);

    const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString()
    });

    const data = await imgbbRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Internal error', detail: err.message });
  }
}
