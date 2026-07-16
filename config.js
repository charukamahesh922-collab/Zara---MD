// ============================================
// 👑 ZARA MD — CONFIGURATION FILE
// ============================================

module.exports = {

    // ============ OWNER SETTINGS ============
    owner: {
        number: '91xxxxxxxxxx',      // REPLACE WITH YOUR NUMBER (without +)
        name: 'Zara Owner',
    },

    // ============ BOT SETTINGS ============
    bot: {
        name: 'ZARA MD',
        version: '1.0.0',
        prefix: '.',                  // Command prefix (e.g., .help)
        mode: 'public',
    },

    // ============ LOGIN METHOD ============
    // This is now asked at runtime, but you can set a default here
    login: {
        defaultMethod: 'qr',          // 'qr' or 'pair' (fallback if user doesn't choose)
    },

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

╭─────────────────────────╮
│  📲 Type *ping* to test  │
│  🎨 Send image to make   │
│     a sticker            │
│  📊 Commands: /help      │
╰─────────────────────────╯

💖 *Made with ❤️ for you*`,
    }
};
