const API_URL = '/api/chat';
const BOT_API_URL = 'https://ai-bot-production-2db2.up.railway.app/api/chat';
const BOT_UPLOAD_URL = 'https://ai-bot-production-2db2.up.railway.app/api/upload';

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

// ==================== المحادثة النصية ====================

async function sendMessage() {
    const input = document.getElementById('userInput');
    const text = input.value.trim();
    if (!text) return;
    
    // التعامل مع اختيارات التحويل
    if (window.waitingForConversion && text) {
        const formatMap = {
            '1': 'pdf', 'pdf': 'pdf',
            '2': 'docx', 'word': 'docx', 'docx': 'docx',
            '3': 'pdf', '4': 'xlsx', 'excel': 'xlsx', 'xlsx': 'xlsx',
            '5': 'docx', '6': 'xlsx'
        };
        
        window.lastConversionChoice = formatMap[text.toLowerCase()] || text.toLowerCase();
        window.waitingForConversion = false;
        
        addMessage(`✅ تم اختيار التحويل إلى: ${window.lastConversionChoice.toUpperCase()}`, 'user');
        addMessage(`📁 الآن أرسل الملف الذي تريد تحويله`, 'bot');
        input.value = '';
        
        setTimeout(() => {
            document.getElementById('convertInput').click();
        }, 500);
        return;
    }
    
    addMessage(text, 'user');
    input.value = '';
    showLoading();

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: text, type: 'text' })
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

function sendTextPrompt() {
    const text = prompt('ما هو سؤالك؟');
    if (text) {
        addMessage(text, 'user');
        showLoading();
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: text, type: 'text' })
        })
        .then(response => response.json())
        .then(data => {
            hideLoading();
            if (data.status === 'success') addMessage(data.response, 'bot');
            else addMessage('❌ حدث خطأ', 'bot');
        })
        .catch(() => {
            hideLoading();
            addMessage('❌ تعذر الاتصال بالخادم', 'bot');
        });
    }
}

// ==================== تحليل الصور ====================

function handleImageUpload() {
    const input = document.getElementById('imageInput');
    const file = input.files[0];
    if (!file) return;
    
    addMessage(`🖼️ جاري تحليل: ${file.name}`, 'user');
    showLoading();
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: 'حلل هذه الصورة',
                    type: 'analyze_image',
                    imageData: e.target.result.split(',')[1]
                })
            });
            const data = await response.json();
            hideLoading();
            if (data.status === 'success') addMessage(data.response, 'bot');
            else addMessage('❌ حدث خطأ في تحليل الصورة', 'bot');
        } catch (error) {
            hideLoading();
            addMessage('❌ تعذر الاتصال بالخادم', 'bot');
        }
    };
    reader.readAsDataURL(file);
    input.value = '';
}

// ==================== تحليل المستندات ====================

function handleDocUpload() {
    const input = document.getElementById('docInput');
    const file = input.files[0];
    if (!file) return;
    
    addMessage(`📄 جاري تحليل: ${file.name}`, 'user');
    showLoading();
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: e.target.result.substring(0, 10000),
                    type: 'analyze_document'
                })
            });
            const data = await response.json();
            hideLoading();
            if (data.status === 'success') addMessage(data.response, 'bot');
            else addMessage('❌ حدث خطأ', 'bot');
        } catch (error) {
            hideLoading();
            addMessage('❌ تعذر الاتصال بالخادم', 'bot');
        }
    };
    reader.readAsText(file);
    input.value = '';
}

// ==================== تحويل الملفات عبر Railway ====================

async function handleConvertUpload() {
    const input = document.getElementById('convertInput');
    const file = input.files[0];
    if (!file) return;
    
    const targetFormat = window.lastConversionChoice || 'pdf';
    
    addMessage(`🔄 جاري تحويل ${file.name} إلى ${targetFormat.toUpperCase()}...`, 'user');
    showLoading();
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target', targetFormat);
    
    try {
        const response = await fetch(BOT_UPLOAD_URL, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        hideLoading();
        
        if (data.status === 'success') {
            addMessage(`✅ تم تحويل الملف بنجاح إلى ${targetFormat.toUpperCase()}`, 'bot');
            if (data.response) {
                addMessage(data.response, 'bot');
            }
        } else {
            addMessage('❌ فشل تحويل الملف. تأكد من أن الملف غير تالف وغير محمي بكلمة مرور.', 'bot');
        }
    } catch (error) {
        hideLoading();
        addMessage('❌ تعذر الاتصال بخادم التحويل. حاول مرة أخرى.', 'bot');
    }
    
    input.value = '';
}

// ==================== الصوت ====================

function handleAudioUpload() {
    const input = document.getElementById('audioInput');
    const file = input.files[0];
    if (!file) return;
    
    addMessage(`🎤 جاري معالجة: ${file.name}`, 'user');
    addMessage('🎤 *ملاحظة:* معالجة الصوت ستكون متاحة قريباً. حالياً يمكنك إرسال الرسائل الصوتية مباشرة لبوت تيليجرام.', 'bot');
    input.value = '';
}

// ==================== تحويل الملفات ====================

function showConversionOptions() {
    addMessage('🔄 *اختر نوع التحويل:*', 'bot');
    addMessage('1️⃣ PDF\n2️⃣ Word\n3️⃣ Excel', 'bot');
    addMessage('✏️ *اكتب الرقم في مربع الإدخال أدناه*', 'bot');
    window.waitingForConversion = true;
}

// ==================== إنشاء Excel ====================

function showExcelPrompt() {
    const text = prompt('أدخل البيانات لإنشاء ملف Excel:\n\nمثال: الاسم, العمر, المدينة\nأحمد, 25, القاهرة\nمحمد, 30, الإسكندرية');
    if (text) {
        addMessage(`📊 جاري معالجة البيانات...`, 'user');
        showLoading();
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: text, type: 'create_excel' })
        })
        .then(response => response.json())
        .then(data => {
            hideLoading();
            if (data.status === 'success') addMessage(data.response, 'bot');
            else addMessage('❌ حدث خطأ', 'bot');
        })
        .catch(() => {
            hideLoading();
            addMessage('❌ تعذر الاتصال بالخادم', 'bot');
        });
    }
}

// ==================== متغيرات عامة ====================
window.waitingForConversion = false;
window.lastConversionChoice = null;
