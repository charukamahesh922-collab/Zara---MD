const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');

// ===== LOAD CONFIG =====
const config = require('./config.js');
const server = require('./server.js');

// ===== GLOBAL VARIABLES =====
let sock = null;
let isConnected = false;
let reconnectTimer = null;
let reconnectAttempts = 0;
let isShuttingDown = false;
let pairingInProgress = false;

// ===== REACTION MAP =====
async function addReactionToMessage(jid, key, emoji) {
    try {
        if (key && emoji && sock) {
            await sock.sendMessage(jid, {
                react: { text: emoji, key: key }
            });
            console.log(`✅ Reaction added: ${emoji}`);
        }
    } catch (error) {
        console.log(`⚠️ Failed to add reaction: ${error.message}`);
    }
}

// ===== WEB FUNCTIONS =====
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

// ===== SEND WELCOME MESSAGE =====
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
            console.log('⚠️ Logo download failed, sending text only');
        }

        let welcomeText = config.messages.welcome
            .replace(/{botName}/g, config.bot.name)
            .replace(/{version}/g, config.bot.version)
            .replace(/{ownerNumber}/g, config.owner.number);

        let sentMsg;
        
        if (logoBuffer) {
            try {
                sentMsg = await sock.sendMessage(ownerJid, { 
                    image: logoBuffer, 
                    caption: welcomeText, 
                    mimetype: 'image/jpeg',
                    thumbnail: logoBuffer
                });
                console.log('📨 Welcome message sent with image!');
            } catch (imageError) {
                console.log('⚠️ Image send failed, sending text only');
                sentMsg = await sock.sendMessage(ownerJid, { text: welcomeText });
                console.log('📨 Welcome message sent as text!');
            }
        } else {
            sentMsg = await sock.sendMessage(ownerJid, { text: welcomeText });
            console.log('📨 Welcome message sent as text!');
        }

        if (sentMsg && sentMsg.key) {
            for (const emoji of config.welcome.reactions) {
                try {
                    await sock.sendMessage(ownerJid, { 
                        react: { text: emoji, key: sentMsg.key } 
                    });
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (reactError) {}
            }
        }

        console.log('📨 Welcome message sent to owner!');

    } catch (error) {
        console.error('❌ Welcome error:', error.message);
        try {
            const ownerJid = config.owner.number + '@s.whatsapp.net';
            await sock.sendMessage(ownerJid, { 
                text: `👑 ${config.bot.name} is ONLINE!\n\nBot connected successfully!\nTime: ${new Date().toLocaleString()}`
            });
            console.log('📨 Fallback message sent');
        } catch (e) {
            console.error('❌ All message attempts failed:', e.message);
        }
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
        const { state, saveCreds } = await useMultiFileAuthState('auth_info');
        
        const tempSock = makeWASocket({
            auth: state,
            browser: [config.bot.name, 'Chrome', config.bot.version],
            markOnlineOnConnect: false,
            connectTimeoutMs: 30000,
            defaultQueryTimeoutMs: 30000,
            keepAliveIntervalMs: 30000,
            version: [2, 2403, 2],
            generateHighQualityLinkPreview: false,
            shouldSyncHistoryMessage: () => false,
        });

        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const code = await tempSock.requestPairingCode(phone);
        
        if (code && code.length >= 8) {
            console.log(`✅ Pairing code generated: ${code}`);
            updateWebPairing(code);
            
            sock = tempSock;
            server.setSocket(sock);
            
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
                    console.log(`\n✅ ${config.bot.name} IS ONLINE!`);
                    
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

// ===== CHECK IF USER IS OWNER =====
function isOwner(jid) {
    if (!jid) return false;
    const cleanJid = jid.split('@')[0];
    const ownerNumber = config.owner.number;
    return cleanJid === ownerNumber;
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
            browser: [config.bot.name, 'Chrome', config.bot.version],
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
                console.log(`👑 SCAN QR CODE AT: http://localhost:3000`);
                console.log('========================================\n');
                qrcode.generate(qr, { small: true });
                reconnectAttempts = 0;
            }

            if (connection === 'open') {
                isConnected = true;
                reconnectAttempts = 0;
                updateWebStatus('online', true);
                
                console.log(`\n✅ ${config.bot.name} IS ONLINE!`);
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

        // ===== MESSAGE HANDLER (FIXED) =====
        sock.ev.on('messages.upsert', async (m) => {
            if (!isConnected || !sock) return;
            
            for (const msg of m.messages) {
                if (!msg.message || msg.key.fromMe) continue;

                const from = msg.key.remoteJid;
                const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
                const lowerText = text.trim().toLowerCase();
                const messageKey = msg.key;
                
                // Debug log
                console.log(`📩 Received: "${text}" from: ${from}`);
                
                // ===== CHECK IF OWNER =====
                if (!isOwner(from)) {
                    console.log(`⛔ Unauthorized: ${from}`);
                    continue;
                }
                
                console.log(`✅ Authorized owner: ${from}`);
                
                // ===== PING COMMAND =====
                if (lowerText === 'ping' || lowerText === '.ping') {
                    console.log('🏓 Pong command received!');
                    await addReactionToMessage(from, messageKey, '🏓');
                    await sock.sendMessage(from, { 
                        text: `🏓 Pong! ${config.bot.name} is alive!\n⏱️ ${Date.now() - msg.messageTimestamp * 1000}ms` 
                    });
                }

                // ===== HELP COMMAND =====
                if (lowerText === 'help' || lowerText === '.help' || lowerText === '/help' || lowerText === 'menu' || lowerText === '.menu' || lowerText === '/menu') {
                    console.log('📋 Help command received!');
                    await addReactionToMessage(from, messageKey, '📋');
                    await sock.sendMessage(from, { 
                        text: `👑 ${config.bot.name}
━━━━━━━━━━━━━━━━━━━━━━━━━
📌 Available Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━
ping / .ping   - Check bot status
help / .help   - Show this menu
info / .info   - Show bot info
menu / .menu   - Show this menu
━━━━━━━━━━━━━━━━━━━━━━━━━
📱 Status: Online 🟢
⚡ Version: ${config.bot.version}
━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Rule Your Chats!` 
                    });
                }

                // ===== INFO COMMAND =====
                if (lowerText === 'info' || lowerText === '.info' || lowerText === '/info') {
                    console.log('ℹ️ Info command received!');
                    await addReactionToMessage(from, messageKey, 'ℹ️');
                    await sock.sendMessage(from, { 
                        text: `👑 ${config.bot.name}
━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Name: ${config.bot.name}
📱 Status: Online 🟢
⚡ Version: ${config.bot.version}
👑 Owner: ${config.owner.number}
📡 Web: http://localhost:3000
━━━━━━━━━━━━━━━━━━━━━━━━━
💫 Rule Your Chats!` 
                    });
                }
            }
        });

    } catch (error) {
        console.error('❌ Connection error:', error.message);
        sock = null;
        server.setSocket(null);
        updateWebStatus('disconnected', false);
        if (!isShuttingDown) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            await connectToWhatsApp();
        }
    }
}

// ===== START =====
console.log(`
╔═══════════════════════════════════╗
║     👑 ${config.bot.name} BOT 👑            ║
║   The Queen of WhatsApp Bots      ║
║                                   ║
║   🌐 Web: http://localhost:3000   ║
║   📱 Bot starting...              ║
╚═══════════════════════════════════╝
`);

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
server.app.post('/api/request-pairing', async (req, res) => {
    const { phone } = req.body;
    if (!phone || phone.length < 10) {
        return res.json({ 
            success: false, 
            error: 'Valid phone number required (min 10 digits)' 
        });
    }
    
    console.log(`📱 Pairing requested for: ${phone}`);
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