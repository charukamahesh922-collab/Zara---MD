const ytdl = require('ytdl-core');
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

// ===== YOUTUBE VIDEO (MP4) - Using ytdl-core =====
async function downloadYouTubeMP4(url) {
    try {
        if (!ytdl.validateURL(url)) {
            throw new Error('Invalid YouTube URL');
        }
        
        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
        
        // Get the best quality video with audio
        const format = ytdl.chooseFormat(info.formats, { 
            quality: 'highest',
            filter: 'videoandaudio'
        });
        
        if (!format) {
            throw new Error('No suitable format found');
        }
        
        // Download as stream and convert to buffer
        const stream = ytdl(url, { format: format });
        const chunks = [];
        
        return new Promise((resolve, reject) => {
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve({ 
                    buffer, 
                    title: info.videoDetails.title, 
                    size: buffer.length 
                });
            });
            stream.on('error', reject);
        });
    } catch (e) {
        console.error('YT MP4 error:', e.message);
        throw new Error('YouTube MP4 download failed: ' + e.message);
    }
}

// ===== YOUTUBE AUDIO (MP3) - Using ytdl-core =====
async function downloadYouTubeMP3(url) {
    try {
        if (!ytdl.validateURL(url)) {
            throw new Error('Invalid YouTube URL');
        }
        
        const info = await ytdl.getInfo(url);
        
        // Get best audio quality
        const format = ytdl.chooseFormat(info.formats, { 
            quality: 'highestaudio',
            filter: 'audioonly'
        });
        
        if (!format) {
            throw new Error('No audio format found');
        }
        
        const stream = ytdl(url, { format: format });
        const chunks = [];
        
        return new Promise((resolve, reject) => {
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve({ 
                    buffer, 
                    title: info.videoDetails.title, 
                    size: buffer.length 
                });
            });
            stream.on('error', reject);
        });
    } catch (e) {
        console.error('YT MP3 error:', e.message);
        throw new Error('YouTube MP3 download failed: ' + e.message);
    }
}

// ===== TIKTOK DOWNLOAD (Using API) =====
async function downloadTikTok(url) {
    try {
        // Try multiple TikTok downloader APIs
        const apis = [
            `https://api.giftedtech.my.id/api/download/tiktok?apikey=gifted&url=${encodeURIComponent(url)}`,
            `https://api.davidcyriltech.my.id/download/tiktok?url=${encodeURIComponent(url)}`
        ];
        
        for (const api of apis) {
            try {
                const response = await axios.get(api, { timeout: 15000 });
                const videoUrl = response.data?.video_url || response.data?.download_url || response.data?.url;
                
                if (videoUrl) {
                    const videoResponse = await axios.get(videoUrl, { 
                        responseType: 'arraybuffer', 
                        timeout: 30000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    return { 
                        buffer: Buffer.from(videoResponse.data), 
                        title: response.data?.title || 'TikTok Video',
                        size: videoResponse.data.length
                    };
                }
            } catch (e) {
                continue;
            }
        }
        throw new Error('All TikTok APIs failed');
    } catch (e) {
        throw new Error('TikTok download failed: ' + e.message);
    }
}

// ===== FACEBOOK DOWNLOAD (Using API) =====
async function downloadFacebook(url) {
    try {
        const apis = [
            `https://api.giftedtech.my.id/api/download/facebook?apikey=gifted&url=${encodeURIComponent(url)}`,
            `https://api.davidcyriltech.my.id/download/facebook?url=${encodeURIComponent(url)}`
        ];
        
        for (const api of apis) {
            try {
                const response = await axios.get(api, { timeout: 15000 });
                const videoUrl = response.data?.hd || response.data?.sd || response.data?.video_url || response.data?.url;
                
                if (videoUrl) {
                    const videoResponse = await axios.get(videoUrl, { 
                        responseType: 'arraybuffer', 
                        timeout: 30000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    return { 
                        buffer: Buffer.from(videoResponse.data), 
                        title: response.data?.title || 'Facebook Video',
                        size: videoResponse.data.length
                    };
                }
            } catch (e) {
                continue;
            }
        }
        throw new Error('All Facebook APIs failed');
    } catch (e) {
        throw new Error('Facebook download failed: ' + e.message);
    }
}

// ===== INSTAGRAM DOWNLOAD (Using API) =====
async function downloadInstagram(url) {
    try {
        const apis = [
            `https://api.giftedtech.my.id/api/download/instagram?apikey=gifted&url=${encodeURIComponent(url)}`,
            `https://api.davidcyriltech.my.id/download/instagram?url=${encodeURIComponent(url)}`
        ];
        
        for (const api of apis) {
            try {
                const response = await axios.get(api, { timeout: 15000 });
                const mediaUrl = response.data?.video_url || response.data?.image_url || response.data?.url || response.data?.download_url;
                const type = response.data?.type || (mediaUrl?.includes('.mp4') ? 'video' : 'image');
                
                if (mediaUrl) {
                    const mediaResponse = await axios.get(mediaUrl, { 
                        responseType: 'arraybuffer', 
                        timeout: 30000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    return { 
                        buffer: Buffer.from(mediaResponse.data), 
                        type: type,
                        title: response.data?.title || 'Instagram Media',
                        size: mediaResponse.data.length
                    };
                }
            } catch (e) {
                continue;
            }
        }
        throw new Error('All Instagram APIs failed');
    } catch (e) {
        throw new Error('Instagram download failed: ' + e.message);
    }
}

// ===== TWITTER/X DOWNLOAD (Using API) =====
async function downloadTwitter(url) {
    try {
        const apis = [
            `https://api.giftedtech.my.id/api/download/twitter?apikey=gifted&url=${encodeURIComponent(url)}`,
            `https://api.davidcyriltech.my.id/download/twitter?url=${encodeURIComponent(url)}`
        ];
        
        for (const api of apis) {
            try {
                const response = await axios.get(api, { timeout: 15000 });
                const videoUrl = response.data?.video_url || response.data?.url || response.data?.download_url;
                
                if (videoUrl) {
                    const videoResponse = await axios.get(videoUrl, { 
                        responseType: 'arraybuffer', 
                        timeout: 30000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    return { 
                        buffer: Buffer.from(videoResponse.data), 
                        title: response.data?.title || 'Twitter Video',
                        size: videoResponse.data.length
                    };
                }
            } catch (e) {
                continue;
            }
        }
        throw new Error('All Twitter APIs failed');
    } catch (e) {
        throw new Error('Twitter download failed: ' + e.message);
    }
}

// ===== PINTEREST DOWNLOAD =====
async function downloadPinterest(url) {
    try {
        const apis = [
            `https://api.giftedtech.my.id/api/download/pinterest?apikey=gifted&url=${encodeURIComponent(url)}`,
            `https://api.davidcyriltech.my.id/download/pinterest?url=${encodeURIComponent(url)}`
        ];
        
        for (const api of apis) {
            try {
                const response = await axios.get(api, { timeout: 15000 });
                const imgUrl = response.data?.download_url || response.data?.media_url || response.data?.url;
                
                if (imgUrl) {
                    const imgResponse = await axios.get(imgUrl, { 
                        responseType: 'arraybuffer', 
                        timeout: 30000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    return { 
                        buffer: Buffer.from(imgResponse.data), 
                        type: 'image', 
                        title: response.data?.title || 'Pinterest',
                        size: imgResponse.data.length
                    };
                }
            } catch (e) {
                continue;
            }
        }
        throw new Error('All Pinterest APIs failed');
    } catch (e) {
        throw new Error('Pinterest download failed - use a valid Pinterest URL like https://pin.it/...');
    }
}

// ===== REDDIT DOWNLOAD (Using API) =====
async function downloadReddit(url) {
    try {
        const apis = [
            `https://api.giftedtech.my.id/api/download/reddit?apikey=gifted&url=${encodeURIComponent(url)}`,
            `https://api.davidcyriltech.my.id/download/reddit?url=${encodeURIComponent(url)}`
        ];
        
        for (const api of apis) {
            try {
                const response = await axios.get(api, { timeout: 15000 });
                const videoUrl = response.data?.video_url || response.data?.url || response.data?.download_url;
                
                if (videoUrl) {
                    const videoResponse = await axios.get(videoUrl, { 
                        responseType: 'arraybuffer', 
                        timeout: 30000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    return { 
                        buffer: Buffer.from(videoResponse.data), 
                        title: response.data?.title || 'Reddit Video',
                        size: videoResponse.data.length
                    };
                }
            } catch (e) {
                continue;
            }
        }
        throw new Error('All Reddit APIs failed');
    } catch (e) {
        throw new Error('Reddit download failed: ' + e.message);
    }
}

// ===== VIMEO DOWNLOAD (Using API) =====
async function downloadVimeo(url) {
    try {
        const apis = [
            `https://api.giftedtech.my.id/api/download/vimeo?apikey=gifted&url=${encodeURIComponent(url)}`,
            `https://api.davidcyriltech.my.id/download/vimeo?url=${encodeURIComponent(url)}`
        ];
        
        for (const api of apis) {
            try {
                const response = await axios.get(api, { timeout: 15000 });
                const videoUrl = response.data?.video_url || response.data?.url || response.data?.download_url;
                
                if (videoUrl) {
                    const videoResponse = await axios.get(videoUrl, { 
                        responseType: 'arraybuffer', 
                        timeout: 30000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    return { 
                        buffer: Buffer.from(videoResponse.data), 
                        title: response.data?.title || 'Vimeo Video',
                        size: videoResponse.data.length
                    };
                }
            } catch (e) {
                continue;
            }
        }
        throw new Error('All Vimeo APIs failed');
    } catch (e) {
        throw new Error('Vimeo download failed: ' + e.message);
    }
}

// ===== DAILYMOTION DOWNLOAD (Using API) =====
async function downloadDailymotion(url) {
    try {
        const apis = [
            `https://api.giftedtech.my.id/api/download/dailymotion?apikey=gifted&url=${encodeURIComponent(url)}`,
            `https://api.davidcyriltech.my.id/download/dailymotion?url=${encodeURIComponent(url)}`
        ];
        
        for (const api of apis) {
            try {
                const response = await axios.get(api, { timeout: 15000 });
                const videoUrl = response.data?.video_url || response.data?.url || response.data?.download_url;
                
                if (videoUrl) {
                    const videoResponse = await axios.get(videoUrl, { 
                        responseType: 'arraybuffer', 
                        timeout: 30000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    return { 
                        buffer: Buffer.from(videoResponse.data), 
                        title: response.data?.title || 'Dailymotion Video',
                        size: videoResponse.data.length
                    };
                }
            } catch (e) {
                continue;
            }
        }
        throw new Error('All Dailymotion APIs failed');
    } catch (e) {
        throw new Error('Dailymotion download failed: ' + e.message);
    }
}

// ===== TWITCH DOWNLOAD (Using API) =====
async function downloadTwitch(url) {
    try {
        const apis = [
            `https://api.giftedtech.my.id/api/download/twitch?apikey=gifted&url=${encodeURIComponent(url)}`,
            `https://api.davidcyriltech.my.id/download/twitch?url=${encodeURIComponent(url)}`
        ];
        
        for (const api of apis) {
            try {
                const response = await axios.get(api, { timeout: 15000 });
                const videoUrl = response.data?.video_url || response.data?.url || response.data?.download_url;
                
                if (videoUrl) {
                    const videoResponse = await axios.get(videoUrl, { 
                        responseType: 'arraybuffer', 
                        timeout: 30000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    return { 
                        buffer: Buffer.from(videoResponse.data), 
                        title: response.data?.title || 'Twitch Clip',
                        size: videoResponse.data.length
                    };
                }
            } catch (e) {
                continue;
            }
        }
        throw new Error('All Twitch APIs failed');
    } catch (e) {
        throw new Error('Twitch download failed: ' + e.message);
    }
}

// ===== SNAPCHAT DOWNLOAD (Using API) =====
async function downloadSnapchat(url) {
    try {
        const apis = [
            `https://api.giftedtech.my.id/api/download/snapchat?apikey=gifted&url=${encodeURIComponent(url)}`,
            `https://api.davidcyriltech.my.id/download/snapchat?url=${encodeURIComponent(url)}`
        ];
        
        for (const api of apis) {
            try {
                const response = await axios.get(api, { timeout: 15000 });
                const videoUrl = response.data?.video_url || response.data?.url || response.data?.download_url;
                
                if (videoUrl) {
                    const videoResponse = await axios.get(videoUrl, { 
                        responseType: 'arraybuffer', 
                        timeout: 30000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    return { 
                        buffer: Buffer.from(videoResponse.data), 
                        title: response.data?.title || 'Snapchat Video',
                        size: videoResponse.data.length
                    };
                }
            } catch (e) {
                continue;
            }
        }
        throw new Error('All Snapchat APIs failed');
    } catch (e) {
        throw new Error('Snapchat download failed: ' + e.message);
    }
}

// ===== WALLPAPER SEARCH =====
async function searchWallpaper(query) {
    try {
        const response = await axios.get(`https://source.unsplash.com/featured/?${encodeURIComponent(query)}`, {
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        return [{ url: 'Unsplash', buffer: Buffer.from(response.data) }];
    } catch (e) {
        try {
            const response = await axios.get(`https://picsum.photos/800/1200?random=${Date.now()}`, {
                responseType: 'arraybuffer',
                timeout: 15000
            });
            return [{ url: 'Lorem Picsum', buffer: Buffer.from(response.data) }];
        } catch (e2) { 
            return []; 
        }
    }
}

// ===== APK SEARCH =====
async function searchAPK(query) {
    try {
        return [{
            name: query,
            url: `https://apkpure.com/search?q=${encodeURIComponent(query)}`,
            size: 'Check on APKPure'
        }];
    } catch (e) { 
        return []; 
    }
}

// ===== RINGTONE SEARCH =====
async function searchRingtone(query) {
    try {
        const response = await axios.get(`https://api.davidcyriltech.my.id/search/ringtone?query=${encodeURIComponent(query)}`, { timeout: 10000 });
        return response.data?.results || [];
    } catch (e) { 
        return []; 
    }
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
