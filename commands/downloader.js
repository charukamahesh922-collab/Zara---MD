const { react, getUptime, formatSize, cleanFileName, footer } = require('../utils/helper');
const { 
    searchYouTube, downloadYouTubeMP4, downloadYouTubeMP3,
    downloadTikTok, downloadFacebook, downloadInstagram,
    downloadTwitter, downloadPinterest, downloadReddit,
    downloadVimeo, downloadDailymotion, downloadTwitch, downloadSnapchat,
    searchWallpaper, searchAPK, searchRingtone
} = require('../utils/downloader');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const youtubedl = require('youtube-dl-exec');

const downloadDir = path.join(__dirname, '..', 'downloads');

// ===== HELPERS =====
async function getVideoDetails(url) {
    try {
        const info = await youtubedl(url, {
            dumpSingleJson: true, noWarnings: true, noCheckCertificates: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot']
        });
        return {
            title: info.title, duration: formatDuration(info.duration),
            views: formatNumber(info.view_count), likes: formatNumber(info.like_count),
            channel: info.channel || info.uploader, uploadDate: formatDate(info.upload_date),
            thumbnail: info.thumbnail, url: info.webpage_url
        };
    } catch (e) { return null; }
}

function formatDuration(s) {
    if (!s) return 'Unknown';
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

function formatNumber(n) {
    if (!n) return 'N/A';
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toString();
}

function formatDate(d) {
    if (!d) return 'Unknown';
    return `${d.substring(6,8)}/${d.substring(4,6)}/${d.substring(0,4)}`;
}

const completeBox = `╔═══════════════════════╗
║   ✅ *DOWNLOAD COMPLETE*   ║
╚═══════════════════════╝`;

// ===== GENERIC DOWNLOAD HANDLER =====
async function genericDownload(sock, msg, url, platform, downloadFn, startTime) {
    const remoteJid = msg.key.remoteJid;
    const msgKey = msg.key;
    let searchMsg, downloadMsg;
    
    try {
        await react(sock, remoteJid, msgKey, '🔍');
        searchMsg = await sock.sendMessage(remoteJid, { text: `🔍 *Fetching ${platform}...*\n\n⏳ Please wait...${footer}` });
        await react(sock, remoteJid, msgKey, '⬇️');
        downloadMsg = await sock.sendMessage(remoteJid, { text: `⬇️ *Downloading from ${platform}...*\n\n⏳ Downloading...${footer}` });
        
        const data = await downloadFn(url);
        
        if (data?.buffer) {
            await react(sock, remoteJid, msgKey, '⬆️');
            try { if (searchMsg) await sock.sendMessage(remoteJid, { delete: searchMsg.key }); } catch (e) {}
            try { if (downloadMsg) await sock.sendMessage(remoteJid, { delete: downloadMsg.key }); } catch (e) {}
            
            const caption = `${completeBox}\n\n📹 *Title* : ${data.title || 'Video'}\n⚡ *Platform* : ${platform}\n🕐 *Time* : ${getUptime(startTime)}\n\n${footer}`;
            await sock.sendMessage(remoteJid, { video: data.buffer, caption, mimetype: 'video/mp4' });
            await react(sock, remoteJid, msgKey, '✅');
        } else {
            await sock.sendMessage(remoteJid, { text: `❌ *Download Failed!*\n\n😔 Unable to download from ${platform}\n\n${footer}` });
            await react(sock, remoteJid, msgKey, '❌');
        }
    } catch (e) {
        console.error(`${platform} Error:`, e);
        try { if (searchMsg) await sock.sendMessage(remoteJid, { delete: searchMsg.key }); } catch (e) {}
        try { if (downloadMsg) await sock.sendMessage(remoteJid, { delete: downloadMsg.key }); } catch (e) {}
        await sock.sendMessage(remoteJid, { text: `❌ *Error!*\n\n😔 ${e.message}\n\n${footer}` });
        await react(sock, remoteJid, msgKey, '❌');
    }
}

// ===== YOUTUBE VIDEO =====
async function handleYTMP4(sock, msg, query, startTime) {
    const remoteJid = msg.key.remoteJid;
    const msgKey = msg.key;
    let searchMsg, downloadMsg;
    
    try {
        await react(sock, remoteJid, msgKey, '🔍');
        let url = query, videoInfo = null;
        
        if (!query.includes('youtube.com') && !query.includes('youtu.be')) {
            searchMsg = await sock.sendMessage(remoteJid, { text: `🔍 *Searching YouTube...*\n\n📌 Query : ${query}\n⏳ Please wait...${footer}` });
            const results = await searchYouTube(query);
            if (results?.length > 0) { url = results[0].url; videoInfo = results[0]; }
            else {
                await sock.sendMessage(remoteJid, { text: `❌ *No results!*\n\n🔍 Query : ${query}\n💡 Try a direct URL\n\n${footer}` });
                await react(sock, remoteJid, msgKey, '❌'); return;
            }
        }
        
        const details = await getVideoDetails(url);
        await react(sock, remoteJid, msgKey, '⬇️');
        downloadMsg = await sock.sendMessage(remoteJid, { text: `⬇️ *Downloading video...*\n\n📹 ${details?.title || 'Processing...'}\n👤 ${details?.channel || 'YouTube'}\n⏳ Please wait...${footer}` });
        
        const data = await downloadYouTubeMP4(url);
        
        if (data?.buffer) {
            await react(sock, remoteJid, msgKey, '⬆️');
            try { if (searchMsg) await sock.sendMessage(remoteJid, { delete: searchMsg.key }); } catch (e) {}
            try { if (downloadMsg) await sock.sendMessage(remoteJid, { delete: downloadMsg.key }); } catch (e) {}
            
            const caption = `${completeBox}\n\n📹 *Title* : ${details?.title || data.title}\n👤 *Channel* : ${details?.channel || 'YouTube'}\n⏱️ *Duration* : ${details?.duration || 'N/A'}\n👁️ *Views* : ${details?.views || 'N/A'}\n❤️ *Likes* : ${details?.likes || 'N/A'}\n📅 *Uploaded* : ${details?.uploadDate || 'N/A'}\n📦 *Size* : ${formatSize(data.size)}\n⚡ *Platform* : YouTube\n🕐 *Time* : ${getUptime(startTime)}\n\n🔗 ${url}\n\n${footer}`;
            await sock.sendMessage(remoteJid, { video: data.buffer, caption, mimetype: 'video/mp4' });
            await react(sock, remoteJid, msgKey, '✅');
        }
    } catch (e) {
        console.error('YTMP4 Error:', e);
        try { if (searchMsg) await sock.sendMessage(remoteJid, { delete: searchMsg.key }); } catch (e) {}
        try { if (downloadMsg) await sock.sendMessage(remoteJid, { delete: downloadMsg.key }); } catch (e) {}
        await sock.sendMessage(remoteJid, { text: `❌ *Error!*\n\n😔 ${e.message}\n\n${footer}` });
        await react(sock, remoteJid, msgKey, '❌');
    }
}

// ===== YOUTUBE AUDIO =====
async function handleYTMP3(sock, msg, query, startTime) {
    const remoteJid = msg.key.remoteJid;
    const msgKey = msg.key;
    let searchMsg, downloadMsg;
    
    try {
        await react(sock, remoteJid, msgKey, '🔍');
        let url = query, songInfo = null;
        
        if (!query.includes('youtube.com') && !query.includes('youtu.be')) {
            searchMsg = await sock.sendMessage(remoteJid, { text: `🔍 *Searching YouTube Music...*\n\n📌 Query : ${query}\n⏳ Please wait...${footer}` });
            const results = await searchYouTube(query);
            if (results?.length > 0) { url = results[0].url; songInfo = results[0]; }
            else {
                await sock.sendMessage(remoteJid, { text: `❌ *No results!*\n\n🔍 Query : ${query}\n💡 Try a direct URL\n\n${footer}` });
                await react(sock, remoteJid, msgKey, '❌'); return;
            }
        }
        
        const details = await getVideoDetails(url);
        await react(sock, remoteJid, msgKey, '⬇️');
        downloadMsg = await sock.sendMessage(remoteJid, { text: `⬇️ *Downloading audio...*\n\n🎵 ${details?.title || 'Processing...'}\n👤 ${details?.channel || 'YouTube'}\n🎶 Format : MP3\n⏳ Converting...${footer}` });
        
        const data = await downloadYouTubeMP3(url);
        
        if (data?.buffer) {
            await react(sock, remoteJid, msgKey, '⬆️');
            try { if (searchMsg) await sock.sendMessage(remoteJid, { delete: searchMsg.key }); } catch (e) {}
            try { if (downloadMsg) await sock.sendMessage(remoteJid, { delete: downloadMsg.key }); } catch (e) {}
            
            await sock.sendMessage(remoteJid, { audio: data.buffer, mimetype: 'audio/mp4', ptt: false });
            
            const caption = `${completeBox}\n\n🎵 *Title* : ${details?.title || data.title}\n👤 *Artist* : ${details?.channel || 'YouTube'}\n⏱️ *Duration* : ${details?.duration || 'N/A'}\n👁️ *Views* : ${details?.views || 'N/A'}\n❤️ *Likes* : ${details?.likes || 'N/A'}\n📅 *Released* : ${details?.uploadDate || 'N/A'}\n📦 *Size* : ${formatSize(data.size)}\n⚡ *Platform* : YouTube Music\n🕐 *Time* : ${getUptime(startTime)}\n\n🔗 ${url}\n\n${footer}`;
            await sock.sendMessage(remoteJid, { text: caption });
            await react(sock, remoteJid, msgKey, '✅');
        }
    } catch (e) {
        console.error('YTMP3 Error:', e);
        try { if (searchMsg) await sock.sendMessage(remoteJid, { delete: searchMsg.key }); } catch (e) {}
        try { if (downloadMsg) await sock.sendMessage(remoteJid, { delete: downloadMsg.key }); } catch (e) {}
        await sock.sendMessage(remoteJid, { text: `❌ *Error!*\n\n😔 ${e.message}\n\n${footer}` });
        await react(sock, remoteJid, msgKey, '❌');
    }
}

// ===== TIKTOK =====
async function handleTikTok(sock, msg, url, startTime) {
    await genericDownload(sock, msg, url, 'TikTok', downloadTikTok, startTime);
}

// ===== FACEBOOK =====
async function handleFacebook(sock, msg, url, startTime) {
    await genericDownload(sock, msg, url, 'Facebook', downloadFacebook, startTime);
}

// ===== INSTAGRAM =====
async function handleInstagram(sock, msg, url, startTime) {
    const remoteJid = msg.key.remoteJid;
    const msgKey = msg.key;
    let searchMsg, downloadMsg;
    
    try {
        await react(sock, remoteJid, msgKey, '🔍');
        searchMsg = await sock.sendMessage(remoteJid, { text: `🔍 *Fetching Instagram...*\n\n⏳ Please wait...${footer}` });
        await react(sock, remoteJid, msgKey, '⬇️');
        downloadMsg = await sock.sendMessage(remoteJid, { text: `⬇️ *Downloading...*\n\n⚡ Platform : Instagram\n⏳ Downloading...${footer}` });
        
        const data = await downloadInstagram(url);
        
        if (data?.buffer) {
            await react(sock, remoteJid, msgKey, '⬆️');
            try { if (searchMsg) await sock.sendMessage(remoteJid, { delete: searchMsg.key }); } catch (e) {}
            try { if (downloadMsg) await sock.sendMessage(remoteJid, { delete: downloadMsg.key }); } catch (e) {}
            
            const caption = `${completeBox}\n\n${data.type === 'image' ? '🖼️' : '📹'} *Type* : ${data.type === 'image' ? 'Image' : 'Video'}\n📌 *Title* : ${data.title || 'Instagram'}\n⚡ *Platform* : Instagram\n🕐 *Time* : ${getUptime(startTime)}\n\n${footer}`;
            
            if (data.type === 'image') {
                await sock.sendMessage(remoteJid, { image: data.buffer, caption });
            } else {
                await sock.sendMessage(remoteJid, { video: data.buffer, caption, mimetype: 'video/mp4' });
            }
            await react(sock, remoteJid, msgKey, '✅');
        }
    } catch (e) {
        console.error('IG Error:', e);
        try { if (searchMsg) await sock.sendMessage(remoteJid, { delete: searchMsg.key }); } catch (e) {}
        try { if (downloadMsg) await sock.sendMessage(remoteJid, { delete: downloadMsg.key }); } catch (e) {}
        await sock.sendMessage(remoteJid, { text: `❌ *Error!*\n\n😔 ${e.message}\n\n${footer}` });
        await react(sock, remoteJid, msgKey, '❌');
    }
}

// ===== TWITTER =====
async function handleTwitter(sock, msg, url, startTime) {
    await genericDownload(sock, msg, url, 'Twitter/X', downloadTwitter, startTime);
}

// ===== PINTEREST (FIXED) =====
async function handlePinterest(sock, msg, url, startTime) {
    const remoteJid = msg.key.remoteJid;
    const msgKey = msg.key;
    let searchMsg, downloadMsg;
    
    try {
        await react(sock, remoteJid, msgKey, '🔍');
        searchMsg = await sock.sendMessage(remoteJid, { text: `🔍 *Fetching Pinterest...*\n\n⏳ Please wait...${footer}` });
        await react(sock, remoteJid, msgKey, '⬇️');
        downloadMsg = await sock.sendMessage(remoteJid, { text: `⬇️ *Downloading image...*\n\n⚡ Platform : Pinterest\n⏳ Downloading...${footer}` });
        
        const data = await downloadPinterest(url);
        
        if (data?.buffer) {
            await react(sock, remoteJid, msgKey, '⬆️');
            try { if (searchMsg) await sock.sendMessage(remoteJid, { delete: searchMsg.key }); } catch (e) {}
            try { if (downloadMsg) await sock.sendMessage(remoteJid, { delete: downloadMsg.key }); } catch (e) {}
            
            const caption = `${completeBox}\n\n🖼️ *Type* : Image\n📌 *Title* : ${data.title || 'Pinterest'}\n⚡ *Platform* : Pinterest\n🕐 *Time* : ${getUptime(startTime)}\n\n${footer}`;
            await sock.sendMessage(remoteJid, { image: data.buffer, caption });
            await react(sock, remoteJid, msgKey, '✅');
        } else {
            throw new Error('No image data received');
        }
    } catch (e) {
        console.error('Pin Error:', e);
        try { if (searchMsg) await sock.sendMessage(remoteJid, { delete: searchMsg.key }); } catch (e) {}
        try { if (downloadMsg) await sock.sendMessage(remoteJid, { delete: downloadMsg.key }); } catch (e) {}
        await sock.sendMessage(remoteJid, { text: `❌ *Pinterest Download Failed!*\n\n😔 ${e.message}\n💡 Use a valid Pinterest URL like:\n📌 https://pin.it/xxxxx\n📌 https://pinterest.com/pin/xxxxx\n\n${footer}` });
        await react(sock, remoteJid, msgKey, '❌');
    }
}

// ===== REDDIT =====
async function handleReddit(sock, msg, url, startTime) {
    await genericDownload(sock, msg, url, 'Reddit', downloadReddit, startTime);
}

// ===== VIMEO =====
async function handleVimeo(sock, msg, url, startTime) {
    await genericDownload(sock, msg, url, 'Vimeo', downloadVimeo, startTime);
}

// ===== DAILYMOTION =====
async function handleDailymotion(sock, msg, url, startTime) {
    await genericDownload(sock, msg, url, 'Dailymotion', downloadDailymotion, startTime);
}

// ===== TWITCH =====
async function handleTwitch(sock, msg, url, startTime) {
    await genericDownload(sock, msg, url, 'Twitch', downloadTwitch, startTime);
}

// ===== SNAPCHAT =====
async function handleSnapchat(sock, msg, url, startTime) {
    await genericDownload(sock, msg, url, 'Snapchat', downloadSnapchat, startTime);
}

// ===== WALLPAPER (FIXED) =====
async function handleWallpaper(sock, msg, query, startTime) {
    const remoteJid = msg.key.remoteJid;
    const msgKey = msg.key;
    
    try {
        await react(sock, remoteJid, msgKey, '🔍');
        await sock.sendMessage(remoteJid, { text: `🔍 *Fetching Wallpaper...*\n\n📌 Query : ${query}\n⏳ Please wait...${footer}` });
        
        const photos = await searchWallpaper(query);
        
        if (photos?.length > 0 && photos[0]?.buffer) {
            await react(sock, remoteJid, msgKey, '⬆️');
            const caption = `✅ *Wallpaper Ready!*\n\n🖼️ *Query* : ${query}\n📸 *Source* : ${photos[0].url || 'HD Wallpaper'}\n🕐 *Time* : ${getUptime(startTime)}\n\n${footer}`;
            await sock.sendMessage(remoteJid, { image: photos[0].buffer, caption });
            await react(sock, remoteJid, msgKey, '✅');
        } else {
            await sock.sendMessage(remoteJid, { text: `🖼️ *Wallpaper Search*\n\n🔍 Query : ${query}\n🔗 Browse: https://unsplash.com/s/photos/${encodeURIComponent(query)}\n\n💡 Open link to view wallpapers\n\n${footer}` });
            await react(sock, remoteJid, msgKey, '✅');
        }
    } catch (e) {
        console.error('Wallpaper Error:', e);
        await sock.sendMessage(remoteJid, { text: `❌ *Error!*\n\n${e.message}\n\n${footer}` });
    }
}

// ===== APK (FIXED) =====
async function handleAPK(sock, msg, query, startTime) {
    const remoteJid = msg.key.remoteJid;
    const msgKey = msg.key;
    
    try {
        await react(sock, remoteJid, msgKey, '🔍');
        await sock.sendMessage(remoteJid, { text: `🔍 *Searching APK...*\n\n📌 Query : ${query}\n⏳ Please wait...${footer}` });
        
        const results = await searchAPK(query);
        
        if (results?.length > 0) {
            const apk = results[0];
            await sock.sendMessage(remoteJid, { 
                text: `📱 *APK Search Result*\n\n📌 *App* : ${apk.name || query}\n📦 *Info* : ${apk.size || 'Check link'}\n🔗 *Download* : ${apk.url}\n\n💡 Open in browser to download\n⚠️ Download from trusted sources only!\n\n${footer}` 
            });
            await react(sock, remoteJid, msgKey, '✅');
        } else {
            await sock.sendMessage(remoteJid, { 
                text: `📱 *APK Search*\n\n🔍 Query : ${query}\n🔗 Search on APKPure:\nhttps://apkpure.com/search?q=${encodeURIComponent(query)}\n\n💡 Open link to find and download\n\n${footer}` 
            });
            await react(sock, remoteJid, msgKey, '✅');
        }
    } catch (e) {
        console.error('APK Error:', e);
        await sock.sendMessage(remoteJid, { text: `❌ *Error!*\n\n${e.message}\n\n${footer}` });
    }
}

// ===== RINGTONE =====
async function handleRingtone(sock, msg, query, startTime) {
    const remoteJid = msg.key.remoteJid;
    const msgKey = msg.key;
    
    try {
        await react(sock, remoteJid, msgKey, '🔍');
        await sock.sendMessage(remoteJid, { text: `🔍 *Searching Ringtone...*\n\n📌 Query : ${query}\n⏳ Please wait...${footer}` });
        
        const results = await searchRingtone(query);
        
        if (results?.length > 0) {
            const ring = results[0];
            await react(sock, remoteJid, msgKey, '⬇️');
            const audioResponse = await axios.get(ring.url || ring.download_url, { responseType: 'arraybuffer', timeout: 60000 });
            const buffer = Buffer.from(audioResponse.data);
            
            await react(sock, remoteJid, msgKey, '⬆️');
            await sock.sendMessage(remoteJid, { audio: buffer, mimetype: 'audio/mp3', ptt: false });
            
            const caption = `${completeBox}\n\n🎵 *Ringtone* : ${ring.name || query}\n📦 *Size* : ${formatSize(buffer.length)}\n🕐 *Time* : ${getUptime(startTime)}\n\n${footer}`;
            await sock.sendMessage(remoteJid, { text: caption });
            await react(sock, remoteJid, msgKey, '✅');
        } else {
            await sock.sendMessage(remoteJid, { text: `❌ *No ringtone found!*\n\n🔍 Query : ${query}\n\n${footer}` });
            await react(sock, remoteJid, msgKey, '❌');
        }
    } catch (e) {
        console.error('Ringtone Error:', e);
        await sock.sendMessage(remoteJid, { text: `❌ *Error!*\n\n${e.message}\n\n${footer}` });
    }
}

module.exports = {
    handleYTMP4, handleYTMP3,
    handleTikTok, handleFacebook, handleInstagram,
    handleTwitter, handlePinterest, handleReddit,
    handleVimeo, handleDailymotion, handleTwitch, handleSnapchat,
    handleWallpaper, handleAPK, handleRingtone
};