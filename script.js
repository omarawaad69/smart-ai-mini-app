const API_URL = 'https://اسم-مشروعك-على-railway.up.railway.app/api/chat';
const UPLOAD_URL = 'https://اسم-مشروعك-على-railway.up.railway.app/api/upload';

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

function sendMessage() {
    const input = document.getElementById('userInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    addMessage(text, 'user');
    input.value = '';
    showLoading();
    
    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        if (data.status === 'success') {
            addMessage(data.response, 'bot');
        } else {
            addMessage('❌ حدث خطأ', 'bot');
        }
    })
    .catch(() => {
        hideLoading();
        addMessage('❌ تعذر الاتصال بالخادم', 'bot');
    });
}

function sendTextPrompt() {
    const text = prompt('ما هو سؤالك؟');
    if (text) {
        addMessage(text, 'user');
        showLoading();
        
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: text })
        })
        .then(response => response.json())
        .then(data => {
            hideLoading();
            if (data.status === 'success') {
                addMessage(data.response, 'bot');
            } else {
                addMessage('❌ حدث خطأ', 'bot');
            }
        })
        .catch(() => {
            hideLoading();
            addMessage('❌ تعذر الاتصال بالخادم', 'bot');
        });
    }
}

function handleFileUpload() {
    const input = document.getElementById('docInput');
    const file = input.files[0];
    if (!file) return;
    
    addMessage(`📁 جاري رفع: ${file.name}`, 'user');
    showLoading();
    
    const formData = new FormData();
    formData.append('file', file);
    
    fetch(UPLOAD_URL, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        if (data.status === 'success') {
            addMessage(data.response, 'bot');
        } else {
            addMessage('❌ حدث خطأ أثناء رفع الملف', 'bot');
        }
    })
    .catch(() => {
        hideLoading();
        addMessage('❌ تعذر الاتصال بالخادم', 'bot');
    });
}
