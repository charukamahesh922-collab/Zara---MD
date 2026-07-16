const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const qrcode = require('qrcode-terminal');
<<<<<<< HEAD
const readline = require('readline');
=======
const QRCode = require('qrcode');
>>>>>>> 50e0c99 (Initial commit: ZARA MD WhatsApp Bot)

const server = require('./server.js');

<<<<<<< HEAD
// ==================== GLOBAL VARIABLES ====================
let loginChoice = null;  // Store login choice globally
let isFirstRun = true;   // Track if it's first run

// ==================== USER INPUT HELPER ====================
function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

// ==================== GET LOGIN METHOD FROM USER ====================
async function getLoginMethod() {
    // If already chosen, return stored choice
    if (loginChoice) {
        return loginChoice;
    }

    console.log(`
╔═══════════════════════════════════╗
║     👑 ZARA MD BOT 👑            ║
║   The Queen of WhatsApp Bots      ║
╚═══════════════════════════════════╝

Choose login method:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [1] QR Code (Scan with WhatsApp)
  [2] Phone Number (Get Pairing Code)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    const answer = await askQuestion('Enter your choice (1 or 2): ');
    
    if (answer.trim() === '2') {
        const phone = await askQuestion('Enter your phone number (with country code, e.g., 91xxxxxxxxxx): ');
        loginChoice = { method: 'pair', phone: phone.trim() };
    } else {
        loginChoice = { method: 'qr', phone: null };
    }
    
    return loginChoice;
}

// ==================== PAIRING CODE LOGIN ====================
async function pairWithPhone(sock, phoneNumber) {
    console.log(`\n📱 Requesting pairing code for: ${phoneNumber}`);
    
    try {
        const code = await sock.requestPairingCode(phoneNumber);
        console.log(`
╔═══════════════════════════════════╗
║   📲 YOUR PAIRING CODE           ║
║                                   ║
║   👉 ${code} 👈                     ║
║                                   ║
║   Open WhatsApp > Link Device     ║
║   > Link with Phone Number        ║
║   > Enter this code               ║
╚═══════════════════════════════════╝
        `);
        return true;
    } catch (error) {
        console.error('❌ Pairing failed:', error.message);
        return false;
    }
}

// ==================== CONNECT TO WHATSAPP ====================
async function connectToWhatsApp() {
    // Get login method (only once)
    const login = await getLoginMethod();
    
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    // Create socket WITHOUT printQRInTerminal (deprecated)
    const sock = makeWASocket({
        auth: state,
        browser: [config.bot.name, 'Chrome', config.bot.version],
        // Don't use printQRInTerminal - we'll handle QR manually
    });

    // ============ HANDLE QR CODE MANUALLY ============
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // --- SHOW QR CODE (Manual) ---
        if (qr && login.method === 'qr') {
            console.log('\n========================================');
            console.log('👑 SCAN THIS QR CODE WITH WHATSAPP');
            console.log('========================================\n');
            qrcode.generate(qr, { small: true });
            console.log('\n📱 Open WhatsApp > Link Device > Scan QR\n');
        }

        // --- CONNECTION SUCCESS ---
        if (connection === 'open') {
            console.log('\n✅ ZARA MD IS ONLINE!');
            console.log(`👑 Bot Name: ${config.bot.name}`);
            console.log(`📱 Owner: ${config.owner.number}\n`);

            // Send welcome message to owner
            if (config.welcome.enabled) {
                await sendWelcomeMessage(sock);
            }
        }

        // --- DISCONNECT ---
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('🔴 Connection closed. Reconnecting:', shouldReconnect);
            if (shouldReconnect) {
                // Reconnect without asking again
                await connectToWhatsApp();
            } else {
                console.log('❌ Logged out. Please restart the bot.');
                process.exit(0);
            }
        }
    });

    // ============ HANDLE PAIRING CODE ============
    if (login.method === 'pair') {
        console.log('\n⏳ Requesting pairing code...');
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(login.phone);
                console.log(`
╔═══════════════════════════════════╗
║   📲 YOUR PAIRING CODE           ║
║                                   ║
║   👉 ${code} 👈                     ║
║                                   ║
║   Open WhatsApp > Link Device     ║
║   > Link with Phone Number        ║
║   > Enter this code               ║
╚═══════════════════════════════════╝
                `);
            } catch (error) {
                console.error('❌ Failed to get pairing code:', error.message);
                console.log('🔄 Trying QR code method instead...');
                // Fallback to QR - update login method
                login.method = 'qr';
            }
        }, 2000);
    }

    sock.ev.on('creds.update', saveCreds);

    // ============ MESSAGE HANDLER ============
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        
        // --- PING COMMAND ---
        if (text.toLowerCase() === 'ping') {
            await sock.sendMessage(from, { 
                text: `🏓 Pong! ${config.bot.name} is alive!\n⏱️ ${Date.now() - msg.messageTimestamp * 1000}ms` 
            });
        }

        // --- HELP COMMAND ---
        if (text.toLowerCase() === `${config.bot.prefix}help`) {
            const helpText = `╔═══════════════════════════╗
║   👑 ${config.bot.name} 👑    ║
=======
const config = {
    owner: { number: '94784745155', name: 'Zara Owner' },
    bot: { name: 'ZARA MD', version: '1.0.0', prefix: '.' },
    welcome: {
        enabled: true,
        logoUrl: 'https://raw.githubusercontent.com/charukamahesh922-collab/Zara---MD/refs/heads/main/Img/zaramd.jpg',
        reactions: ['👑', '💖', '✨'],
    },
    messages: {
        welcome: `╔═══════════════════════════╗
║     👑 ZARA MD 👑        ║
║   The Queen of Bots       ║
>>>>>>> 50e0c99 (Initial commit: ZARA MD WhatsApp Bot)
╚═══════════════════════════╝

╭─────────────────────────╮
│  ✅ Bot Successfully     │
│     Connected!           │
│                          │
│  🤖 Name: {botName}      │
│  📱 Status: Online 🟢    │
│  ⚡ Version: {version}   │
│  👑 Owner: {ownerNumber} │
╰─────────────────────────╯

✨ *"Royalty meets code."* ✨
━━━━━━━━━━━━━━━━━━━━━━━━━
💫 ZARA MD — Rule Your Chats!`,
        beautiful: `🌟━━━━━━━━━━━━━━━━━━━━━━━🌟
┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃   🎀 WELCOME HOME 🎀   ┃
┃                        ┃
┃   👑 ZARA MD IS LIVE  ┃
┃   🔥 Ready to Serve   ┃
┃   💫 24/7 Active      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━┛
🌟━━━━━━━━━━━━━━━━━━━━━━━🌟

💖 *Made with ❤️ for you*`,
    }
};

let sock = null;
let isConnected = false;
let reconnectTimer = null;
let reconnectAttempts = 0;
let isShuttingDown = false;
let pairingInProgress = false;

function updateWebQR(qr) {
    if (qr) {
        QRCode.toDataURL(qr, (err, url) => {
            if (!err) server.updateQR(url);
        });
    }
}

function updateWebPairing(code) {
    if (code && code.length >= 8) {
        server.updatePairingCode(code);
    }
}

function updateWebStatus(status, connected) {
    server.updateStatus(status, connected);
}

async function sendWelcomeMessage(sock) {
    try {
        const ownerJid = config.owner.number + '@s.whatsapp.net';
        let logoBuffer = null;
        try {
            const response = await axios.get(config.welcome.logoUrl, { 
                responseType: 'arraybuffer', 
                timeout: 10000 
            });
            logoBuffer = Buffer.from(response.data);
        } catch (error) {
            console.log('⚠️ Logo download failed');
        }

        const welcomeText = config.messages.welcome
            .replace(/{botName}/g, config.bot.name)
            .replace(/{version}/g, config.bot.version)
            .replace(/{ownerNumber}/g, config.owner.number);

        let sentMsg;
        if (logoBuffer) {
            sentMsg = await sock.sendMessage(ownerJid, { 
                image: logoBuffer, 
                caption: welcomeText, 
                mimetype: 'image/jpeg' 
            });
        } else {
            sentMsg = await sock.sendMessage(ownerJid, { text: welcomeText });
        }

        for (const emoji of config.welcome.reactions) {
            await sock.sendMessage(ownerJid, { 
                react: { text: emoji, key: sentMsg.key } 
            });
            await new Promise(resolve => setTimeout(resolve, 500));
        }

<<<<<<< HEAD
        // --- SEND BEAUTIFUL MESSAGE ---
        const beautifulText = config.messages.beautiful;
        const sentBeautiful = await sock.sendMessage(ownerJid, { text: beautifulText });

        await sock.sendMessage(ownerJid, {
            react: {
                text: '💖',
                key: sentBeautiful.key,
            }
=======
        const sentBeautiful = await sock.sendMessage(ownerJid, { 
            text: config.messages.beautiful 
        });
        await sock.sendMessage(ownerJid, { 
            react: { text: '💖', key: sentBeautiful.key } 
>>>>>>> 50e0c99 (Initial commit: ZARA MD WhatsApp Bot)
        });

        console.log('📨 Welcome message sent to owner!');
    } catch (error) {
        console.error('❌ Welcome error:', error.message);
    }
}

// ===== GENERATE PAIRING CODE =====
async function generatePairingCode(phone) {
    if (pairingInProgress) {
        console.log('⏳ Pairing already in progress...');
        return null;
    }
    
    pairingInProgress = true;
    console.log(`\n📱 Generating pairing code for: ${phone}`);
    
    try {
        // Create a temporary socket just for pairing
        const { state, saveCreds } = await useMultiFileAuthState('auth_info');
        
        const tempSock = makeWASocket({
            auth: state,
            browser: ['ZARA MD', 'Chrome', '1.0.0'],
            markOnlineOnConnect: false,
            connectTimeoutMs: 30000,
            defaultQueryTimeoutMs: 30000,
            keepAliveIntervalMs: 30000,
            version: [2, 2403, 2],
            generateHighQualityLinkPreview: false,
            shouldSyncHistoryMessage: () => false,
        });

        // Wait for the socket to be ready
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Request pairing code
        const code = await tempSock.requestPairingCode(phone);
        
        if (code && code.length >= 8) {
            console.log(`✅ Pairing code generated: ${code}`);
            updateWebPairing(code);
            
            // Store the socket for later use
            sock = tempSock;
            server.setSocket(sock);
            
            // Set up connection events for the main socket
            tempSock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;
                
                if (qr) {
                    console.log('\n📱 QR Code generated!');
                    updateWebQR(qr);
                    qrcode.generate(qr, { small: true });
                }
                
                if (connection === 'open') {
                    isConnected = true;
                    updateWebStatus('online', true);
                    console.log('\n✅ ZARA MD IS ONLINE!');
                    
                    if (config.welcome.enabled) {
                        await sendWelcomeMessage(tempSock);
                    }
                }
                
                if (connection === 'close') {
                    isConnected = false;
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    if (statusCode !== DisconnectReason.loggedOut && !isShuttingDown) {
                        console.log('🔄 Reconnecting...');
                        setTimeout(async () => {
                            await connectToWhatsApp();
                        }, 5000);
                    }
                }
            });
            
            tempSock.ev.on('creds.update', saveCreds);
            
            console.log(`
╔═══════════════════════════════════╗
║   📲 PAIRING CODE                ║
║                                   ║
║   👉 ${code} 👈                     ║
║                                   ║
║   Open WhatsApp > Link Device     ║
║   > Link with Phone Number        ║
║   > Enter this code               ║
║                                   ║
║   ⚠️ Code expires in 5 minutes!   ║
╚═══════════════════════════════════╝
            `);
            
            pairingInProgress = false;
            return code;
        } else {
            console.log('❌ Invalid pairing code received');
            pairingInProgress = false;
            return null;
        }
    } catch (error) {
        console.error('❌ Pairing failed:', error.message);
        pairingInProgress = false;
        return null;
    }
}

// ===== CONNECT TO WHATSAPP =====
async function connectToWhatsApp() {
    if (sock || isShuttingDown) return;

    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info');
        updateWebStatus('connecting', false);
        
        console.log('🔄 Connecting to WhatsApp...');
        
        sock = makeWASocket({
            auth: state,
            browser: ['ZARA MD', 'Chrome', '1.0.0'],
            markOnlineOnConnect: false,
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 60000,
            keepAliveIntervalMs: 60000,
            version: [2, 2403, 2],
            maxRetries: 5,
            retryDelayMs: 5000,
            generateHighQualityLinkPreview: false,
            shouldSyncHistoryMessage: () => false,
        });

        server.setSocket(sock);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('\n📱 QR Code generated!');
                updateWebQR(qr);
                console.log('\n========================================');
                console.log('👑 SCAN QR CODE AT: http://localhost:3000');
                console.log('========================================\n');
                qrcode.generate(qr, { small: true });
                reconnectAttempts = 0;
            }

            if (connection === 'open') {
                isConnected = true;
                reconnectAttempts = 0;
                updateWebStatus('online', true);
                
                console.log('\n✅ ZARA MD IS ONLINE!');
                console.log(`👑 Bot Name: ${config.bot.name}`);
                console.log(`📱 Owner: ${config.owner.number}`);
                console.log(`🌐 Web: http://localhost:3000\n`);

                if (config.welcome.enabled) {
                    await sendWelcomeMessage(sock);
                }
            }

            if (connection === 'close') {
                isConnected = false;
                sock = null;
                server.setSocket(null);
                updateWebStatus('disconnected', false);
                
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                
                console.log('🔴 Connection closed.');
                
                if (shouldReconnect && !isShuttingDown) {
                    const delay = Math.min(30000, 5000 * (reconnectAttempts + 1));
                    reconnectAttempts++;
                    console.log(`⏳ Reconnecting in ${delay/1000}s...`);
                    reconnectTimer = setTimeout(async () => {
                        reconnectTimer = null;
                        await connectToWhatsApp();
                    }, delay);
                } else {
                    console.log('❌ Logged out. Please restart the bot.');
                    updateWebStatus('disconnected', false);
                }
            }
        });

        sock.ev.on('creds.update', saveCreds);

        // ===== MESSAGE HANDLER =====
        sock.ev.on('messages.upsert', async (m) => {
            if (!isConnected || !sock) return;
            
            for (const msg of m.messages) {
                if (!msg.message || msg.key.fromMe) continue;

                const from = msg.key.remoteJid;
                const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
                const lowerText = text.trim().toLowerCase();
                
                if (lowerText === 'ping') {
                    await sock.sendMessage(from, { 
                        text: `🏓 Pong! ${config.bot.name} is alive!` 
                    });
                }

                if (lowerText === `${config.bot.prefix}help` || lowerText === '/help' || lowerText === '#help') {
                    await sock.sendMessage(from, { 
                        text: `👑 ${config.bot.name}
━━━━━━━━━━━━━━━━━━━━━━━━━
📌 Commands:
ping - Check status
${config.bot.prefix}help - This menu
${config.bot.prefix}info - Bot info

✨ Rule Your Chats!` 
                    });
                }

                if (lowerText === `${config.bot.prefix}info` || lowerText === '/info' || lowerText === '#info') {
                    await sock.sendMessage(from, { 
                        text: `👑 ${config.bot.name}
━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Name: ${config.bot.name}
📱 Status: Online 🟢
⚡ Version: ${config.bot.version}
👑 Owner: ${config.owner.number}
━━━━━━━━━━━━━━━━━━━━━━━━━
💫 Rule Your Chats!` 
                    });
                }
            }
        });

    } catch (error) {
<<<<<<< HEAD
        console.error('❌ Error sending welcome message:', error.message);
        try {
            const ownerJid = config.owner.number + '@s.whatsapp.net';
            await sock.sendMessage(ownerJid, {
                text: `👑 ${config.bot.name} ONLINE!\n\nBot connected successfully!\nOwner: ${config.owner.number}\nTime: ${new Date().toLocaleString()}`
            });
        } catch (e) {
            console.error('❌ Failed to send fallback message:', e.message);
=======
        console.error('❌ Connection error:', error.message);
        sock = null;
        server.setSocket(null);
        updateWebStatus('disconnected', false);
        if (!isShuttingDown) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            await connectToWhatsApp();
>>>>>>> 50e0c99 (Initial commit: ZARA MD WhatsApp Bot)
        }
    }
}

// ===== START =====
console.log(`
╔═══════════════════════════════════╗
║     👑 ZARA MD BOT 👑            ║
║   The Queen of WhatsApp Bots      ║
║                                   ║
║   🌐 Web: http://localhost:3000   ║
║   📱 Bot starting...              ║
╚═══════════════════════════════════╝
`);

<<<<<<< HEAD
connectToWhatsApp().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
=======
// Check for pending pairing on startup
setTimeout(async () => {
    const phone = server.getPendingPhone();
    if (phone) {
        console.log(`📱 Found pending pairing request for: ${phone}`);
        await generatePairingCode(phone);
    }
}, 3000);

// Also start normal connection
connectToWhatsApp();

// ===== API ENDPOINT FOR PAIRING =====
// Override the server's pairing endpoint
const originalRequestPairing = server.app.post;
server.app.post('/api/request-pairing', async (req, res) => {
    const { phone } = req.body;
    if (!phone || phone.length < 10) {
        return res.json({ 
            success: false, 
            error: 'Valid phone number required (min 10 digits)' 
        });
    }
    
    console.log(`📱 Pairing requested for: ${phone}`);
    
    // Generate pairing code immediately
    const code = await generatePairingCode(phone);
    
    if (code) {
        return res.json({ success: true, code: code });
    } else {
        return res.json({ 
            success: false, 
            error: 'Failed to generate pairing code. Please try again.',
            pending: true 
        });
    }
});

process.on('SIGINT', () => {
    isShuttingDown = true;
    console.log('\n🛑 Bot stopped by user');
    if (reconnectTimer) clearTimeout(reconnectTimer);
    process.exit(0);
});
>>>>>>> 50e0c99 (Initial commit: ZARA MD WhatsApp Bot)
