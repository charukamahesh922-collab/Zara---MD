const youtubedl = require('youtube-dl-exec');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ===== YOUTUBE SEARCH =====
async function searchYouTube(query) {
    try {
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            timeout: 15000
        });
        
        const html = response.data;
        const jsonMatch = html.match(/var ytInitialData = ({.*?});<\/script>/);
        
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[1]);
            const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
            
            const results = [];
            for (const item of contents) {
                const vr = item.videoRenderer;
                if (vr && vr.videoId) {
                    results.push({
                        title: vr.title?.runs?.[0]?.text || 'Unknown',
                        url: 'https://www.youtube.com/watch?v=' + vr.videoId,
                        id: vr.videoId
                    });
                }
                if (results.length >= 5) break;
            }
            if (results.length > 0) return results;
        }
        return [];
    } catch (error) {
        console.error('Search error:', error.message);
        return [];
    }
}

// ===== YOUTUBE VIDEO (MP4) =====
async function downloadYouTubeMP4(url) {
    try {
        const info = await youtubedl(url, {
            dumpSingleJson: true, noWarnings: true, noCheckCertificates: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot']
        });
        const tempFile = path.join('/tmp', `ytmp4_${Date.now()}.mp4`);
        await youtubedl(url, {
            output: tempFile, format: 'best[height<=720]', noWarnings: true, noCheckCertificates: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot']
        });
        const buffer = fs.readFileSync(tempFile);
        fs.unlinkSync(tempFile);
        return { buffer, title: info.title, size: buffer.length };
    } catch (e) { throw new Error('YouTube MP4 download failed'); }
}

// ===== YOUTUBE AUDIO (MP3) =====
async function downloadYouTubeMP3(url) {
    try {
        const info = await youtubedl(url, {
            dumpSingleJson: true, noWarnings: true, noCheckCertificates: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot']
        });
        const tempFile = path.join('/tmp', `ytmp3_${Date.now()}`);
        await youtubedl(url, {
            output: tempFile + '.%(ext)s', format: 'bestaudio/best', noWarnings: true, noCheckCertificates: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot']
        });
        const files = fs.readdirSync('/tmp').filter(f => f.startsWith(path.basename(tempFile)));
        if (files.length === 0) throw new Error('No audio file found');
        const downloadedFile = path.join('/tmp', files[0]);
        const buffer = fs.readFileSync(downloadedFile);
        fs.unlinkSync(downloadedFile);
        return { buffer, title: info.title, size: buffer.length };
    } catch (e) { throw new Error('YouTube MP3 download failed'); }
}

// ===== TIKTOK DOWNLOAD =====
async function downloadTikTok(url) {
    try {
        const tempFile = path.join('/tmp', `tt_${Date.now()}.mp4`);
        await youtubedl(url, { output: tempFile, noWarnings: true, noCheckCertificates: true });
        const buffer = fs.readFileSync(tempFile);
        fs.unlinkSync(tempFile);
        return { buffer, title: 'TikTok Video', author: '' };
    } catch (e) { throw new Error('TikTok download failed'); }
}

// ===== FACEBOOK DOWNLOAD =====
async function downloadFacebook(url) {
    try {
        const tempFile = path.join('/tmp', `fb_${Date.now()}.mp4`);
        await youtubedl(url, { output: tempFile, noWarnings: true, noCheckCertificates: true });
        const buffer = fs.readFileSync(tempFile);
        fs.unlinkSync(tempFile);
        return { buffer, title: 'Facebook Video' };
    } catch (e) { throw new Error('Facebook download failed'); }
}

// ===== INSTAGRAM DOWNLOAD =====
async function downloadInstagram(url) {
    try {
        const info = await youtubedl(url, { dumpSingleJson: true, noWarnings: true, noCheckCertificates: true });
        const ext = info.ext || 'mp4';
        const tempFile = path.join('/tmp', `ig_${Date.now()}.${ext}`);
        await youtubedl(url, { output: tempFile, noWarnings: true, noCheckCertificates: true });
        const buffer = fs.readFileSync(tempFile);
        fs.unlinkSync(tempFile);
        return { buffer, type: ext === 'jpg' || ext === 'png' ? 'image' : 'video', title: info.title || 'Instagram' };
    } catch (e) { throw new Error('Instagram download failed'); }
}

// ===== TWITTER/X DOWNLOAD =====
async function downloadTwitter(url) {
    try {
        const tempFile = path.join('/tmp', `tw_${Date.now()}.mp4`);
        await youtubedl(url, { output: tempFile, noWarnings: true, noCheckCertificates: true });
        const buffer = fs.readFileSync(tempFile);
        fs.unlinkSync(tempFile);
        return { buffer, title: 'Twitter Video' };
    } catch (e) { throw new Error('Twitter download failed'); }
}

// ===== PINTEREST DOWNLOAD (FIXED) =====
async function downloadPinterest(url) {
    try {
        // Use Pinterest downloader API
        const response = await axios.get(`https://api.giftedtech.my.id/api/download/pinterest?apikey=gifted&url=${encodeURIComponent(url)}`, { timeout: 15000 });
        if (response.data?.download_url || response.data?.media_url) {
            const imgUrl = response.data.download_url || response.data.media_url;
            const imgResponse = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 30000 });
            return { buffer: Buffer.from(imgResponse.data), type: 'image', title: 'Pinterest' };
        }
    } catch (e) {}
    throw new Error('Pinterest download failed - use a valid Pinterest URL like https://pin.it/...');
}

// ===== REDDIT DOWNLOAD =====
async function downloadReddit(url) {
    try {
        const tempFile = path.join('/tmp', `reddit_${Date.now()}.mp4`);
        await youtubedl(url, { output: tempFile, noWarnings: true, noCheckCertificates: true });
        const buffer = fs.readFileSync(tempFile);
        fs.unlinkSync(tempFile);
        return { buffer, title: 'Reddit Video' };
    } catch (e) { throw new Error('Reddit download failed'); }
}

// ===== VIMEO DOWNLOAD =====
async function downloadVimeo(url) {
    try {
        const tempFile = path.join('/tmp', `vimeo_${Date.now()}.mp4`);
        await youtubedl(url, { output: tempFile, noWarnings: true, noCheckCertificates: true });
        const buffer = fs.readFileSync(tempFile);
        fs.unlinkSync(tempFile);
        return { buffer, title: 'Vimeo Video' };
    } catch (e) { throw new Error('Vimeo download failed'); }
}

// ===== DAILYMOTION DOWNLOAD =====
async function downloadDailymotion(url) {
    try {
        const tempFile = path.join('/tmp', `dm_${Date.now()}.mp4`);
        await youtubedl(url, { output: tempFile, noWarnings: true, noCheckCertificates: true });
        const buffer = fs.readFileSync(tempFile);
        fs.unlinkSync(tempFile);
        return { buffer, title: 'Dailymotion Video' };
    } catch (e) { throw new Error('Dailymotion download failed'); }
}

// ===== TWITCH DOWNLOAD =====
async function downloadTwitch(url) {
    try {
        const tempFile = path.join('/tmp', `twitch_${Date.now()}.mp4`);
        await youtubedl(url, { output: tempFile, noWarnings: true, noCheckCertificates: true });
        const buffer = fs.readFileSync(tempFile);
        fs.unlinkSync(tempFile);
        return { buffer, title: 'Twitch Clip' };
    } catch (e) { throw new Error('Twitch download failed'); }
}

// ===== SNAPCHAT DOWNLOAD =====
async function downloadSnapchat(url) {
    try {
        const tempFile = path.join('/tmp', `snap_${Date.now()}.mp4`);
        await youtubedl(url, { output: tempFile, noWarnings: true, noCheckCertificates: true });
        const buffer = fs.readFileSync(tempFile);
        fs.unlinkSync(tempFile);
        return { buffer, title: 'Snapchat Video' };
    } catch (e) { throw new Error('Snapchat download failed'); }
}

// ===== WALLPAPER SEARCH (FIXED - No API key needed) =====
async function searchWallpaper(query) {
    try {
        // Use Unsplash source
        const response = await axios.get(`https://source.unsplash.com/featured/?${encodeURIComponent(query)}`, {
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        return [{ url: 'Unsplash', buffer: Buffer.from(response.data) }];
    } catch (e) {
        // Fallback to Lorem Picsum
        try {
            const response = await axios.get(`https://picsum.photos/800/1200?random=${Date.now()}`, {
                responseType: 'arraybuffer',
                timeout: 15000
            });
            return [{ url: 'Lorem Picsum', buffer: Buffer.from(response.data) }];
        } catch (e2) { return []; }
    }
}

// ===== APK SEARCH (FIXED) =====
async function searchAPK(query) {
    try {
        // Provide APKPure search link
        return [{
            name: query,
            url: `https://apkpure.com/search?q=${encodeURIComponent(query)}`,
            size: 'Check on APKPure'
        }];
    } catch (e) { return []; }
}

// ===== RINGTONE SEARCH =====
async function searchRingtone(query) {
    try {
        const response = await axios.get(`https://api.davidcyriltech.my.id/search/ringtone?query=${encodeURIComponent(query)}`, { timeout: 10000 });
        return response.data?.results || [];
    } catch (e) { return []; }
}

module.exports = {
    searchYouTube,
    downloadYouTubeMP4,
    downloadYouTubeMP3,
    downloadTikTok,
    downloadFacebook,
    downloadInstagram,
    downloadTwitter,
    downloadPinterest,
    downloadReddit,
    downloadVimeo,
    downloadDailymotion,
    downloadTwitch,
    downloadSnapchat,
    searchWallpaper,
    searchAPK,
    searchRingtone
};