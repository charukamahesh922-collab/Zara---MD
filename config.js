// ============================================
// 👑 ZARA MD — CONFIGURATION FILE
// ============================================

module.exports = {

    // ============ OWNER SETTINGS ============
    owner: {
        number: '91xxxxxxxxxx',      // Your WhatsApp number (without +)
        name: 'Zara Owner',
    },

    // ============ BOT SETTINGS ============
    bot: {
        name: 'ZARA MD',
        version: '1.0.0',
        prefix: '.',                  // Command prefix (e.g., .help)
        mode: 'public',               // 'public' or 'private'
    },

    // ============ LOGIN METHOD ============
    // Choose ONE: 'qr' OR 'pair'
    login: {
        method: 'qr',                 // 'qr' or 'pair'
        
        // For Pair Code method (only needed if method is 'pair')
        pair: {
            phoneNumber: '91xxxxxxxxxx',  // Your phone number with country code
            // Pair code will be auto-generated
        }
    },

    // ============ WELCOME MESSAGE ============
    welcome: {
        enabled: true,
        logoUrl: 'https://raw.githubusercontent.com/charukamahesh922-collab/Zara---MD/refs/heads/main/Img/zaramd.jpg',
        reactions: ['👑', '💖', '✨'],
    },

    // ============ DATABASE ============
    database: {
        type: 'json',                 // 'json' or 'mongodb'
        path: './database.json',
    },

    // ============ API KEYS ============
    apis: {
        openai: '',                   // Your OpenAI API key (optional)
        weather: '',                  // Weather API key (optional)
    },

    // ============ FEATURES ============
    features: {
        autoReply: true,
        stickerMaker: true,
        groupManagement: true,
        aiChat: false,                // Set true if you have OpenAI key
        antiSpam: true,
        antiLink: false,
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

╭─────────────────────────╮
│  📲 Type *ping* to test  │
│  🎨 Send image to make   │
│     a sticker            │
│  📊 Commands: /help      │
╰─────────────────────────╯

💖 *Made with ❤️ for you*`,
    }
};
