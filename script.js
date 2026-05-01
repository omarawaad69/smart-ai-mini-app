const API_URL = '/api/chat';
const USER_ID = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

let pendingImage = null; // تخزين الصورة المختارة مؤقتاً

function addMessage(text, sender) {
    const chatArea = document.getElementById('chatArea');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    messageDiv.appendChild(contentDiv);
    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('userInput');
    const text = input.value.trim();

    // إذا كانت هناك صورة معلقة، أرسلها مع النص (أو بدونه)
    if (pendingImage) {
        const caption = text || 'حلل هذه الصورة';
        addMessage(`🖼️ ${caption}`, 'user');
        input.value = '';

        const chatArea = document.getElementById('chatArea');
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message bot-message';
        loadingDiv.id = 'loadingMessage';
        loadingDiv.innerHTML = '<div class="message-content">⏳ جاري تحليل الصورة...</div>';
        chatArea.appendChild(loadingDiv);
        chatArea.scrollTop = chatArea.scrollHeight;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': USER_ID
                },
                body: JSON.stringify({
                    content: caption,
                    imageData: pendingImage
                })
            });

            const data = await response.json();
            const loading = document.getElementById('loadingMessage');
            if (loading) loading.remove();

            if (data.response) {
                addMessage(data.response, 'bot');
            } else {
                addMessage('عذراً، لم أتمكن من تحليل الصورة.', 'bot');
            }
        } catch (error) {
            const loading = document.getElementById('loadingMessage');
            if (loading) loading.remove();
            addMessage('❌ تعذر الاتصال بالخادم', 'bot');
        }

        pendingImage = null; // حذف الصورة بعد الإرسال
        return;
    }

    // إذا لم تكن هناك صورة، أرسل النص كالمعتاد
    if (!text) return;
    addMessage(text, 'user');
    input.value = '';

    const chatArea = document.getElementById('chatArea');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message bot-message';
    loadingDiv.id = 'loadingMessage';
    loadingDiv.innerHTML = '<div class="message-content">⏳ جاري المعالجة...</div>';
    chatArea.appendChild(loadingDiv);
    chatArea.scrollTop = chatArea.scrollHeight;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': USER_ID
            },
            body: JSON.stringify({ content: text })
        });

        const data = await response.json();
        const loading = document.getElementById('loadingMessage');
        if (loading) loading.remove();

        if (data.response) {
            addMessage(data.response, 'bot');
        } else {
            addMessage('عذراً، لم أتمكن من معالجة طلبك.', 'bot');
        }
    } catch (error) {
        const loading = document.getElementById('loadingMessage');
        if (loading) loading.remove();
        addMessage('❌ تعذر الاتصال بالخادم', 'bot');
    }
}

// عند الضغط على زر "تحليل صورة"
function handleImageUpload() {
    const file = document.getElementById('imageInput').files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        // تخزين بيانات الصورة (base64)
        pendingImage = e.target.result.split(',')[1];
        addMessage(`🖼️ تم اختيار: ${file.name}`, 'user');
        addMessage('✏️ اكتب تعليقك (مثلاً: "ترجم النص في الصورة إلى الإنجليزية") ثم اضغط إرسال، أو اتركه فارغاً للتحليل العام.', 'bot');
    };
    reader.readAsDataURL(file);
    document.getElementById('imageInput').value = ''; // لتفريغ الحقل حتى يمكن اختيار نفس الصورة مرة أخرى
}

// بقية الدوال كما هي...
function sendTextPrompt() {
    const text = prompt('ما هو سؤالك؟');
    if (text) {
        addMessage(text, 'user');

        const chatArea = document.getElementById('chatArea');
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message bot-message';
        loadingDiv.id = 'loadingMessage';
        loadingDiv.innerHTML = '<div class="message-content">⏳ جاري المعالجة...</div>';
        chatArea.appendChild(loadingDiv);
        chatArea.scrollTop = chatArea.scrollHeight;

        fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': USER_ID
            },
            body: JSON.stringify({ content: text })
        })
        .then(response => response.json())
        .then(data => {
            const loading = document.getElementById('loadingMessage');
            if (loading) loading.remove();
            addMessage(data.response || 'عذراً، لم أتمكن من معالجة طلبك.', 'bot');
        })
        .catch(() => {
            const loading = document.getElementById('loadingMessage');
            if (loading) loading.remove();
            addMessage('❌ تعذر الاتصال بالخادم', 'bot');
        });
    }
}

function handleDocUpload() {
    const file = document.getElementById('docInput').files[0];
    if (!file) return;
    addMessage(`📄 جاري قراءة: ${file.name}`, 'user');

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result.substring(0, 5000);

        const chatArea = document.getElementById('chatArea');
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message bot-message';
        loadingDiv.id = 'loadingMessage';
        loadingDiv.innerHTML = '<div class="message-content">⏳ جاري التحليل...</div>';
        chatArea.appendChild(loadingDiv);
        chatArea.scrollTop = chatArea.scrollHeight;

        fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': USER_ID
            },
            body: JSON.stringify({ content: 'حلل هذا المستند:\n\n' + text })
        })
        .then(response => response.json())
        .then(data => {
            const loading = document.getElementById('loadingMessage');
            if (loading) loading.remove();
            addMessage(data.response || 'عذراً، لم أتمكن من تحليل المستند.', 'bot');
        })
        .catch(() => {
            const loading = document.getElementById('loadingMessage');
            if (loading) loading.remove();
            addMessage('❌ تعذر الاتصال بالخادم', 'bot');
        });
    };
    reader.readAsText(file);
    document.getElementById('docInput').value = '';
}

function openBot() {
    addMessage('🤖 *للتحدث مع البوت:*', 'bot');
    addMessage('1. افتح تطبيق تيليجرام', 'bot');
    addMessage('2. ابحث عن: \u200E@SmartAiLegalBot', 'bot');
    addMessage('3. أرسل /start للبدء', 'bot');
              }
