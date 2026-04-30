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

async function sendMessage() {
    const input = document.getElementById('userInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    // إظهار رسالة المستخدم
    addMessage(text, 'user');
    input.value = '';
    
    // إظهار تحميل
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: text })
        });
        
        const data = await response.json();
        
        // إزالة التحميل
        const loading = document.getElementById('loadingMessage');
        if (loading) loading.remove();
        
        // إظهار الرد
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
            headers: { 'Content-Type': 'application/json' },
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

function handleImageUpload() {
    const file = document.getElementById('imageInput').files[0];
    if (!file) return;
    addMessage(`🖼️ تم استلام: ${file.name}`, 'user');
    addMessage('🖼️ تحليل الصور يعمل بشكل كامل في بوت تيليجرام.', 'bot');
    document.getElementById('imageInput').value = '';
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
            headers: { 'Content-Type': 'application/json' },
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
    window.open('https://t.me/SmartAiLegalBot', '_blank');
}
