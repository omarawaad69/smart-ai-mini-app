// تهيئة Telegram Mini App SDK
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// إرسال رسالة نصية
function sendMessage() {
    const input = document.getElementById('userInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    addMessage(text, 'user');
    input.value = '';
    
    // إرسال إلى البوت عبر Telegram WebApp
    tg.sendData(JSON.stringify({
        type: 'text',
        content: text
    }));
}

// رفع الملفات
function handleFileUpload(type) {
    const input = document.getElementById(
        type === 'image' ? 'imageInput' : 
        type === 'doc' ? 'docInput' : 'audioInput'
    );
    
    const file = input.files[0];
    if (!file) return;
    
    addMessage(`📁 جاري رفع: ${file.name}`, 'user');
    
    // إرسال الملف إلى البوت
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        addMessage('✅ تم رفع الملف بنجاح!', 'bot');
    })
    .catch(error => {
        addMessage('❌ حدث خطأ أثناء رفع الملف', 'bot');
    });
}

// إضافة رسالة للشاشة
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

// إرسال نص عادي
function sendTextPrompt() {
    const text = prompt('ما هو سؤالك؟');
    if (text) {
        addMessage(text, 'user');
        tg.sendData(JSON.stringify({
            type: 'text',
            content: text
        }));
    }
}