const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeInMemoryStore } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const qrcode = require('qrcode-terminal');
const readline = require('readline');  // For user input

// ==================== LOAD CONFIG ====================
const config = require('./config.js');

// ==================== USER INPUT HELPER ====================
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function askQuestion(query) {
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
}

// ==================== GET LOGIN METHOD FROM USER ====================
async function getLoginMethod() {
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
    rl.close();

    if (answer.trim() === '2') {
        const phone = await askQuestion('Enter your phone number (with country code, e.g., 91xxxxxxxxxx): ');
        return { method: 'pair', phone: phone.trim() };
    }
    
    return { method: 'qr', phone: null };
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
    // Get login method from user
    const loginChoice = await getLoginMethod();
    
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        printQRInTerminal: loginChoice.method === 'qr',
        auth: state,
        browser: [config.bot.name, 'Chrome', config.bot.version],
        // For pairing
        phone: loginChoice.method === 'pair' ? loginChoice.phone : undefined,
    });

    // ============ HANDLE PAIRING CODE ============
    if (loginChoice.method === 'pair') {
        console.log('\n⏳ Requesting pairing code...');
        // Wait for socket to be ready
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(loginChoice.phone);
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
                // Fallback to QR
                sock.printQRInTerminal = true;
            }
        }, 3000);
    }

    // ============ CONNECTION EVENTS ============
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // --- SHOW QR CODE ---
        if (qr && loginChoice.method === 'qr') {
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
                connectToWhatsApp();
            } else {
                console.log('❌ Logged out. Please restart the bot.');
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // ============ MESSAGE HANDLER ============
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const sender = msg.key.participant || msg.key.remoteJid;

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
╚═══════════════════════════╝

📌 *Available Commands:*
━━━━━━━━━━━━━━━━━━━━━━━━━
${config.bot.prefix}help  - Show this menu
ping          - Check bot status
sticker       - Make sticker (reply to image)
${config.bot.prefix}info  - Bot information

━━━━━━━━━━━━━━━━━━━━━━━━━
✨ ${config.bot.name} — Rule Your Chats!`;

            await sock.sendMessage(from, { text: helpText });
        }
    });

    return sock;
}

// ==================== WELCOME MESSAGE ====================
async function sendWelcomeMessage(sock) {
    try {
        const ownerJid = config.owner.number + '@s.whatsapp.net';

        // --- DOWNLOAD LOGO ---
        let logoBuffer = null;
        try {
            const response = await axios.get(config.welcome.logoUrl, { responseType: 'arraybuffer' });
            logoBuffer = Buffer.from(response.data);
        } catch (error) {
            console.log('⚠️ Logo download failed, sending text only');
        }

        // --- PREPARE WELCOME TEXT ---
        const welcomeText = config.messages.welcome
            .replace(/{botName}/g, config.bot.name)
            .replace(/{version}/g, config.bot.version)
            .replace(/{ownerNumber}/g, config.owner.number);

        // --- SEND IMAGE WITH CAPTION ---
        let sentMsg;
        if (logoBuffer) {
            sentMsg = await sock.sendMessage(ownerJid, {
                image: logoBuffer,
                caption: welcomeText,
                mimetype: 'image/jpeg',
            });
        } else {
            sentMsg = await sock.sendMessage(ownerJid, { text: welcomeText });
        }

        // --- ADD REACTIONS ---
        for (const emoji of config.welcome.reactions) {
            await sock.sendMessage(ownerJid, {
                react: {
                    text: emoji,
                    key: sentMsg.key,
                }
            });
            // Small delay between reactions
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // --- SEND BEAUTIFUL MESSAGE ---
        const beautifulText = config.messages.beautiful;
        const sentBeautiful = await sock.sendMessage(ownerJid, { text: beautifulText });

        // Add reaction to beautiful message
        await sock.sendMessage(ownerJid, {
            react: {
                text: '💖',
                key: sentBeautiful.key,
            }
        });

        console.log('📨 Welcome message sent to owner!');

    } catch (error) {
        console.error('❌ Error sending welcome message:', error.message);
        // Fallback
        try {
            const ownerJid = config.owner.number + '@s.whatsapp.net';
            await sock.sendMessage(ownerJid, {
                text: `👑 ${config.bot.name} ONLINE!\n\nBot connected successfully!\nOwner: ${config.owner.number}\nTime: ${new Date().toLocaleString()}`
            });
        } catch (e) {
            console.error('❌ Failed to send fallback message:', e.message);
        }
    }
}

// ==================== START BOT ====================
console.log(`
╔═══════════════════════════════════╗
║                                   ║
║     👑 ZARA MD BOT 👑            ║
║   The Queen of WhatsApp Bots      ║
║                                   ║
║   Starting up... Please wait      ║
║                                   ║
╚═══════════════════════════════════╝
`);

connectToWhatsApp().catch(err => {
    console.error('❌ Fatal error:', err);
});

// ==================== SAVE CONFIG TO FILE ====================
// This allows you to update config from the bot itself
function saveConfig(newConfig) {
    const content = `module.exports = ${JSON.stringify(newConfig, null, 4)};`;
    fs.writeFileSync('./config.js', content);
    console.log('✅ Config saved!');
}
