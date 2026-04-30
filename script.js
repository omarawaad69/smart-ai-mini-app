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

// ==================== المحادثة النصية ====================

async function sendMessage() {
    const input = document.getElementById('userInput');
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, 'user');
    input.value = '';
    showLoading();
    await sendToAPI(text, 'text');
}

function sendTextPrompt() {
    const text = prompt('ما هو سؤالك؟');
    if (text) {
        addMessage(text, 'user');
        showLoading();
        sendToAPI(text, 'text');
    }
}

// ==================== تحليل الصور ====================

function handleImageUpload() {
    const input = document.getElementById('imageInput');
    const file = input.files[0];
    if (!file) return;
    addMessage(`🖼️ جاري تحليل الصورة: ${file.name}`, 'user');
    addMessage('🖼️ *ملاحظة:* تحليل الصور يعمل بشكل كامل في بوت تيليجرام. في التطبيق المصغر، يتم إرسال اسم الملف فقط.', 'bot');
    input.value = '';
}

// ==================== تحليل المستندات ====================

function handleDocUpload() {
    const input = document.getElementById('docInput');
    const file = input.files[0];
    if (!file) return;
    addMessage(`📄 جاري تحليل: ${file.name}`, 'user');
    showLoading();
    
    // للملفات النصية
    if (file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            sendToAPI(text.substring(0, 5000), 'analyze_document');
        };
        reader.readAsText(file);
    } else {
        // للملفات الأخرى
        hideLoading();
        addMessage('📄 *ملاحظة:* تحليل ملفات PDF و Word و Excel يعمل بشكل كامل في بوت تيليجرام. أرسل الملف للبوت مباشرة.', 'bot');
    }
    input.value = '';
}

// ==================== الصوت ====================

function handleAudioUpload() {
    const input = document.getElementById('audioInput');
    const file = input.files[0];
    if (!file) return;
    addMessage(`🎤 تم استلام: ${file.name}`, 'user');
    addMessage('🎤 *للحصول على أفضل تجربة:* أرسل رسالتك الصوتية مباشرة إلى بوت تيليجرام. سيقوم بتحويلها إلى نص والرد عليك فوراً.', 'bot');
    input.value = '';
}

// ==================== تحويل الملفات ====================

function showConversionOptions() {
    // عرض أزرار التحويل مباشرة في المحادثة
    addMessage('🔄 *اختر نوع التحويل:*', 'bot');
    addMessage('📄 1. Word → PDF\n📄 2. PDF → Word\n📊 3. Excel → PDF\n📊 4. PDF → Excel\n📊 5. Excel → Word\n📄 6. Word → Excel', 'bot');
    addMessage('✏️ *اكتب رقم الخيار في مربع الإدخال أدناه ثم أرسل الملف*', 'bot');
    
    // إعداد المستمع للاختيار
    window.waitingForConversion = true;
}

function handleConvertUpload() {
    const input = document.getElementById('convertInput');
    const file = input.files[0];
    if (!file) return;
    
    const formatMap = {
        '1': 'pdf', 'pdf': 'pdf',
        '2': 'docx', 'word': 'docx', 'docx': 'docx',
        '3': 'pdf', '4': 'xlsx', 'excel': 'xlsx', 'xlsx': 'xlsx',
        '5': 'docx', '6': 'xlsx'
    };
    
    const format = window.lastConversionChoice || 'pdf';
    const targetFormat = formatMap[format] || 'pdf';
    
    addMessage(`🔄 جاري تحويل ${file.name} إلى ${targetFormat.toUpperCase()}`, 'user');
    addMessage('🔄 *ملاحظة:* تحويل الملفات يعمل بشكل كامل في بوت تيليجرام. أرسل الملف للبوت مباشرة مع تعليق: *حول لـ ' + targetFormat + '*', 'bot');
    input.value = '';
}

// ==================== إنشاء Excel ====================

function showExcelPrompt() {
    const text = prompt('أدخل البيانات لإنشاء ملف Excel:\n\nمثال: الاسم, العمر, المدينة\nأحمد, 25, القاهرة\nمحمد, 30, الإسكندرية');
    if (text) {
        addMessage(`📊 جاري معالجة البيانات...`, 'user');
        showLoading();
        sendToAPI(text, 'create_excel');
    }
}

// ==================== مستمع للاختيارات ====================

// تعديل دالة sendMessage للتعامل مع اختيارات التحويل
const originalSendMessage = sendMessage;
sendMessage = async function() {
    const input = document.getElementById('userInput');
    const text = input.value.trim();
    
    if (window.waitingForConversion && text) {
        const formatMap = {
            '1': 'pdf', 'pdf': 'pdf',
            '2': 'docx', 'word': 'docx', 'docx': 'docx',
            '3': 'pdf', '4': 'xlsx', 'excel': 'xlsx', 'xlsx': 'xlsx',
            '5': 'docx', '6': 'xlsx'
        };
        
        const targetFormat = formatMap[text.toLowerCase()] || text.toLowerCase();
        window.lastConversionChoice = text;
        window.waitingForConversion = false;
        
        addMessage(`✅ تم اختيار: ${targetFormat.toUpperCase()}`, 'user');
        addMessage(`📁 الآن أرسل الملف الذي تريد تحويله`, 'bot');
        input.value = '';
        
        // فتح نافذة رفع الملف بعد ثانية
        setTimeout(() => {
            document.getElementById('convertInput').click();
        }, 1000);
        return;
    }
    
    await originalSendMessage();
};
