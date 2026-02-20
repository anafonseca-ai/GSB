export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.garantiasembarreiras.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { nome, email, whatsapp, respostas, score, rota, timestamp } = req.body;
  if (!nome || !email) return res.status(400).json({ error: 'Nome e email obrigatórios' });

  const apiKey = process.env.BREVO_API_KEY;
  const headers = {
    'accept': 'application/json',
    'content-type': 'application/json',
    'api-key': apiKey
  };

  // Build email body
  const rotaLabel = rota === 'A' ? '🎯 QUALIFICADO — Agendar MD' :
                    rota === 'B' ? '📘 POTENCIAL — Direcionado ao GDZ' :
                                   '📋 NURTURING — Não qualificado';

  const respostasHTML = Object.entries(respostas || {}).map(([k, v]) =>
    `<tr><td style="padding:8px;border:1px solid #333;color:#b0aaa0">${k}</td><td style="padding:8px;border:1px solid #333;color:#f0ece4">${v}</td></tr>`
  ).join('');

  const htmlContent = `
    <div style="font-family:system-ui;background:#0a0a0a;color:#f0ece4;padding:32px;border-radius:12px;max-width:600px">
      <div style="border-bottom:2px solid #c4a265;padding-bottom:16px;margin-bottom:24px">
        <h1 style="color:#c4a265;font-size:20px;margin:0">Nova Qualificação — Mentoria GSB</h1>
        <p style="color:#787068;font-size:13px;margin:4px 0 0">${new Date(timestamp).toLocaleString('pt-BR')}</p>
      </div>
      <div style="background:#161616;padding:20px;border-radius:8px;border:1px solid rgba(196,162,101,.2);margin-bottom:20px">
        <h2 style="color:#c4a265;font-size:16px;margin:0 0 12px">${rotaLabel}</h2>
        <p style="margin:4px 0;font-size:15px"><strong>Score:</strong> <span style="color:#c4a265;font-size:20px">${score}/100</span></p>
        <p style="margin:4px 0"><strong>Nome:</strong> ${nome}</p>
        <p style="margin:4px 0"><strong>Email:</strong> ${email}</p>
        <p style="margin:4px 0"><strong>WhatsApp:</strong> ${whatsapp || 'Não informado'}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tr><th style="padding:8px;border:1px solid #333;color:#c4a265;text-align:left">Pergunta</th><th style="padding:8px;border:1px solid #333;color:#c4a265;text-align:left">Resposta</th></tr>
        ${respostasHTML}
      </table>
    </div>
  `;

  try {
    // Send notification email
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sender: { name: 'Quiz Mentoria GSB', email: 'ana.fonseca@garantiasembarreiras.com' },
        to: [{ email: 'ana.fonseca@garantiasembarreiras.com', name: 'Ana Fonseca' }],
        subject: `[${rota === 'A' ? '🎯 MD' : rota === 'B' ? '📘 GDZ' : '📋 LOW'}] ${nome} — Score ${score}`,
        htmlContent
      })
    });

    // Add to Brevo list (list 3) for future nurturing
    await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email,
        attributes: { NOME: nome, WHATSAPP: whatsapp || '', QUIZ_SCORE: score, QUIZ_ROTA: rota },
        listIds: [3],
        updateEnabled: true
      })
    });

    return res.status(200).json({ ok: true, rota });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
