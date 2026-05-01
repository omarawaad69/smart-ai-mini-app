const API_URL = '/api/chat';
const USER_ID = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

let pendingImage = null;

// إعدادات الضغط
const MAX_IMAGE_WIDTH = 800; // العرض الأقصى
const IMAGE_QUALITY = 0.6;  // جودة الضغط (60%)

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

// دالة ضغط الصورة قبل الإرسال
function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // حساب الأبعاد الجديدة
                let width = img.width;
                let height = img.height;
                if (width > MAX_IMAGE_WIDTH) {
                    height = (height * MAX_IMAGE_WIDTH) / width;
                    width = MAX_IMAGE_WIDTH;
                }

                // الرسم على canvas بحجم أصغر
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // استخراج Base64 بجودة مخفضة
                const compressedBase64 = canvas.toDataURL('image/jpeg', IMAGE_QUALITY).split(',')[1];
                resolve(compressedBase64);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

async function sendMessage() {
    const input = document.getElementById('userInput');
    const text = input.value.trim();

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
                    imageData: pendingImage // الصورة مضغوطة بالفعل
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

        pendingImage = null;
        return;
    }

    // إرسال نص عادي
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

// عند اختيار صورة
function handleImageUpload() {
    const file = document.getElementById('imageInput').files[0];
    if (!file) return;

    addMessage(`🖼️ جاري معالجة: ${file.name}...`, 'user');

    compressImage(file).then((compressed) => {
        pendingImage = compressed;
        addMessage(`✅ تم تجهيز الصورة (مضغوطة).`, 'bot');
        addMessage('✏️ اكتب تعليقك (مثلاً: "ترجم النص في الصورة إلى الإنجليزية") ثم اضغط إرسال، أو اتركه فارغاً للتحليل العام.', 'bot');
    }).catch(() => {
        addMessage('❌ فشل معالجة الصورة.', 'bot');
    });

    document.getElementById('imageInput').value = '';
}

// باقي الدوال (sendTextPrompt, handleDocUpload, openBot) كما هي بدون تغيير
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
