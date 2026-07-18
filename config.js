// ============================================
// 👑 ZARA MD — CONFIGURATION FILE
// ============================================

module.exports = {
    // Owner Settings
    owner: {
        number: '94762471350',
        name: 'Zara Owner',
    },

    // Bot Settings
    bot: {
        name: 'ZARA MD',
        version: '2.0.0',
        prefix: '.',
        mode: 'public',
    },

    // Web Interface
    webInterface: true,
    port: process.env.PORT || 3000,
    
    // Login Method: 'qr' or 'pair'
    loginMethod: 'qr',

    // Welcome Message
    welcome: {
        enabled: true,
        logoUrl: 'https://raw.githubusercontent.com/charukamahesh922-collab/Zara---MD/refs/heads/main/Img/zaramd.jpg',
        reactions: ['👑', '💖', '✨'],
    },

    // Messages
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

✨ "Royalty meets code." ✨
━━━━━━━━━━━━━━━━━━━━━━━━━
💫 ZARA MD — Rule Your Chats!

Ｂʏ Ｃʜᴀʀᴜᴋᴀ Ｍᴀʜᴇꜱʜ
💛 Umesha & Mithila & Sharada`
    },
};
