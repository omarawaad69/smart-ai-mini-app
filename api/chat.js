const conversations = {};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User-Id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'غير مسموح' });
  }

  try {
    const { content } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const userId = req.headers['x-user-id'] || 'default';

    if (!content) {
      return res.status(200).json({ status: 'success', response: 'من فضلك أرسل سؤالك.' });
    }

    if (!conversations[userId]) {
      conversations[userId] = [];
    }

    // ==== اكتشاف تغيير الموضوع ====
    const isNewTopic = await detectTopicChange(content, conversations[userId]);
    
    if (isNewTopic && conversations[userId].length > 0) {
      // بداية موضوع جديد - نحتفظ بآخر رسالتين فقط للسياق
      conversations[userId] = conversations[userId].slice(-2);
    }
    // ================================

    conversations[userId].push({
      role: 'user',
      parts: [{ text: content }]
    });

    if (conversations[userId].length > 15) {
      conversations[userId] = conversations[userId].slice(-15);
    }

    const fullContext = [
      {
        role: 'user',
        parts: [{ text: 'أنت مستشار ذكي. تذكر محادثتنا. إذا تغير الموضوع، ابدأ بداية جديدة. أجب بشكل متصل ومرتبط بسياق المحادثة.' }]
      },
      {
        role: 'model',
        parts: [{ text: 'حسناً، سأتذكر محادثتنا وسأفهم عندما يتغير الموضوع.' }]
      },
      ...conversations[userId]
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: fullContext
        })
      }
    );

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (reply) {
      conversations[userId].push({
        role: 'model',
        parts: [{ text: reply }]
      });

      return res.status(200).json({ status: 'success', response: reply });
    } else {
      return res.status(200).json({ status: 'success', response: 'عذراً، لم أتمكن من معالجة طلبك.' });
    }

  } catch (error) {
    return res.status(200).json({ status: 'success', response: 'عذراً، حدث خطأ مؤقت.' });
  }
}

// دالة اكتشاف تغيير الموضوع
async function detectTopicChange(newMessage, history) {
  if (history.length < 2) return false;
  
  // نحصل على آخر موضوع من المحادثة
  const lastMessages = history.slice(-4).map(m => m.parts?.[0]?.text || '').join(' ');
  
  // نطلب من Gemini تحديد ما إذا كان الموضوع تغير
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `هل هذا السؤال الجديد مرتبط بنفس موضوع المحادثة السابقة؟ أجب بـ "نعم" أو "لا" فقط.\n\nالمحادثة السابقة: ${lastMessages}\n\nالسؤال الجديد: ${newMessage}`
            }]
          }]
        })
      }
    );
    
    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    
    return answer.includes('لا');
  } catch (error) {
    return false;
  }
}
