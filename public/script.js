const socket = io();

// ============ DOM REFS ============
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const botStatusText = document.getElementById('botStatusText');
const botStatusBadge = document.getElementById('botStatusBadge');
const qrImage = document.getElementById('qrImage');
const qrImageWrapper = document.getElementById('qrImageWrapper');
const qrPlaceholder = document.getElementById('qrPlaceholder');
const pairingCodeText = document.getElementById('pairingCodeText');
const codeBox = document.getElementById('codeBox');
const phoneInput = document.getElementById('phoneInput');
const refreshQRBtn = document.getElementById('refreshQRBtn');
const requestPairingBtn = document.getElementById('requestPairingBtn');
const logsContainer = document.getElementById('logsContainer');
const uptimeText = document.getElementById('uptimeText');

let startTime = Date.now();

// ============ LOGGING ============
function addLog(message, type = 'system') {
    const entry = document.createElement('div');
    const time = new Date().toLocaleTimeString();
    entry.className = `log-entry log-${type}`;
    entry.innerHTML = `
        <span class="log-time">${time}</span>
        <span class="log-message">${message}</span>
    `;
    logsContainer.appendChild(entry);
    logsContainer.scrollTop = logsContainer.scrollHeight;
    
    // Keep last 50 logs
    while (logsContainer.children.length > 50) {
        logsContainer.removeChild(logsContainer.firstChild);
    }
}

// ============ STATUS UPDATE ============
function updateStatus(status, connected) {
    // Update dot
    statusDot.className = 'status-dot';
    if (connected) {
        statusDot.classList.add('online');
        statusText.textContent = 'Online';
        botStatusText.textContent = 'Online';
        botStatusText.className = 'info-value online';
        botStatusBadge.textContent = 'Online';
        botStatusBadge.style.color = '#00e676';
        addLog('Bot connected successfully', 'success');
    } else if (status === 'connecting') {
        statusDot.classList.add('connecting');
        statusText.textContent = 'Connecting...';
        botStatusText.textContent = 'Connecting...';
        botStatusText.className = 'info-value';
        botStatusBadge.textContent = 'Connecting';
        botStatusBadge.style.color = '#ffd600';
        addLog('Connecting to WhatsApp...', 'warning');
    } else {
        statusDot.classList.add('offline');
        statusText.textContent = 'Disconnected';
        botStatusText.textContent = 'Offline';
        botStatusText.className = 'info-value offline';
        botStatusBadge.textContent = 'Offline';
        botStatusBadge.style.color = '#ff1744';
    }
}

// ============ SOCKET EVENTS ============
socket.on('status', (data) => {
    updateStatus(data.status, data.connected);
});

socket.on('qr', (data) => {
    if (data.qr) {
        qrImage.src = data.qr;
        qrImageWrapper.style.display = 'flex';
        qrPlaceholder.style.display = 'none';
        addLog('QR code generated — scan to connect', 'system');
    }
});

socket.on('pairing', (data) => {
    if (data.code) {
        pairingCodeText.textContent = data.code;
        codeBox.classList.add('active');
        addLog(`Pairing code: ${data.code}`, 'success');
        setTimeout(() => {
            codeBox.classList.remove('active');
        }, 3000);
    }
});

// ============ BUTTON EVENTS ============
refreshQRBtn.addEventListener('click', async () => {
    try {
        const res = await fetch('/api/refresh-qr', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            addLog('QR code refreshed', 'system');
        }
    } catch (err) {
        addLog('Failed to refresh QR', 'error');
    }
});

requestPairingBtn.addEventListener('click', async () => {
    const phone = phoneInput.value.trim();
    if (!phone) {
        addLog('Please enter a phone number', 'error');
        phoneInput.style.borderColor = '#ff1744';
        setTimeout(() => phoneInput.style.borderColor = '', 2000);
        return;
    }
    
    requestPairingBtn.disabled = true;
    requestPairingBtn.textContent = 'Requesting...';
    
    try {
        const res = await fetch('/api/request-pairing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phone })
        });
        const data = await res.json();
        if (data.success) {
            addLog(`Pairing code requested for ${phone}`, 'success');
            phoneInput.value = '';
        } else {
            addLog(`Error: ${data.error}`, 'error');
        }
    } catch (err) {
        addLog('Failed to request pairing code', 'error');
    }
    
    requestPairingBtn.disabled = false;
    requestPairingBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2L11 13"/>
            <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
        </svg>
        Get Code
    `;
});

// ============ UPTIME ============
setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    uptimeText.textContent = `${hours}h ${minutes}m ${seconds}s`;
}, 1000);

// ============ INITIAL LOAD ============
fetch('/api/status')
    .then(res => res.json())
    .then(data => {
        updateStatus(data.status, data.connected);
        if (data.qr) {
            qrImage.src = data.qr;
            qrImageWrapper.style.display = 'flex';
            qrPlaceholder.style.display = 'none';
        }
        if (data.pairingCode) {
            pairingCodeText.textContent = data.pairingCode;
        }
        addLog('Dashboard loaded', 'system');
    })
    .catch(err => {
        addLog('Failed to load status', 'error');
    });

// ============ KEYBOARD SHORTCUTS ============
phoneInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        requestPairingBtn.click();
    }
});

// ============ PARTICLE BACKGROUND ============
function createParticles() {
    const container = document.getElementById('particles');
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.width = (Math.random() * 3 + 1) + 'px';
        particle.style.height = particle.style.width;
        particle.style.animationDuration = (Math.random() * 20 + 10) + 's';
        particle.style.animationDelay = (Math.random() * 20) + 's';
        container.appendChild(particle);
    }
}
createParticles();

console.log('👑 ZARA MD — Queen of WhatsApp Bots');
console.log('🌐 Dashboard: http://localhost:3000');