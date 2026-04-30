export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { content, type, imageData } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ status: 'error', message: 'مفتاح API غير موجود في الخادم' });
    }
    
    let parts = [{ text: content || 'مرحباً' }];
    
    if (type === 'analyze_image' && imageData) {
      parts = [
        { text: 'حلل هذه الصورة بالتفصيل. صف ما تراه.' },
        { inline_data: { mime_type: 'image/jpeg', data: imageData } }
      ];
    }
    
    const requestBody = {
      contents: [{ parts }],
      systemInstruction: {
        parts: [{ text: "أنت مستشار الذكاء الاصطناعي الخارق. أجب بدقة واحترافية. ابدأ مباشرة بدون مقدمات." }]
      }
    };
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    const data = await response.json();
    
    if (data.error) {
      console.error('Gemini API Error:', data.error);
      return res.status(500).json({ status: 'error', message: data.error.message || 'خطأ من Gemini' });
    }
    
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return res.status(500).json({ status: 'error', message: 'لم يتم استلام رد من Gemini' });
    }

    return res.status(200).json({ status: 'success', response: reply });
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ status: 'error', message: 'حدث خطأ غير متوقع في الخادم' });
  }
}
