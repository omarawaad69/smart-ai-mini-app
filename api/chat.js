export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'غير مسموح' });
  }

  try {
    const { content } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!content) {
      return res.status(200).json({ status: 'success', response: 'من فضلك أرسل سؤالك أو ملفك.' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: content }] }]
        })
      }
    );

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (reply) {
      return res.status(200).json({ status: 'success', response: reply });
    } else {
      return res.status(200).json({ status: 'success', response: 'عذراً، لم أتمكن من معالجة طلبك. حاول مرة أخرى.' });
    }

  } catch (error) {
    return res.status(200).json({ status: 'success', response: 'عذراً، حدث خطأ مؤقت. حاول مرة أخرى.' });
  }
}
