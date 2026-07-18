// ============================================
// 👑 ZARA MD — CONFIGURATION FILE
// ============================================
// 
// 📝 How to Configure:
// 1. Change OWNER_NUMBER to your WhatsApp number
// 2. Customize bot name and prefix if needed
// 3. Set webInterface: true/false for web dashboard
// 4. Choose loginMethod: 'qr' or 'pair'
// 5. Configure database for persistent sessions
// 6. Customize welcome message below
// ============================================

module.exports = {

    // ==========================================
    // 👤 OWNER SETTINGS
    // ==========================================
    owner: {
        number: '94762471350',      // Your WhatsApp number (without +)
        name: 'Zara Owner',          // Your display name
    },

    // ==========================================
    // 🤖 BOT SETTINGS
    // ==========================================
    bot: {
        name: 'ZARA MD',             // Bot display name
        version: '1.0.0',            // Bot version
        prefix: '.',                 // Command prefix (e.g., .help)
        mode: 'public',              // 'public' or 'private'
    },

    // ==========================================
    // 🌐 WEB INTERFACE SETTINGS
    // ==========================================
    webInterface: true,              // true = Web UI | false = Console only
    port: process.env.PORT || 3000,  // Railway uses PORT env variable

    // ==========================================
    // 🔑 LOGIN METHOD
    // ==========================================
    loginMethod: 'qr',               // 'qr' or 'pair'

    // ==========================================
    // 💾 DATABASE CONFIGURATION
    // ==========================================
    database: {
        enabled: true,               // Enable persistent sessions
        type: 'postgresql',          // 'postgresql', 'redis', or 'local'
        
        // PostgreSQL (Recommended for Railway)
        postgresql: {
            url: process.env.DATABASE_URL, // Railway auto-provides this
            table: 'auth_sessions',
        },
        
        // Redis (Alternative)
        redis: {
            url: process.env.REDIS_URL,    // Add Redis plugin in Railway
        },
        
        // Local fallback (uses file system, not persistent on Railway)
        local: {
            path: './auth_info',
            backupInterval: 300000, // 5 minutes
        }
    },

    // ==========================================
    // 🎉 WELCOME MESSAGE SETTINGS
    // ==========================================
    welcome: {
        enabled: true,               // Enable/disable welcome message
        logoUrl: 'https://raw.githubusercontent.com/charukamahesh922-collab/Zara---MD/refs/heads/main/Img/zaramd.jpg',
        reactions: ['👑', '💖', '✨'], // Emojis to react with
    },

    // ==========================================
    // 💬 WELCOME MESSAGE TEXT
    // ==========================================
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

    // ==========================================
    // 🔧 ADVANCED SETTINGS
    // ==========================================
    features: {
        stickerMaker: true,
        groupManagement: true,
        aiChat: false,
        antiSpam: true,
    },

    apis: {
        openai: process.env.OPENAI_API_KEY || '',
        weather: process.env.WEATHER_API_KEY || '',
        google: process.env.GOOGLE_API_KEY || '',
    },
};
