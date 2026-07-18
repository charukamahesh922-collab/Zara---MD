const fs = require('fs');

async function react(sock, jid, key, emoji) {
    try {
        await sock.sendMessage(jid, { react: { text: emoji, key: key } });
    } catch (error) {}
}

function getUptime(startTime) {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;
    let uptimeStr = '';
    if (hours > 0) uptimeStr += `${hours}h `;
    if (minutes > 0) uptimeStr += `${minutes}m `;
    uptimeStr += `${seconds}s`;
    return uptimeStr.trim();
}

function formatSize(bytes) {
    if (!bytes || bytes === 0) return 'Unknown';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const footer = '\n\n━━━━━━━━━━━━━━━━━━━━━━━\n💫  Powered by Charuka Mahesh';

module.exports = { react, getUptime, formatSize, footer };