export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { content, type } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    let prompt = content || '';
    
    if (type === 'analyze_image' && req.body.imageData) {
      prompt = `حلل هذه الصورة: ${content || 'قدم وصفاً تفصيلياً للصورة'}`;
    } else if (type === 'analyze_document') {
      prompt = `حلل هذا المستند وقدم ملخصاً لمحتواه:\n\n${content}`;
    } else if (type === 'convert_file') {
      const targetFormat = req.body.targetFormat || 'pdf';
      prompt = `حوّل المحتوى التالي إلى تنسيق ${targetFormat}:\n\n${content}`;
    } else if (type === 'create_excel') {
      prompt = `حوّل البيانات التالية إلى تنسيق JSON منظم لملف Excel:\n\n${content}\n\nأعد JSON فقط بالشكل: {"columns": [...], "rows": [[...]]}`;
    }
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: {
            parts: [{ text: "أنت مستشار الذكاء الاصطناعي الخارق. أجب بدقة واحترافية. ابدأ الإجابة مباشرة بدون مقدمات. للقوائم استخدم '- '. للكود استخدم ```." }]
          }
        })
      }
    );

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'عذراً، لم أتمكن من الإجابة.';

    return res.status(200).json({
      status: 'success',
      response: reply
    });

  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'حدث خطأ في الخادم'
    });
  }
}
