const API_URL = '/api/chat';
const USER_ID = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

let pendingImage = null;
let mediaStream = null;
let translationInterval = null;
let targetLang = 'الإنجليزية'; // اللغة الافتراضية للترجمة الحية
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

// دالة لإنشاء input file جديد (لحل مشكلة الرفع المتعدد)
function createFileInput(id, accept, changeHandler) {
    const oldInput = document.getElementById(id);
    if (oldInput) oldInput.remove();
    const newInput = document.createElement('input');
    newInput.type = 'file';
    newInput.id = id;
    newInput.accept = accept;
    newInput.style.display = 'none';
    newInput.onchange = changeHandler;
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

// زر محادثة
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
    const input = createFileInput('imageInput', 'image/*', handleImageUpload);
    input.click();
}

// معالج اختيار الصورة
function handleImageUpload() {
    const file = this.files[0];
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

// فتح المعرض لاختيار ملف
function triggerDocUpload() {
    const input = createFileInput('docInput', '.pdf,.docx,.xlsx,.pptx,.txt,.csv', handleDocUpload);
    input.click();
}

// معالج اختيار الملف
function handleDocUpload() {
    const file = this.files[0];
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

// ==================== الكاميرا والتقاط الصور ====================

async function openCamera() {
    const video = document.getElementById('cameraStream');
    const container = document.getElementById('cameraContainer');
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false
        });
        video.srcObject = mediaStream;
        container.style.display = 'block';
        addMessage('📸 الكاميرا جاهزة. وجّهها واضغط على "التقط".', 'bot');
    } catch (err) {
        console.error("خطأ في الوصول للكاميرا: ", err);
        addMessage('❌ لم نتمكن من الوصول إلى الكاميرا. تأكد من منح الإذن.', 'bot');
    }
}

function capturePhoto() {
    const video = document.getElementById('cameraStream');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // إيقاف الكاميرا
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
    document.getElementById('cameraContainer').style.display = 'none';
    
    // تحويل الصورة إلى Base64 وإرسالها للتحليل
    canvas.toBlob(function(blob) {
        const reader = new FileReader();
        reader.onloadend = function() {
            const base64data = reader.result.split(',')[1];
            pendingImage = base64data;
            addMessage('📸 تم التقاط الصورة. اكتب تعليقك (أو اتركه فارغاً) ثم اضغط إرسال.', 'bot');
        };
        reader.readAsDataURL(blob);
    }, 'image/jpeg', IMAGE_QUALITY);
}

// ==================== الترجمة الحية ====================

async function startLiveTranslation() {
    // طلب اللغة الهدف مرة واحدة
    const lang = prompt('إلى أي لغة تريد الترجمة؟ (مثال: الإنجليزية، الفرنسية، الإسبانية)', targetLang);
    if (lang) targetLang = lang;
    
    await openCamera();
    document.getElementById('liveTranslationBtn').style.display = 'none';
    document.getElementById('stopTranslationBtn').style.display = 'inline-block';
    addMessage(`🌐 بدء الترجمة الحية إلى ${targetLang}...`, 'bot');
    
    const video = document.getElementById('cameraStream');
    
    translationInterval = setInterval(async () => {
        if (!video.videoWidth) return;
        
        // التقاط إطار من الفيديو
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        try {
            // استخراج النص من الصورة باستخدام Tesseract
            const { data: { text } } = await Tesseract.recognize(imageDataUrl, 'ara+eng');
            if (text.trim() !== '') {
                // ترجمة النص المستخرج
                const prompt = `ترجم النص التالي إلى ${targetLang}. أرسل الترجمة فقط بدون أي كلام إضافي:\n\n${text.trim()}`;
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: prompt })
                });
                const data = await response.json();
                if (data.response) {
                    addMessage(`📖 النص: ${text.trim()}\n🌐 الترجمة: ${data.response}`, 'bot');
                }
            }
        } catch (err) {
            console.error('خطأ في الترجمة الحية:', err);
        }
    }, 3000); // كل 3 ثواني
}

function stopLiveTranslation() {
    clearInterval(translationInterval);
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
    document.getElementById('cameraContainer').style.display = 'none';
    document.getElementById('liveTranslationBtn').style.display = 'inline-block';
    document.getElementById('stopTranslationBtn').style.display = 'none';
    addMessage('⏹️ تم إيقاف الترجمة الحية.', 'bot');
}
