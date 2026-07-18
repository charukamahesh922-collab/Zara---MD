// ============================================
// 👑 ZARA MD — DATABASE HANDLER (Railway Optimized)
// ============================================

const fs = require('fs');
const path = require('path');

class DatabaseHandler {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.connected = false;
    }

    async connect() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
        this.connected = true;
        console.log('✅ Local storage initialized at:', this.dataDir);
    }

    async save(key, value) {
        try {
            const filePath = path.join(this.dataDir, `${key}.json`);
            fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
            return true;
        } catch (error) {
            console.error(`❌ Failed to save ${key}:`, error.message);
            return false;
        }
    }

    async get(key) {
        try {
            const filePath = path.join(this.dataDir, `${key}.json`);
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
            return null;
        } catch (error) {
            console.error(`❌ Failed to get ${key}:`, error.message);
            return null;
        }
    }

    async delete(key) {
        try {
            const filePath = path.join(this.dataDir, `${key}.json`);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    async disconnect() {
        console.log('📦 Storage handler closed');
    }
}

module.exports = new DatabaseHandler();
