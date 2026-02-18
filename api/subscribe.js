export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.garantiasembarreiras.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const apiKey = process.env.BREVO_API_KEY;
  const headers = {
    'accept': 'application/json',
    'content-type': 'application/json',
    'api-key': apiKey
  };

  try {
    // 1. Add contact to list
    const contactRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, listIds: [3], updateEnabled: true })
    });

    // 2. Send welcome email with report (template ID 1)
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sender: { name: 'Ana Fonseca — GSB', email: 'ana.fonseca@garantiasembarreiras.com' },
        to: [{ email }],
        templateId: 1
      })
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
