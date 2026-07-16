const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

let latestQR = null;
let latestPairingCode = null;
let isConnected = false;
let botStatus = 'disconnected';
let pendingPairingPhone = null;
let sockInstance = null;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/status', (req, res) => {
    res.json({
        status: botStatus,
        connected: isConnected,
        qr: latestQR,
        pairingCode: latestPairingCode
    });
});

app.post('/api/refresh-qr', (req, res) => {
    latestQR = null;
    res.json({ success: true });
});

// Pairing route - now handled in index.js, but keep for fallback
app.post('/api/request-pairing-fallback', async (req, res) => {
    const { phone } = req.body;
    if (!phone || phone.length < 10) {
        return res.json({ success: false, error: 'Valid phone number required' });
    }
    pendingPairingPhone = phone;
    res.json({ success: true, message: 'Pairing requested', pending: true });
});

io.on('connection', (socket) => {
    console.log('🟢 Client connected:', socket.id);
    socket.emit('status', {
        status: botStatus,
        connected: isConnected,
        qr: latestQR,
        pairingCode: latestPairingCode
    });
    socket.on('disconnect', () => {
        console.log('🔴 Client disconnected:', socket.id);
    });
});

function updateQR(qr) {
    latestQR = qr;
    io.emit('qr', { qr: qr });
}

function updatePairingCode(code) {
    if (code && code.length >= 8) {
        latestPairingCode = code;
        io.emit('pairing', { code: code });
    }
}

function updateStatus(status, connected) {
    botStatus = status;
    isConnected = connected;
    io.emit('status', { status: status, connected: connected });
}

function setSocket(sock) {
    sockInstance = sock;
}

function getPendingPhone() {
    const phone = pendingPairingPhone;
    pendingPairingPhone = null;
    return phone;
}

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════╗
║   🌐 ZARA MD WEB SERVER          ║
║   👉 http://localhost:${PORT}      ║
╚═══════════════════════════════════╝
    `);
});

module.exports = {
    app,
    server,
    io,
    updateQR,
    updatePairingCode,
    updateStatus,
    setSocket,
    getPendingPhone
};