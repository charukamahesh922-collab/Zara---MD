const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');

// ===== LOAD CONFIG, DATABASE & COMMANDS =====
const config = require('./config.js');
const server = require('./server.js');
const db = require('./database.js');
const { 
    handleYTMP4, handleYTMP3,
    handleTikTok, handleFacebook, handleInstagram,
    handleTwitter, handlePinterest, handleReddit,
    handleVimeo, handleDailymotion, handleTwitch, handleSnapchat,
    handleWallpaper, handleAPK, handleRingtone
} = require('./commands/downloader');
const { 
    handleGoogle, handleWikipedia, handleWeather, handleLyrics,
    handleTranslate, handleUrban, handleIP, handleGIF, handleCalc, handleDNS
} = require('./commands/search');
const { 
    handleAI, handleImagine, handleBlackbox, handleSimi, 
    handleCharacter, handleTTS, handleAnimeAI
} = require('./commands/ai');
const { react, getUptime, formatSize, cleanFileName, footer } = require('./utils/helper');

// ===== GLOBAL VARIABLES =====
let sock = null;
let isConnected = false;
let reconnectTimer = null;
let reconnectAttempts = 0;
let isShuttingDown = false;
let pairingInProgress = false;
let botStartTime = Date.now();

// ===== DOWNLOAD DIRECTORY =====
const downloadDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

// ===== WEB FUNCTIONS =====
function updateWebQR(qr) { 
    if (qr) QRCode.toDataURL(qr, (err, url) => { if (!err) server.updateQR(url); }); 
}
function updateWebPairing(code) { 
    if (code?.length >= 8) server.updatePairingCode(code); 
}
function updateWebStatus(status, connected) { 
    server.updateStatus(status, connected); 
}

// ===== DOWNLOAD LOGO =====
async function getLogoBuffer() {
    try {
        const response = await axios.get(config.welcome.logoUrl, { responseType: 'arraybuffer', timeout: 10000 });
        return Buffer.from(response.data);
    } catch (e) { return null; }
}

// ===== SEND WELCOME =====
async function sendWelcomeMessage(sock) {
    try {
        const ownerJid = config.owner.number + '@s.whatsapp.net';
        const logoBuffer = await getLogoBuffer();
        const welcomeText = config.messages.welcome
            .replace('{botName}', config.bot.name)
            .replace('{version}', config.bot.version)
            .replace('{ownerNumber}', config.owner.number);
        
        if (logoBuffer) {
            await sock.sendMessage(ownerJid, { 
                image: logoBuffer, 
                caption: welcomeText, 
                mimetype: 'image/jpeg' 
            });
        } else {
            await sock.sendMessage(ownerJid, { text: welcomeText });
        }
    } catch (e) { 
        console.error('❌ Welcome error:', e.message); 
    }
}

// ===== MENUS =====
async function sendMainMenu(remoteJid, msgKey) {
    const logoBuffer = await getLogoBuffer();
    const menuText = `👑 *${config.bot.name}* ⚡ The Queen of WhatsApp\n\n━━━━━━━━━━━━━━━━━━━━━━━\n📌 *MAIN MENU*\n━━━━━━━━━━━━━━━━━━━━━━━\n\n*Reply with a number:*\n\n1️⃣ *Download*\n2️⃣ *Search*\n3️⃣ *AI*\n4️⃣ *Info*\n5️⃣ *Owner*\n6️⃣ *All*\n\n━━━━━━━━━━━━━━━━━━━━━━━\n💫 Rule Your Chats!\n\n${footer}`;
    try {
        if (logoBuffer) await sock.sendMessage(remoteJid, { image: logoBuffer, caption: menuText, mimetype: 'image/jpeg' });
        else await sock.sendMessage(remoteJid, { text: menuText });
        if (msgKey) await react(remoteJid, msgKey, '📋');
    } catch (e) { await sock.sendMessage(remoteJid, { text: menuText }); }
}

async function sendDownloadMenu(remoteJid) {
    const logoBuffer = await getLogoBuffer();
    const menuText = `📥 *DOWNLOAD*\n\n━━━━━━━━━━━━━━━━━━━━━━━\n📹 YouTube: .ytmp4 .video .shorts\n🎵 Audio: .ytmp3 .song .ringtone\n📱 Social: .tiktok .fb .ig .twitter .snap .reddit\n🎬 More: .vimeo .dm .twitch\n🖼️ Images: .pin .wall .apk\n\n💡 Send *menu* for main menu\n\n${footer}`;
    try { if (logoBuffer) await sock.sendMessage(remoteJid, { image: logoBuffer, caption: menuText, mimetype: 'image/jpeg' }); else await sock.sendMessage(remoteJid, { text: menuText }); } catch (e) { await sock.sendMessage(remoteJid, { text: menuText }); }
}

async function sendSearchMenu(remoteJid) {
    const logoBuffer = await getLogoBuffer();
    const menuText = `🔍 *SEARCH*\n\n━━━━━━━━━━━━━━━━━━━━━━━\n📚 .google .wiki .weather\n🎵 .lyrics .gif\n📖 .ud .tr\n🌐 .ip .dns .calc\n\n💡 Send *menu* for main menu\n\n${footer}`;
    try { if (logoBuffer) await sock.sendMessage(remoteJid, { image: logoBuffer, caption: menuText, mimetype: 'image/jpeg' }); else await sock.sendMessage(remoteJid, { text: menuText }); } catch (e) { await sock.sendMessage(remoteJid, { text: menuText }); }
}

async function sendAIMenu(remoteJid) {
    const logoBuffer = await getLogoBuffer();
    const menuText = `🤖 *AI*\n\n━━━━━━━━━━━━━━━━━━━━━━━\n💬 Chat: .ai .gpt .simi\n🎨 Image: .imagine .animeai\n💻 Code: .code\n🔊 Audio: .tts\n🎭 Roleplay: .char\n\n💡 Send *menu* for main menu\n\n${footer}`;
    try { if (logoBuffer) await sock.sendMessage(remoteJid, { image: logoBuffer, caption: menuText, mimetype: 'image/jpeg' }); else await sock.sendMessage(remoteJid, { text: menuText }); } catch (e) { await sock.sendMessage(remoteJid, { text: menuText }); }
}

async function sendInfoMenu(remoteJid) {
    const logoBuffer = await getLogoBuffer();
    const menuText = `ℹ️ *INFO*\n\n━━━━━━━━━━━━━━━━━━━━━━━\n🏓 ping\nℹ️ info\n🚀 speed\n🔧 dev\n\n💡 Send *menu* for main menu\n\n${footer}`;
    try { if (logoBuffer) await sock.sendMessage(remoteJid, { image: logoBuffer, caption: menuText, mimetype: 'image/jpeg' }); else await sock.sendMessage(remoteJid, { text: menuText }); } catch (e) { await sock.sendMessage(remoteJid, { text: menuText }); }
}

async function sendOwnerMenu(remoteJid) {
    const logoBuffer = await getLogoBuffer();
    const menuText = `👑 *OWNER*\n\n━━━━━━━━━━━━━━━━━━━━━━━\n👤 .owner\n📱 ${config.owner.number}\n🤖 ${config.bot.name}\n\n💡 Send *menu* for main menu\n\n${footer}`;
    try { if (logoBuffer) await sock.sendMessage(remoteJid, { image: logoBuffer, caption: menuText, mimetype: 'image/jpeg' }); else await sock.sendMessage(remoteJid, { text: menuText }); } catch (e) { await sock.sendMessage(remoteJid, { text: menuText }); }
}

async function sendFullMenu(remoteJid) {
    const logoBuffer = await getLogoBuffer();
    const menuText = `👑 *${config.bot.name}* - ALL COMMANDS\n\n📥 *DOWNLOAD*\n.ytmp4 .video .shorts .ytmp3 .song\n.tiktok .tt .fb .facebook .ig .insta\n.twitter .x .pin .pinterest .reddit\n.vimeo .dm .twitch .snap\n.wall .apk .ringtone\n\n🔍 *SEARCH*\n.google .wiki .weather .lyrics .gif\n.ud .tr .ip .dns .calc\n\n🤖 *AI*\n.ai .gpt .simi .imagine .animeai\n.code .tts .char\n\nℹ️ *INFO*\nping .ping info .info speed .speed\ndev .dev owner .owner\nmenu help hi hello\n\n📊 Bot: ${config.bot.name} | 🟢 Online\n⚡ v${config.bot.version} | 🕐 ${getUptime(botStartTime)}\n\n${footer}`;
    try { if (logoBuffer) await sock.sendMessage(remoteJid, { image: logoBuffer, caption: menuText, mimetype: 'image/jpeg' }); else await sock.sendMessage(remoteJid, { text: menuText }); } catch (e) { await sock.sendMessage(remoteJid, { text: menuText }); }
}

// ===== PAIRING CODE =====
async function generatePairingCode(phone) {
    if (pairingInProgress) return null;
    pairingInProgress = true;
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
            shouldSyncHistoryMessage: () => false 
        });
        
        await new Promise(r => setTimeout(r, 3000));
        const code = await tempSock.requestPairingCode(phone);
        
        if (code?.length >= 8) {
            updateWebPairing(code); 
            sock = tempSock; 
            server.setSocket(sock);
            
            tempSock.ev.on('connection.update', async (u) => {
                const { connection, qr } = u;
                if (qr) { updateWebQR(qr); qrcode.generate(qr, { small: true }); }
                if (connection === 'open') { 
                    isConnected = true; 
                    updateWebStatus('online', true); 
                    await db.save('auth_creds', state.creds);
                    if (config.welcome.enabled) await sendWelcomeMessage(tempSock); 
                }
                if (connection === 'close') { 
                    isConnected = false; 
                    if (!isShuttingDown) setTimeout(async () => { await connectToWhatsApp(); }, 5000); 
                }
            });
            
            tempSock.ev.on('creds.update', async () => {
                await saveCreds();
                if (state.creds?.me) await db.save('auth_creds', state.creds);
            });
            
            pairingInProgress = false;
            return code;
        }
        pairingInProgress = false;
        return null;
    } catch (e) { 
        pairingInProgress = false; 
        console.error('Pairing error:', e.message);
        return null; 
    }
}

// ===== RESTORE SESSION FROM DATABASE =====
async function restoreSession() {
    try {
        const savedCreds = await db.get('auth_creds');
        if (savedCreds) {
            const authDir = path.join(__dirname, 'auth_info');
            if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
            
            fs.writeFileSync(path.join(authDir, 'creds.json'), JSON.stringify(savedCreds, null, 2));
            console.log('✅ Session restored from database');
            return true;
        }
    } catch (e) {
        console.error('❌ Failed to restore session:', e.message);
    }
    return false;
}

// ===== CONNECT TO WHATSAPP =====
async function connectToWhatsApp() {
    if (sock || isShuttingDown) return;
    try {
        await restoreSession();
        
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
            syncFullHistory: false, 
            shouldSyncHistoryMessage: () => false 
        });
        server.setSocket(sock);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            if (qr) { 
                updateWebQR(qr); 
                qrcode.generate(qr, { small: true }); 
                reconnectAttempts = 0; 
            }
            if (connection === 'open') { 
                isConnected = true; 
                botStartTime = Date.now(); 
                reconnectAttempts = 0; 
                updateWebStatus('online', true); 
                console.log(`\n✅ ${config.bot.name} IS ONLINE!`); 
                
                // Save session to database
                await db.save('auth_creds', state.creds);
                await db.save('last_connected', Date.now());
                
                if (config.welcome.enabled) await sendWelcomeMessage(sock); 
            }
            if (connection === 'close') { 
                isConnected = false; 
                sock = null; 
                server.setSocket(null); 
                updateWebStatus('disconnected', false); 
                const sc = lastDisconnect?.error?.output?.statusCode; 
                if (sc !== DisconnectReason.loggedOut && !isShuttingDown) { 
                    const d = Math.min(30000, 5000 * (reconnectAttempts + 1)); 
                    reconnectAttempts++; 
                    console.log(`⏳ Reconnecting in ${d/1000}s...`); 
                    reconnectTimer = setTimeout(async () => { 
                        reconnectTimer = null; 
                        await connectToWhatsApp(); 
                    }, d); 
                }
            }
        });

        sock.ev.on('creds.update', async () => {
            await saveCreds();
            if (state.creds?.me) {
                await db.save('auth_creds', state.creds);
            }
        });

        // ===== MESSAGE HANDLER =====
        sock.ev.on('messages.upsert', async (m) => {
            if (!isConnected || !sock) return;
            for (const msg of m.messages) {
                if (!msg.message) continue;
                let text = '';
                if (msg.message.conversation) text = msg.message.conversation;
                else if (msg.message.extendedTextMessage) text = msg.message.extendedTextMessage.text || '';
                else if (msg.message.imageMessage) text = msg.message.imageMessage.caption || '';
                else if (msg.message.videoMessage) text = msg.message.videoMessage.caption || '';
                else continue;
                if (!text) continue;
                
                const lowerText = text.trim().toLowerCase();
                const fromMe = msg.key.fromMe;
                const remoteJid = msg.key.remoteJid;
                const ownerNumber = config.owner.number;
                let isOwnerMessage = false;
                if (fromMe && remoteJid.includes('@lid')) isOwnerMessage = true;
                else if (fromMe && remoteJid.includes(ownerNumber)) isOwnerMessage = true;
                else if (!fromMe && remoteJid.split('@')[0] === ownerNumber) isOwnerMessage = true;
                if (!isOwnerMessage) continue;
                
                console.log(`📩 ${text}`);
                await react(remoteJid, msg.key, '⚡');

                // MENU NUMBERS
                if (lowerText === '1') { await sendDownloadMenu(remoteJid); continue; }
                if (lowerText === '2') { await sendSearchMenu(remoteJid); continue; }
                if (lowerText === '3') { await sendAIMenu(remoteJid); continue; }
                if (lowerText === '4') { await sendInfoMenu(remoteJid); continue; }
                if (lowerText === '5') { await sendOwnerMenu(remoteJid); continue; }
                if (lowerText === '6') { await sendFullMenu(remoteJid); continue; }

                // MENU
                if (['help','.help','/help','menu','.menu','/menu','!help','!menu'].includes(lowerText)) { await sendMainMenu(remoteJid, msg.key); continue; }

                // PING
                if (['ping','.ping','/ping','!ping'].includes(lowerText)) {
                    await react(remoteJid, msg.key, '🏓');
                    const rt = Date.now() - (msg.messageTimestamp * 1000);
                    await sock.sendMessage(remoteJid, { text: `🏓 *P O N G !*\n\n───────────────────────\n✅ Status : Online\n⏱️ Response : ${rt}ms\n⚡ Version : ${config.bot.version}\n🕐 Uptime : ${getUptime(botStartTime)}\n───────────────────────\n\n⚡ Lightning Fast!\n\n${footer}` });
                    continue;
                }

                // INFO
                if (['info','.info','/info','!info'].includes(lowerText)) {
                    await react(remoteJid, msg.key, 'ℹ️');
                    const dbStatus = config.database.enabled ? '✅ Enabled' : '❌ Disabled';
                    await sock.sendMessage(remoteJid, { text: `ℹ️ *B O T I N F O*\n\n───────────────────────\n🤖 Name : ${config.bot.name}\n📌 Version : ${config.bot.version}\n🟢 Status : Online\n⚡ Platform : Baileys\n💾 Database : ${dbStatus}\n📡 Port : ${config.port}\n\n📊 *SYSTEM*\n🕐 Uptime : ${getUptime(botStartTime)}\n💾 Memory : ${(process.memoryUsage().heapUsed/1024/1024).toFixed(2)} MB\n🖥️ Platform : ${process.platform}\n⚙️ Node.js : ${process.version}\n\n📅 ${new Date().toLocaleDateString()} ⏰ ${new Date().toLocaleTimeString()}\n\n${footer}` });
                    continue;
                }

                // OWNER
                if (['owner','.owner','/owner','!owner'].includes(lowerText)) {
                    await react(remoteJid, msg.key, '👑');
                    await sock.sendMessage(remoteJid, { text: `👑 *OWNER*\n\n───────────────────────\n📱 Number : ${config.owner.number}\n🤖 Bot : ${config.bot.name}\n📌 Version : ${config.bot.version}\n🟢 Status : Online\n🕐 Uptime : ${getUptime(botStartTime)}\n\n💫 Created with ❤️\n\n${footer}` });
                    continue;
                }

                // DEV
                if (['dev','.dev','/dev','!dev','developer','.developer'].includes(lowerText)) {
                    await react(remoteJid, msg.key, '🔧');
                    await sock.sendMessage(remoteJid, { text: `🔧 *DEVELOPER*\n\n───────────────────────\n📱 Name : Charuka Mahesh\n💛 Family : Umesha & Mithila & Sharada\n🤖 Bot : ${config.bot.name}\n⚡ Version : ${config.bot.version}\n\n💫 Made with Love!\n\n${footer}` });
                    continue;
                }

                // SPEED
                if (['speed','.speed','/speed','!speed'].includes(lowerText)) {
                    await react(remoteJid, msg.key, '🚀');
                    const rt = Date.now() - (msg.messageTimestamp * 1000);
                    const stars = rt < 500 ? '🌟🌟🌟🌟🌟' : rt < 1000 ? '🌟🌟🌟🌟' : rt < 2000 ? '🌟🌟🌟' : '🌟🌟';
                    await sock.sendMessage(remoteJid, { text: `🚀 *SPEED TEST*\n\n───────────────────────\n⏱️ Response : ${rt}ms\n⚡ Rating : ${stars}\n🟢 Status : Online\n📡 Port : ${config.port}\n🕐 Uptime : ${getUptime(botStartTime)}\n\n💫 Speed Demon!\n\n${footer}` });
                    continue;
                }

                // HI/HELLO
                if (['hi','hello','hey'].includes(lowerText)) {
                    await react(remoteJid, msg.key, '👋');
                    const g = [`👋 *HELLO!*\n\n✨ I'm ${config.bot.name}!\n💫 Your WhatsApp Assistant\n\nSend *menu* for commands.\n\n${footer}`,`✨ *HEY THERE!*\n\n👑 ${config.bot.name} at your service!\n⚡ Ready to assist\n\nSend *menu* for features.\n\n${footer}`,`💖 *HI!*\n\n🌟 Welcome back!\n🤖 ${config.bot.name} is online\n\nUse *help* to explore.\n\n${footer}`];
                    await sock.sendMessage(remoteJid, { text: g[Math.floor(Math.random()*g.length)] });
                    continue;
                }

                // === DOWNLOAD COMMANDS ===
                if (lowerText.startsWith('.ytmp4 ')||lowerText.startsWith('.video ')||lowerText.startsWith('/ytmp4 ')||lowerText.startsWith('/video ')||lowerText.startsWith('.shorts ')||lowerText.startsWith('.ytv ')||lowerText.startsWith('/shorts ')||lowerText.startsWith('/ytv ')) {
                    const q = text.split(' ').slice(1).join(' ').trim();
                    if (q) handleYTMP4(sock, msg, q, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing query!\n\n📌 .ytmp4 <link/name>\n\n${footer}` });
                    continue;
                }
                if (lowerText.startsWith('.ytmp3 ')||lowerText.startsWith('.song ')||lowerText.startsWith('/ytmp3 ')||lowerText.startsWith('/song ')) {
                    const q = text.split(' ').slice(1).join(' ').trim();
                    if (q) handleYTMP3(sock, msg, q, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing query!\n\n📌 .ytmp3 <link/name>\n\n${footer}` });
                    continue;
                }
                if (lowerText.startsWith('.tiktok ')||lowerText.startsWith('.tt ')||lowerText.startsWith('/tiktok ')||lowerText.startsWith('/tt ')) { const u = text.split(' ').slice(1).join(' ').trim(); if (u) handleTikTok(sock, msg, u, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing URL!\n\n📌 .tiktok <url>\n\n${footer}` }); continue; }
                if (lowerText.startsWith('.fb ')||lowerText.startsWith('.facebook ')||lowerText.startsWith('/fb ')||lowerText.startsWith('/facebook ')) { const u = text.split(' ').slice(1).join(' ').trim(); if (u) handleFacebook(sock, msg, u, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing URL!\n\n📌 .fb <url>\n\n${footer}` }); continue; }
                if (lowerText.startsWith('.ig ')||lowerText.startsWith('.insta ')||lowerText.startsWith('/ig ')||lowerText.startsWith('/insta ')) { const u = text.split(' ').slice(1).join(' ').trim(); if (u) handleInstagram(sock, msg, u, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing URL!\n\n📌 .ig <url>\n\n${footer}` }); continue; }
                if (lowerText.startsWith('.twitter ')||lowerText.startsWith('.x ')||lowerText.startsWith('/twitter ')||lowerText.startsWith('/x ')) { const u = text.split(' ').slice(1).join(' ').trim(); if (u) handleTwitter(sock, msg, u, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing URL!\n\n📌 .twitter <url>\n\n${footer}` }); continue; }
                if (lowerText.startsWith('.pin ')||lowerText.startsWith('.pinterest ')||lowerText.startsWith('/pin ')||lowerText.startsWith('/pinterest ')) { const u = text.split(' ').slice(1).join(' ').trim(); if (u) handlePinterest(sock, msg, u, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing URL!\n\n📌 .pin <pinterest-url>\n\n${footer}` }); continue; }
                if (lowerText.startsWith('.reddit ')||lowerText.startsWith('/reddit ')) { const u = text.split(' ').slice(1).join(' ').trim(); if (u) handleReddit(sock, msg, u, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing URL!\n\n📌 .reddit <url>\n\n${footer}` }); continue; }
                if (lowerText.startsWith('.vimeo ')||lowerText.startsWith('/vimeo ')) { const u = text.split(' ').slice(1).join(' ').trim(); if (u) handleVimeo(sock, msg, u, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing URL!\n\n📌 .vimeo <url>\n\n${footer}` }); continue; }
                if (lowerText.startsWith('.dm ')||lowerText.startsWith('.dailymotion ')||lowerText.startsWith('/dm ')||lowerText.startsWith('/dailymotion ')) { const u = text.split(' ').slice(1).join(' ').trim(); if (u) handleDailymotion(sock, msg, u, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing URL!\n\n📌 .dm <url>\n\n${footer}` }); continue; }
                if (lowerText.startsWith('.twitch ')||lowerText.startsWith('/twitch ')) { const u = text.split(' ').slice(1).join(' ').trim(); if (u) handleTwitch(sock, msg, u, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing URL!\n\n📌 .twitch <url>\n\n${footer}` }); continue; }
                if (lowerText.startsWith('.snap ')||lowerText.startsWith('.snapchat ')||lowerText.startsWith('/snap ')||lowerText.startsWith('/snapchat ')) { const u = text.split(' ').slice(1).join(' ').trim(); if (u) handleSnapchat(sock, msg, u, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing URL!\n\n📌 .snap <url>\n\n${footer}` }); continue; }
                if (lowerText.startsWith('.wall ')||lowerText.startsWith('.wallpaper ')||lowerText.startsWith('/wall ')||lowerText.startsWith('/wallpaper ')) { const q = text.split(' ').slice(1).join(' ').trim(); if (q) handleWallpaper(sock, msg, q, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing query!\n\n📌 .wall <keyword>\n\n${footer}` }); continue; }
                if (lowerText.startsWith('.apk ')||lowerText.startsWith('/apk ')) { const q = text.split(' ').slice(1).join(' ').trim(); if (q) handleAPK(sock, msg, q, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing app name!\n\n📌 .apk <app name>\n\n${footer}` }); continue; }
                if (lowerText.startsWith('.ringtone ')||lowerText.startsWith('.ring ')||lowerText.startsWith('/ringtone ')||lowerText.startsWith('/ring ')) { const q = text.split(' ').slice(1).join(' ').trim(); if (q) handleRingtone(sock, msg, q, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing query!\n\n📌 .ringtone <name>\n\n${footer}` }); continue; }

                // === SEARCH COMMANDS ===
                if (lowerText.startsWith('.google ')||lowerText.startsWith('.search ')||lowerText.startsWith('/google ')||lowerText.startsWith('/search ')) { const q = text.split(' ').slice(1).join(' ').trim(); if (q) handleGoogle(sock, msg, q, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing query!\n\n📌 .google <query>\n\n${footer}` }); continue; }
                if (lowerText.startsWith('.wiki ')||lowerText.startsWith('.wikipedia ')||lowerText.startsWith('/wiki ')||lowerText.startsWith('/wikipedia ')) { const q = text.split(' ').slice(1).join(' ').trim(); if (q) handleWikipedia(sock, msg, q, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing topic!\n\n📌 .wiki <topic>\n\n${footer}` }); continue; }
                if (lowerText.startsWith('.weather ')||lowerText.startsWith('/weather ')) { const q = text.split(' ').slice(1).join(' ').trim(); if (q) handleWeather(sock, msg, q, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing city!\n\n📌 .weather <city>\n\n${footer}` }); continue; }
                if (lowerText.startsWith('.lyrics ')||lowerText.startsWith('/lyrics ')) { const q = text.split(' ').slice(1).join(' ').trim(); if (q) handleLyrics(sock, msg, q, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing song!\n\n📌 .lyrics <song>\n\n${footer}` }); continue; }
                if (lowerText.startsWith('.tr ')||lowerText.startsWith('.translate ')||lowerText.startsWith('/tr ')||lowerText.startsWith('/translate ')) { handleTranslate(sock, msg, text, botStartTime); continue; }
                if (lowerText.startsWith('.ud ')||lowerText.startsWith('.urban ')||lowerText.startsWith('/ud ')||lowerText.startsWith('/urban ')) { const q = text.split(' ').slice(1).join(' ').trim(); if (q) handleUrban(sock, msg, q, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing word!\n\n📌 .ud <word>\n\n${footer}` }); continue; }
                if (lowerText.startsWith('.ip ')||lowerText.startsWith('/ip ')) { const q = text.split(' ').slice(1).join(' ').trim(); if (q) handleIP(sock, msg, q, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing IP!\n\n📌 .ip 8.8.8.8\n\n${footer}` }); continue; }
                if (lowerText.startsWith('.gif ')||lowerText.startsWith('/gif ')) { const q = text.split(' ').slice(1).join(' ').trim(); if (q) handleGIF(sock, msg, q, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing query!\n\n📌 .gif <keyword>\n\n${footer}` }); continue; }
                if (lowerText.startsWith('.calc ')||lowerText.startsWith('.math ')||lowerText.startsWith('/calc ')||lowerText.startsWith('/math ')) { const q = text.split(' ').slice(1).join(' ').trim(); if (q) handleCalc(sock, msg, q, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing expression!\n\n📌 .calc 2+2*3\n\n${footer}` }); continue; }
                if (lowerText.startsWith('.dns ')||lowerText.startsWith('.whois ')||lowerText.startsWith('/dns ')||lowerText.startsWith('/whois ')) { const q = text.split(' ').slice(1).join(' ').trim(); if (q) handleDNS(sock, msg, q, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing domain!\n\n📌 .dns example.com\n\n${footer}` }); continue; }

                // === AI COMMANDS ===
                if (lowerText.startsWith('.ai ')||lowerText.startsWith('.gpt ')||lowerText.startsWith('/ai ')||lowerText.startsWith('/gpt ')) { const q = text.split(' ').slice(1).join(' ').trim(); if (q) handleAI(sock, msg, q, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing query!\n\n📌 .ai <question>\n\n${footer}` }); continue; }
                if (lowerText.startsWith('.imagine ')||lowerText.startsWith('.draw ')||lowerText.startsWith('.gen ')||lowerText.startsWith('/imagine ')||lowerText.startsWith('/draw ')||lowerText.startsWith('/gen ')) { const q = text.split(' ').slice(1).join(' ').trim(); if (q) handleImagine(sock, msg, q, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing prompt!\n\n📌 .imagine <description>\n\n${footer}` }); continue; }
                if (lowerText.startsWith('.code ')||lowerText.startsWith('.bb ')||lowerText.startsWith('/code ')||lowerText.startsWith('/bb ')) { const q = text.split(' ').slice(1).join(' ').trim(); if (q) handleBlackbox(sock, msg, q, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing query!\n\n📌 .code <question>\n\n${footer}` }); continue; }
                if (lowerText.startsWith('.simi ')||lowerText.startsWith('/simi ')) { const q = text.split(' ').slice(1).join(' ').trim(); if (q) handleSimi(sock, msg, q, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing message!\n\n📌 .simi <message>\n\n${footer}` }); continue; }
                if (lowerText.startsWith('.char ')||lowerText.startsWith('/char ')) { const q = text.split(' ').slice(1).join(' ').trim(); if (q) handleCharacter(sock, msg, q, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing query!\n\n📌 .char <name>|<message>\n\n${footer}` }); continue; }
                if (lowerText.startsWith('.tts ')||lowerText.startsWith('.speak ')||lowerText.startsWith('/tts ')||lowerText.startsWith('/speak ')) { const q = text.split(' ').slice(1).join(' ').trim(); if (q) handleTTS(sock, msg, q, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing text!\n\n📌 .tts <text>\n\n${footer}` }); continue; }
                if (lowerText.startsWith('.animeai ')||lowerText.startsWith('/animeai ')) { const q = text.split(' ').slice(1).join(' ').trim(); if (q) handleAnimeAI(sock, msg, q, botStartTime); else await sock.sendMessage(remoteJid, { text: `❌ Missing prompt!\n\n📌 .animeai <description>\n\n${footer}` }); continue; }
            }
        });

        console.log('✅ Message handler registered successfully!');
    } catch (error) {
        console.error('❌ Connection error:', error.message);
        sock = null; server.setSocket(null);
        if (!isShuttingDown) { 
            await new Promise(r => setTimeout(r, 10000)); 
            await connectToWhatsApp(); 
        }
    }
}

// ===== STARTUP =====
async function startBot() {
    console.log(`\n╔═══════════════════════════════════╗`);
    console.log(`║     👑 ${config.bot.name} BOT 👑            ║`);
    console.log(`║   The Queen of WhatsApp Bots      ║`);
    console.log(`║   🌐 Port: ${config.port}                  ║`);
    console.log(`║   console.log(`║   💾 Storage: Railway Volume (Persistent)           ║`);
    console.log(`║   📱 Bot starting...              ║`);
    console.log(`╚═══════════════════════════════════╝\n`);
    
    // Initialize database
    await db.connect();
    
    // Start WhatsApp connection
    setTimeout(async () => { 
        const phone = server.getPendingPhone(); 
        if (phone) await generatePairingCode(phone); 
    }, 3000);
    
    connectToWhatsApp();
}

// ===== API ROUTES =====
server.app.post('/api/request-pairing', async (req, res) => { 
    const { phone } = req.body; 
    if (!phone || phone.length < 10) return res.json({ success: false, error: 'Valid phone number required' }); 
    const code = await generatePairingCode(phone); 
    if (code) return res.json({ success: true, code }); 
    else return res.json({ success: false, error: 'Failed', pending: true }); 
});

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGINT', async () => { 
    console.log('\n🛑 Shutting down...');
    isShuttingDown = true; 
    if (reconnectTimer) clearTimeout(reconnectTimer); 
    await db.disconnect();
    process.exit(0); 
});

process.on('SIGTERM', async () => { 
    console.log('\n🛑 Shutting down...');
    isShuttingDown = true; 
    if (reconnectTimer) clearTimeout(reconnectTimer); 
    await db.disconnect();
    process.exit(0); 
});

// ===== START =====
startBot();
