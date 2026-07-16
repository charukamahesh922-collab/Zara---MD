// ============================================
// 👑 ZARA MD — CONFIGURATION FILE
// ============================================

module.exports = {
    // ============ OWNER SETTINGS ============
    owner: {
<<<<<<< HEAD
        number: '91xxxxxxxxxx',      // REPLACE WITH YOUR NUMBER (without +)
=======
        number: '94784745155',      // Your WhatsApp number (without +)
>>>>>>> 50e0c99 (Initial commit: ZARA MD WhatsApp Bot)
        name: 'Zara Owner',
    },

    // ============ BOT SETTINGS ============
    bot: {
        name: 'ZARA MD',
        version: '1.0.0',
<<<<<<< HEAD
        prefix: '.',                  // Command prefix (e.g., .help)
        mode: 'public',
=======
        prefix: '.',
        mode: 'public',              // 'public' or 'private'
>>>>>>> 50e0c99 (Initial commit: ZARA MD WhatsApp Bot)
    },

    // ============ WEB INTERFACE ============
    webInterface: true,              // true = Web UI | false = Console only

    // ============ LOGIN METHOD ============
<<<<<<< HEAD
    // This is now asked at runtime, but you can set a default here
    login: {
        defaultMethod: 'qr',          // 'qr' or 'pair' (fallback if user doesn't choose)
    },
=======
    // Only used if webInterface is false
    loginMethod: 'qr',               // 'qr' or 'pair'
>>>>>>> 50e0c99 (Initial commit: ZARA MD WhatsApp Bot)

    // ============ WELCOME MESSAGE ============
    welcome: {
        enabled: true,
        logoUrl: 'https://raw.githubusercontent.com/charukamahesh922-collab/Zara---MD/refs/heads/main/Img/zaramd.jpg',
        reactions: ['👑', '💖', '✨'],
    },

    // ============ MESSAGES ============
    messages: {
        welcome: `╔═══════════════════════════╗
║     👑 ZARA MD 👑        ║
║   The Queen of Bots       ║
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