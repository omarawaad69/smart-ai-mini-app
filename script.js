const API_URL = '/api/chat';
let conversionFormat = null;

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
    loadingDiv.innerHTML = '<div class="message-content"><div class="loading"></div></div>';
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

// إرسال رسالة نصية
async function sendMessage() {
    const input = document.getElementById('userInput');
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, 'user');
    input.value = '';
    showLoading();
    await sendToAPI(text, 'text');
}

// محادثة سريعة
function sendTextPrompt() {
    const text = prompt('ما هو سؤالك؟');
    if (text) {
        addMessage(text, 'user');
        showLoading();
        sendToAPI(text, 'text');
    }
}

// رفع صورة وتحليلها
function handleImageUpload() {
    const input = document.getElementById('imageInput');
    const file = input.files[0];
    if (!file) return;
    
    addMessage(`🖼️ جاري تحليل الصورة: ${file.name}`, 'user');
    showLoading();
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result.split(',')[1];
        sendToAPI('حلل هذه الصورة بالتفصيل', 'analyze_image', { imageData: base64 });
    };
    reader.readAsDataURL(file);
}

// رفع مستند وتحليله
function handleDocUpload() {
    const input = document.getElementById('docInput');
    const file = input.files[0];
    if (!file) return;
    
    addMessage(`📄 جاري تحليل: ${file.name}`, 'user');
    showLoading();
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        sendToAPI(text.substring(0, 5000), 'analyze_document');
    };
    reader.readAsText(file);
}

// رفع صوت
function handleAudioUpload() {
    const input = document.getElementById('audioInput');
    const file = input.files[0];
    if (!file) return;
    
    addMessage(`🎤 تم استلام: ${file.name}`, 'user');
    addMessage('🎤 *ملاحظة:* تحويل الصوت إلى نص قيد التطوير. أرسل رسالتك الصوتية للبوت مباشرة في تيليجرام.', 'bot');
}

// تحويل الملفات
function handleConvertUpload() {
    const input = document.getElementById('convertInput');
    const file = input.files[0];
    if (!file || !conversionFormat) return;
    
    addMessage(`🔄 جاري تحويل ${file.name} إلى ${conversionFormat.toUpperCase()}`, 'user');
    showLoading();
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        sendToAPI(text.substring(0, 5000), 'convert_file', { targetFormat: conversionFormat });
    };
    reader.readAsText(file);
}

// قائمة تحويل الملفات
function showConversionOptions() {
    const format = prompt('اختر صيغة التحويل:\n\n1. pdf\n2. docx (Word)\n3. xlsx (Excel)\n\nاكتب الرقم أو الاسم:');
    
    if (format === '1' || format === 'pdf') {
        conversionFormat = 'pdf';
        document.getElementById('convertInput').click();
    } else if (format === '2' || format === 'docx' || format === 'word') {
        conversionFormat = 'docx';
        document.getElementById('convertInput').click();
    } else if (format === '3' || format === 'xlsx' || format === 'excel' || format === 'اكسيل') {
        conversionFormat = 'xlsx';
        document.getElementById('convertInput').click();
    } else if (format) {
        addMessage('❌ صيغة غير مدعومة. اختر: pdf, word, excel', 'bot');
    }
}
