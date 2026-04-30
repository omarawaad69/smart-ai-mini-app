const API_URL = '/api/chat';
const BOT_LINK = 'https://t.me/SmartAiLegalBot';

// ==================== شاشة البداية والقائمة ====================

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.style.right === '0px') {
        sidebar.style.right = '-280px';
    } else {
        sidebar.style.right = '0px';
    }
}

function closeSidebar() {
    document.getElementById('sidebar').style.right = '-280px';
}

function navigateTo(section) {
    closeSidebar();
    if (section === 'chat') sendTextPrompt();
    else if (section === 'image') document.getElementById('imageInput').click();
    else if (section === 'document') document.getElementById('docInput').click();
    else if (section === 'convert') openBotForConversion();
    else if (section === 'excel') showExcelPrompt();
}

function openBot() {
    window.open(BOT_LINK, '_blank');
}

// ==================== المحادثة ====================

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

async function sendToAPI(content, type = 'text', extraData = {}) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, type, ...extraData })
        });
        const data = await response.json();
        hideLoading();
        if (data.status === 'success') {
            addMessage(data.response, 'bot');
        } else {
            addMessage('❌ حدث خطأ', 'bot');
        }
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

// ==================== تحليل الصور ====================

function handleImageUpload() {
    const file = document.getElementById('imageInput').files[0];
    if (!file) return;
    addMessage(`🖼️ جاري تحليل: ${file.name}`, 'user');
    showLoading();
    const reader = new FileReader();
    reader.onload = function(e) {
        sendToAPI('حلل هذه الصورة بالتفصيل', 'analyze_image', { imageData: e.target.result.split(',')[1] });
    };
    reader.readAsDataURL(file);
    document.getElementById('imageInput').value = '';
}

// ==================== تحليل المستندات ====================

function handleDocUpload() {
    const file = document.getElementById('docInput').files[0];
    if (!file) return;
    addMessage(`📄 جاري تحليل: ${file.name}`, 'user');
    showLoading();
    const reader = new FileReader();
    reader.onload = function(e) {
        sendToAPI(e.target.result.substring(0, 8000), 'analyze_document');
    };
    reader.readAsText(file);
    document.getElementById('docInput').value = '';
}

// ==================== الصوت ====================

function handleAudioUpload() {
    const file = document.getElementById('audioInput').files[0];
    if (!file) return;
    addMessage(`🎤 تم استلام: ${file.name}`, 'user');
    addMessage('🎤 لتحويل الصوت إلى نص، افتح البوت في تيليجرام وأرسل الرسالة الصوتية.', 'bot');
    document.getElementById('audioInput').value = '';
}

// ==================== إنشاء Excel ====================

function showExcelPrompt() {
    const text = prompt('أدخل البيانات لإنشاء ملف Excel:\n\nمثال: الاسم, العمر, المدينة\nأحمد, 25, القاهرة');
    if (text) {
        addMessage('📊 جاري معالجة البيانات...', 'user');
        showLoading();
        sendToAPI(text, 'create_excel');
    }
}

// ==================== تحويل الملفات (يفتح البوت) ====================

function openBotForConversion() {
    addMessage('🤖 *لتحويل الملفات:* سيفتح البوت في تيليجرام. أرسل الملف مع تعليق: *حول لـ pdf* أو *حول لـ word* أو *حول لـ excel*', 'bot');
    setTimeout(() => {
        window.open(BOT_LINK, '_blank');
    }, 1000);
}
