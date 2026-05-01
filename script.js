const API_URL = '/api/chat';
const USER_ID = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

let pendingImage = null;
let captureMode = 'photo'; // 'photo' أو 'translate'
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

// ضغط الصورة قبل الإرسال
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

// إرسال طلب إلى الخادم
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

// إنشاء عنصر input file ديناميكي (لحل مشكلة الرفع المتعدد)
function createFileInput(accept, capture, changeHandler) {
    const oldInput = document.getElementById('dynamicFileInput');
    if (oldInput) oldInput.remove();

    const newInput = document.createElement('input');
    newInput.type = 'file';
    newInput.id = 'dynamicFileInput';
    newInput.accept = accept;
    newInput.style.display = 'none';
    if (capture) {
        newInput.setAttribute('capture', 'environment');
    }
    newInput.onchange = function() {
        changeHandler(this);
        this.value = ''; // إعادة تعيين القيمة للسماح باختيار نفس الملف مرة أخرى
    };
    document.body.appendChild(newInput);
    return newInput;
}

// ==================== المحادثة والصور والملفات ====================

// إرسال رسالة نصية (أو صورة مع تعليق)
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

// زر محادثة سريعة
function sendTextPrompt() {
    const text = prompt('ما هو سؤالك؟');
    if (text) {
        addMessage(text, 'user');
        showLoading();
        sendToAPI({ content: text });
    }
}

// فتح المعرض لاختيار صورة
function triggerImageUpload() {
    const input = createFileInput('image/*', false, handleImageFile);
    input.click();
}

// معالج الصورة (للتحليل العادي)
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

// فتح المعرض لاختيار مستند
function triggerDocUpload() {
    const input = createFileInput('.pdf,.docx,.xlsx,.pptx,.txt,.csv', false, handleDocFile);
    input.click();
}

// معالج المستندات
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

// فتح البوت
function openBot() {
    addMessage('🤖 *للتحدث مع البوت:*', 'bot');
    addMessage('1. افتح تطبيق تيليجرام', 'bot');
    addMessage('2. ابحث عن: \u200E@SmartAiLegalBot', 'bot');
    addMessage('3. أرسل /start للبدء', 'bot');
}

// ==================== الكاميرا والترجمة ====================

// الدالة الموحدة للكاميرا والترجمة بعد الالتقاط
function captureAndProcess(mode) {
    captureMode = mode;
    const input = createFileInput('image/*', true, handleCapturedFile);
    input.click();
}

// معالج الملف بعد التقاطه من الكاميرا (أو المعرض)
function handleCapturedFile(input) {
    const file = input.files[0];
    if (!file) return;
    if (captureMode === 'translate') {
        handleLiveTranslation(file);
    } else {
        handleImageFile(input); // يستخدم نفس معالج الصور العادي
    }
}

// دالة الترجمة الفورية بعد الالتقاط
async function handleLiveTranslation(file) {
    const targetLang = await getTranslationLanguage();
    if (!targetLang) return;

    addMessage(`🌐 جاري الترجمة إلى ${targetLang}...`, 'user');
    showLoading('⏳ جاري استخراج النص من الصورة...');

    try {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const imageData = e.target.result;
            try {
                // استخراج النص باستخدام Tesseract.js
                const ocrResult = await Tesseract.recognize(imageData, 'ara+eng');
                const extractedText = ocrResult.data.text.trim();

                if (extractedText) {
                    addMessage(`📖 النص المستخرج: ${extractedText}`, 'bot');
                    hideLoading();
                    showLoading('⏳ جاري ترجمة النص...');

                    const prompt = `ترجم النص التالي إلى ${targetLang}. أرسل الترجمة فقط بدون أي كلام إضافي:\n\n${extractedText}`;
                    await sendToAPI({ content: prompt });
                } else {
                    hideLoading();
                    addMessage('❌ لم يتم التعرف على أي نص في الصورة. حاول التقاط صورة أوضح.', 'bot');
                }
            } catch (error) {
                hideLoading();
                addMessage('❌ فشل تحليل الصورة. تأكد من وضوح النص وحاول مجدداً.', 'bot');
            }
        };
        reader.readAsDataURL(file);
    } catch (error) {
        hideLoading();
        addMessage('❌ حدث خطأ غير متوقع. حاول مرة أخرى.', 'bot');
    }
}

// طلب اللغة المطلوبة للترجمة
function getTranslationLanguage() {
    return new Promise((resolve) => {
        const lang = prompt('إلى أي لغة تريد الترجمة؟ (مثال: الإنجليزية، الفرنسية، الإسبانية)', 'الإنجليزية');
        resolve(lang);
    });
    }
