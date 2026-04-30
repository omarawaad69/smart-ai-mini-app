// تخزين المحادثات (في الذاكرة المؤقتة)
const conversations = {};

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
    const userId = req.headers['x-user-id'] || 'default';

    if (!content) {
      return res.status(200).json({ status: 'success', response: 'من فضلك أرسل سؤالك.' });
    }

    // إنشاء محادثة للمستخدم إذا لم تكن موجودة
    if (!conversations[userId]) {
      conversations[userId] = [];
    }

    // إضافة رسالة المستخدم للمحادثة
    conversations[userId].push({
      role: 'user',
      parts: [{ text: content }]
    });

    // الاحتفاظ بآخر 10 رسائل فقط
    if (conversations[userId].length > 10) {
      conversations[userId] = conversations[userId].slice(-10);
    }

    // بناء السياق الكامل للمحادثة
    const fullContext = [
      {
        role: 'user',
        parts: [{ text: 'أنت مستشار ذكي. تذكر محادثتنا وأجب بشكل متصل.' }]
      },
      {
        role: 'model',
        parts: [{ text: 'حسناً، سأتذكر محادثتنا.' }]
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
      // إضافة رد البوت للمحادثة
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
