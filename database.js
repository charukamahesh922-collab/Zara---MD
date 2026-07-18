// ============================================
// 👑 ZARA MD — DATABASE HANDLER
// ============================================
// Supports PostgreSQL & Redis for Railway deployment
// ============================================

const config = require('./config');
const fs = require('fs');
const path = require('path');

class DatabaseHandler {
    constructor() {
        this.type = config.database.type;
        this.db = null;
        this.connected = false;
    }

    async connect() {
        if (!config.database.enabled) {
            console.log('ℹ️ Database disabled, using local storage');
            return this.setupLocal();
        }

        try {
            if (this.type === 'postgresql') {
                await this.connectPostgreSQL();
            } else if (this.type === 'redis') {
                await this.connectRedis();
            } else {
                await this.setupLocal();
            }
        } catch (error) {
            console.error('❌ Database connection failed, falling back to local:', error.message);
            await this.setupLocal();
        }
    }

    async connectPostgreSQL() {
        try {
            const { Pool } = require('pg');
            this.db = new Pool({
                connectionString: config.database.postgresql.url,
                ssl: { rejectUnauthorized: false }
            });

            // Create table if not exists
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS ${config.database.postgresql.table} (
                    id SERIAL PRIMARY KEY,
                    key VARCHAR(255) UNIQUE NOT NULL,
                    value JSONB NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            this.connected = true;
            console.log('✅ Connected to PostgreSQL database');
        } catch (error) {
            throw error;
        }
    }

    async connectRedis() {
        try {
            const Redis = require('ioredis');
            this.db = new Redis(config.database.redis.url);
            this.connected = true;
            console.log('✅ Connected to Redis database');
        } catch (error) {
            throw error;
        }
    }

    async setupLocal() {
        const localPath = config.database.local.path;
        if (!fs.existsSync(localPath)) {
            fs.mkdirSync(localPath, { recursive: true });
        }
        this.type = 'local';
        this.connected = true;
        console.log('✅ Using local file storage');
    }

    async save(key, value) {
        try {
            if (this.type === 'postgresql') {
                await this.db.query(
                    `INSERT INTO ${config.database.postgresql.table} (key, value) 
                     VALUES ($1, $2) 
                     ON CONFLICT (key) 
                     DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
                    [key, JSON.stringify(value)]
                );
            } else if (this.type === 'redis') {
                await this.db.set(key, JSON.stringify(value));
            } else {
                const filePath = path.join(config.database.local.path, `${key}.json`);
                fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
            }
            return true;
        } catch (error) {
            console.error(`❌ Failed to save ${key}:`, error.message);
            return false;
        }
    }

    async get(key) {
        try {
            if (this.type === 'postgresql') {
                const result = await this.db.query(
                    `SELECT value FROM ${config.database.postgresql.table} WHERE key = $1`,
                    [key]
                );
                return result.rows[0]?.value || null;
            } else if (this.type === 'redis') {
                const value = await this.db.get(key);
                return value ? JSON.parse(value) : null;
            } else {
                const filePath = path.join(config.database.local.path, `${key}.json`);
                if (fs.existsSync(filePath)) {
                    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
                }
                return null;
            }
        } catch (error) {
            console.error(`❌ Failed to get ${key}:`, error.message);
            return null;
        }
    }

    async delete(key) {
        try {
            if (this.type === 'postgresql') {
                await this.db.query(
                    `DELETE FROM ${config.database.postgresql.table} WHERE key = $1`,
                    [key]
                );
            } else if (this.type === 'redis') {
                await this.db.del(key);
            } else {
                const filePath = path.join(config.database.local.path, `${key}.json`);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            return true;
        } catch (error) {
            console.error(`❌ Failed to delete ${key}:`, error.message);
            return false;
        }
    }

    async disconnect() {
        if (this.type === 'postgresql') {
            await this.db.end();
        } else if (this.type === 'redis') {
            await this.db.quit();
        }
        console.log('📦 Database connection closed');
    }
}

module.exports = new DatabaseHandler();
