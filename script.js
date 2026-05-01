const API_URL = '/api/chat';
const USER_ID = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

let pendingImage = null;
let translateMode = false;
const MAX_IMAGE_WIDTH = 800;
const IMAGE_QUALITY = 0.6;

// ==================== دوال مساعدة ====================

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

function showLoading(message = '⏳ جاري المعالجة...') {
    const chatArea = document.getElementById('chatArea');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message bot-message';
    loadingDiv.id = 'loadingMessage';
    loadingDiv.innerHTML = `<div class="message-content">${message}</div>`;
    chatArea.appendChild(loadingDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function hideLoading() {
    const loading = document.getElementById('loadingMessage');
    if (loading) loading.remove();
}

function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                let width = img.width;
                let height = img.height;
                if (width > MAX_IMAGE_WIDTH) {
                    height = (height * MAX_IMAGE_WIDTH) / width;
                    width = MAX_IMAGE_WIDTH;
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const compressedBase64 = canvas.toDataURL('image/jpeg', IMAGE_QUALITY).split(',')[1];
                resolve(compressedBase64);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

async function sendToAPI(payload) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-User-Id': USER_ID },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        hideLoading();
        if (data.response) {
            addMessage(data.response, 'bot');
        } else {
            addMessage('❌ لم يتم تلقي رد من الخادم.', 'bot');
        }
        return data;
    } catch (error) {
        hideLoading();
        addMessage('❌ تعذر الاتصال بالخادم', 'bot');
        return null;
    }
}

function createFileInput(accept, capture, changeHandler) {
    // إزالة أي input سابق
    const oldInput = document.getElementById('dynamicFileInput');
    if (oldInput) oldInput.remove();

    const newInput = document.createElement('input');
    newInput.type = 'file';
    newInput.id = 'dynamicFileInput';
    newInput.accept = accept;
    newInput.style.display = 'none';
    
    // إذا كان الكاميرا مطلوبة، نضيف capture
    if (capture) {
        newInput.setAttribute('capture', 'environment');
    }
    
    newInput.onchange = function() {
        changeHandler(newInput);
        // إعادة تعيين القيمة للسماح باختيار نفس الملف مرة أخرى
        newInput.value = '';
    };
    
    document.body.appendChild(newInput);
    return newInput;
}

// ==================== المحادثة والصور والملفات ====================

async function sendMessage() {
    const input = document.getElementById('userInput');
    const text = input.value.trim();

    if (pendingImage) {
        const caption = text || 'حلل هذه الصورة';
        addMessage(`🖼️ ${caption}`, 'user');
        input.value = '';
        showLoading('⏳ جاري تحليل الصورة...');
        await sendToAPI({ content: caption, imageData: pendingImage });
        pendingImage = null;
        return;
    }

    if (!text) return;
    addMessage(text, 'user');
    input.value = '';
    showLoading();
    await sendToAPI({ content: text });
}

function sendTextPrompt() {
    const text = prompt('ما هو سؤالك؟');
    if (text) {
        addMessage(text, 'user');
        showLoading();
        sendToAPI({ content: text });
    }
}

// فتح المعرض أو الكاميرا لاختيار صورة
function triggerImagePick(mode) {
    translateMode = false;
    const input = createFileInput('image/*', mode === 'camera', handleImageFile);
    input.click();
}

// فتح الكاميرا للترجمة الحية
function triggerLiveTranslate() {
    translateMode = true;
    const input = createFileInput('image/*', true, handleLiveTranslateFile);
    input.click();
}

// معالج الصورة (للتحليل)
function handleImageFile(input) {
    const file = input.files[0];
    if (!file) return;
    addMessage(`🖼️ جاري معالجة: ${file.name}...`, 'user');
    compressImage(file).then((compressed) => {
        pendingImage = compressed;
        addMessage('✅ تم تجهيز الصورة.', 'bot');
        addMessage('✏️ اكتب تعليقك (مثلاً: "ترجم النص في الصورة إلى الإنجليزية") ثم اضغط إرسال.', 'bot');
    }).catch(() => {
        addMessage('❌ فشل معالجة الصورة.', 'bot');
    });
}

// معالج الصورة (للترجمة الحية)
function handleLiveTranslateFile(input) {
    const file = input.files[0];
    if (!file) return;
    
    addMessage('🌐 جاري تحليل الصورة...', 'user');
    showLoading('⏳ جاري استخراج النص من الصورة...');
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        const imageData = e.target.result.split(',')[1];
        
        try {
            // استخراج النص باستخدام Tesseract
            const img = new Image();
            img.src = e.target.result;
            await new Promise((resolve) => { img.onload = resolve; });
            
            const ocrResult = await Tesseract.recognize(img, 'ara+eng');
            const extractedText = ocrResult.data.text.trim();
            
            if (extractedText) {
                addMessage(`📖 النص المستخرج: ${extractedText}`, 'user');
                hideLoading();
                
                const targetLang = prompt('إلى أي لغة تريد الترجمة؟', 'الإنجليزية');
                if (!targetLang) return;
                
                showLoading('⏳ جاري الترجمة...');
                const prompt = `ترجم النص التالي إلى ${targetLang}. أرسل الترجمة فقط:\n\n${extractedText}`;
                await sendToAPI({ content: prompt });
            } else {
                hideLoading();
                addMessage('❌ لم يتم التعرف على نص في الصورة. حاول التقاط صورة أوضح.', 'bot');
            }
        } catch (error) {
            hideLoading();
            addMessage('❌ فشل تحليل الصورة.', 'bot');
        }
    };
    reader.readAsDataURL(file);
}

// رفع مستند
function triggerDocUpload() {
    const input = createFileInput('.pdf,.docx,.xlsx,.pptx,.txt,.csv', false, handleDocFile);
    input.click();
}

function handleDocFile(input) {
    const file = input.files[0];
    if (!file) return;
    addMessage(`📄 جاري قراءة: ${file.name}`, 'user');
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result.substring(0, 5000);
        showLoading('⏳ جاري تحليل المستند...');
        sendToAPI({ content: 'حلل هذا المستند:\n\n' + text });
    };
    reader.readAsText(file);
}

function openBot() {
    addMessage('🤖 *للتحدث مع البوت:*', 'bot');
    addMessage('1. افتح تطبيق تيليجرام', 'bot');
    addMessage('2. ابحث عن: \u200E@SmartAiLegalBot', 'bot');
    addMessage('3. أرسل /start للبدء', 'bot');
}
