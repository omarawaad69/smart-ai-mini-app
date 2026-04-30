const API_URL = '/api/chat';

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

function showLoading() {
    const chatArea = document.getElementById('chatArea');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message bot-message';
    loadingDiv.id = 'loadingMessage';
    loadingDiv.innerHTML = '<div class="message-content">⏳ جاري المعالجة...</div>';
    chatArea.appendChild(loadingDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function hideLoading() {
    const loading = document.getElementById('loadingMessage');
    if (loading) loading.remove();
}

async function sendToAPI(text) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: text })
        });
        const data = await response.json();
        hideLoading();
        addMessage(data.response || 'تم الاستلام', 'bot');
    } catch (error) {
        hideLoading();
        addMessage('❌ تعذر الاتصال بالخادم', 'bot');
    }
}

async function sendMessage() {
    const input = document.getElementById('userInput');
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, 'user');
    input.value = '';
    showLoading();
    await sendToAPI(text);
}

function sendTextPrompt() {
    const text = prompt('ما هو سؤالك؟');
    if (text) {
        addMessage(text, 'user');
        showLoading();
        sendToAPI(text);
    }
}

function handleImageUpload() {
    const file = document.getElementById('imageInput').files[0];
    if (!file) return;
    addMessage(`🖼️ تم استلام: ${file.name}`, 'user');
    addMessage('🖼️ *ملاحظة:* تحليل الصور يعمل بشكل كامل في بوت تيليجرام.', 'bot');
    document.getElementById('imageInput').value = '';
}

function handleDocUpload() {
    const file = document.getElementById('docInput').files[0];
    if (!file) return;
    addMessage(`📄 جاري تحليل: ${file.name}`, 'user');
    showLoading();
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = 'حلل هذا المستند وقدم ملخصاً لمحتواه:\n\n' + e.target.result.substring(0, 5000);
        sendToAPI(text);
    };
    reader.readAsText(file);
    document.getElementById('docInput').value = '';
}

function handleAudioUpload() {
    const file = document.getElementById('audioInput').files[0];
    if (!file) return;
    addMessage(`🎤 تم استلام: ${file.name}`, 'user');
    addMessage('🎤 أرسل الصوت للبوت في تيليجرام لتحويله إلى نص.', 'bot');
    document.getElementById('audioInput').value = '';
}

function showExcelPrompt() {
    const text = prompt('أدخل البيانات لإنشاء ملف Excel:\n\nمثال: الاسم, العمر, المدينة\nأحمد, 25, القاهرة');
    if (text) {
        addMessage('📊 جاري معالجة البيانات...', 'user');
        showLoading();
        sendToAPI('حوّل البيانات التالية إلى تنسيق JSON لملف Excel:\n\n' + text);
    }
}

function openBotForConversion() {
    addMessage('🤖 *لتحويل الملفات:* سيفتح البوت في تيليجرام. أرسل الملف مع تعليق: *حول لـ pdf*', 'bot');
    setTimeout(() => window.open('https://t.me/SmartAiLegalBot', '_blank'), 1000);
}
