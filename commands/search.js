const { react, getUptime, formatSize, footer } = require('../utils/helper');
const axios = require('axios');

// ===== GOOGLE/DUCKDUCKGO SEARCH =====
async function handleGoogle(sock, msg, query, startTime) {
    const remoteJid = msg.key.remoteJid;
    await react(sock, remoteJid, msg.key, '🔍');
    
    try {
        const response = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`, { timeout: 10000 });
        const data = response.data;
        
        let text = `🔍 *Search: ${query}*\n\n`;
        let hasContent = false;
        
        if (data.AbstractText && data.AbstractText.length > 10) {
            text += `📝 *Summary:*\n${data.AbstractText.substring(0, 400)}\n`;
            if (data.AbstractURL) text += `🔗 ${data.AbstractURL}\n`;
            text += '\n';
            hasContent = true;
        }
        
        if (data.RelatedTopics?.length > 0) {
            text += `📌 *Related Results:*\n`;
            let count = 0;
            for (const topic of data.RelatedTopics) {
                if (topic.Text && count < 5) {
                    count++;
                    text += `\n*${count}.* ${topic.Text.replace(/<[^>]+>/g, '').substring(0, 120)}`;
                    if (topic.FirstURL) text += `\n   🔗 ${topic.FirstURL}`;
                    text += '\n';
                }
            }
            hasContent = true;
        }
        
        if (data.Infobox?.content?.length > 0) {
            text += `\n📋 *Quick Info:*\n`;
            data.Infobox.content.forEach(item => {
                text += `• ${item.label}: ${item.value}\n`;
            });
            hasContent = true;
        }
        
        if (hasContent) {
            text += `\n🔗 More: https://www.google.com/search?q=${encodeURIComponent(query)}\n\n${footer}`;
            await sock.sendMessage(remoteJid, { text });
            return;
        }
    } catch (e) {}
    
    await sock.sendMessage(remoteJid, { 
        text: `🔍 *Search: ${query}*\n\n` +
              `🔗 Google: https://www.google.com/search?q=${encodeURIComponent(query)}\n` +
              `🔗 DuckDuckGo: https://duckduckgo.com/?q=${encodeURIComponent(query)}\n` +
              `🔗 Wikipedia: https://en.wikipedia.org/wiki/${encodeURIComponent(query)}\n\n${footer}` 
    });
}

// ===== WIKIPEDIA SEARCH =====
async function handleWikipedia(sock, msg, query, startTime) {
    const remoteJid = msg.key.remoteJid;
    await react(sock, remoteJid, msg.key, '📚');
    
    try {
        const response = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, { 
            timeout: 10000,
            headers: { 'User-Agent': 'ZARA-MD/1.0' }
        });
        
        const data = response.data;
        
        if (data.title && data.extract) {
            let text = `📚 *Wikipedia: ${data.title}*\n\n`;
            text += `${data.extract.substring(0, 600)}...\n\n`;
            text += `🔗 ${data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`}\n\n`;
            text += `💡 *Tip:* Use .wiki <topic> for more results\n\n${footer}`;
            
            if (data.thumbnail?.source) {
                try {
                    await sock.sendMessage(remoteJid, { image: { url: data.thumbnail.source }, caption: text });
                    return;
                } catch (e) {}
            }
            
            await sock.sendMessage(remoteJid, { text });
            return;
        }
    } catch (e) {
        try {
            const searchResponse = await axios.get(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=5`, {
                timeout: 10000,
                headers: { 'User-Agent': 'ZARA-MD/1.0' }
            });
            
            const results = searchResponse.data?.query?.search;
            
            if (results?.length > 0) {
                let text = `📚 *Wikipedia Search: ${query}*\n\n`;
                
                for (let i = 0; i < Math.min(results.length, 5); i++) {
                    const r = results[i];
                    text += `*${i+1}. ${r.title}*\n`;
                    text += `📝 ${r.snippet?.replace(/<[^>]+>/g, '').substring(0, 150)}...\n`;
                    text += `🔗 https://en.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, '_'))}\n\n`;
                }
                
                await sock.sendMessage(remoteJid, { text: text + footer });
                return;
            }
        } catch (e2) {}
    }
    
    await sock.sendMessage(remoteJid, { text: `📚 *Wikipedia*\n\n🔗 https://en.wikipedia.org/wiki/${encodeURIComponent(query.replace(/ /g, '_'))}\n\n${footer}` });
}

// ===== WEATHER =====
async function handleWeather(sock, msg, query, startTime) {
    const remoteJid = msg.key.remoteJid;
    await react(sock, remoteJid, msg.key, '🌤️');
    
    try {
        const response = await axios.get(`https://wttr.in/${encodeURIComponent(query)}?format=j1`, { timeout: 10000 });
        const data = response.data;
        const current = data?.current_condition?.[0];
        const weather = data?.weather?.[0];
        
        if (current) {
            let text = `🌤️ *Weather: ${query}*\n\n`;
            text += `🌡️ *Temp:* ${current.temp_C}°C (Feels ${current.FeelsLikeC}°C)\n`;
            text += `☁️ *Condition:* ${current.weatherDesc?.[0]?.value}\n`;
            text += `💨 *Wind:* ${current.winddir16Point} ${current.windspeedKmph} km/h\n`;
            text += `💧 *Humidity:* ${current.humidity}%\n`;
            text += `👁️ *Visibility:* ${current.visibility} km\n`;
            text += `🌅 *Sunrise:* ${weather?.astronomy?.[0]?.sunrise || 'N/A'}\n`;
            text += `🌇 *Sunset:* ${weather?.astronomy?.[0]?.sunset || 'N/A'}\n`;
            if (weather?.hourly?.length > 0) {
                text += `\n📊 *Today:* Max ${weather.maxtempC}°C | Min ${weather.mintempC}°C\n`;
            }
            text += `\n🔗 https://wttr.in/${encodeURIComponent(query)}\n\n${footer}`;
            await sock.sendMessage(remoteJid, { text });
            return;
        }
    } catch (e) {}
    
    try {
        const response = await axios.get(`https://wttr.in/${encodeURIComponent(query)}?format=%l:+%C+%t+%w+%h`, { timeout: 10000 });
        await sock.sendMessage(remoteJid, { text: `🌤️ *Weather: ${query}*\n\n📊 ${response.data}\n\n🔗 https://wttr.in/${encodeURIComponent(query)}\n\n${footer}` });
    } catch (e) {
        await sock.sendMessage(remoteJid, { text: `🔗 Weather: https://wttr.in/${encodeURIComponent(query)}\n\n${footer}` });
    }
}

// ===== LYRICS SEARCH =====
async function handleLyrics(sock, msg, query, startTime) {
    const remoteJid = msg.key.remoteJid;
    await react(sock, remoteJid, msg.key, '🎵');
    
    try {
        const response = await axios.get(`https://api.davidcyriltech.my.id/search/lyrics?query=${encodeURIComponent(query)}`, { timeout: 10000 });
        
        if (response.data?.lyrics) {
            const lyrics = response.data.lyrics;
            const title = response.data.title || query;
            const artist = response.data.artist || '';
            
            let text = `🎵 *Lyrics: ${title}*\n`;
            if (artist) text += `👤 *Artist:* ${artist}\n`;
            text += `\n${lyrics.substring(0, 800)}...\n\n${footer}`;
            
            await sock.sendMessage(remoteJid, { text });
            return;
        }
    } catch (e) {}
    
    try {
        const response = await axios.get(`https://api.giftedtech.my.id/api/search/lyrics?apikey=gifted&query=${encodeURIComponent(query)}`, { timeout: 10000 });
        
        if (response.data?.lyrics) {
            const lyrics = response.data.lyrics;
            let text = `🎵 *Lyrics: ${query}*\n\n${lyrics.substring(0, 800)}...\n\n${footer}`;
            await sock.sendMessage(remoteJid, { text });
            return;
        }
    } catch (e) {}
    
    await sock.sendMessage(remoteJid, { 
        text: `🎵 *Lyrics Search: ${query}*\n\n` +
              `🔗 Genius: https://genius.com/search?q=${encodeURIComponent(query)}\n` +
              `🔗 AZLyrics: https://search.azlyrics.com/search.php?q=${encodeURIComponent(query)}\n` +
              `🔗 Musixmatch: https://www.musixmatch.com/search/${encodeURIComponent(query)}\n\n` +
              `💡 Open links to view full lyrics\n\n${footer}` 
    });
}

// ===== TRANSLATE =====
async function handleTranslate(sock, msg, text, startTime) {
    const remoteJid = msg.key.remoteJid;
    await react(sock, remoteJid, msg.key, '🌐');
    
    const parts = text.split(' ').slice(1).join(' ').trim();
    const langMatch = parts.match(/^([a-z]{2})\|([a-z]{2})\s(.+)/);
    
    if (langMatch) {
        const [, from, to, query] = langMatch;
        try {
            const response = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(query)}`, { timeout: 10000 });
            const translated = response.data[0].map(x => x[0]).join('');
            await sock.sendMessage(remoteJid, { text: `🌐 *Translate (${from.toUpperCase()} → ${to.toUpperCase()})*\n\n📝 *Original:* ${query}\n🔁 *Translated:* ${translated}\n\n${footer}` });
        } catch (e) {
            await sock.sendMessage(remoteJid, { text: `🔗 Translate: https://translate.google.com/?sl=${from}&tl=${to}&text=${encodeURIComponent(query)}\n\n${footer}` });
        }
    } else {
        try {
            const query = parts;
            const response = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(query)}`, { timeout: 10000 });
            const translated = response.data[0].map(x => x[0]).join('');
            const detectedLang = response.data[2];
            await sock.sendMessage(remoteJid, { text: `🌐 *Auto Translate*\n\n📝 *Original (${detectedLang}):* ${query}\n🔁 *English:* ${translated}\n\n💡 Use: .tr en|si <text> for specific languages\n\n${footer}` });
        } catch (e) {
            await sock.sendMessage(remoteJid, { text: `❌ *Format:* .tr en|si hello world\n\n📌 Example:\n.tr en|si how are you\n.tr si|en කොහොමද\n\nOr just: .tr <text> for auto-detect\n\n${footer}` });
        }
    }
}

// ===== URBAN DICTIONARY =====
async function handleUrban(sock, msg, query, startTime) {
    const remoteJid = msg.key.remoteJid;
    await react(sock, remoteJid, msg.key, '📖');
    
    try {
        const response = await axios.get(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(query)}`, { timeout: 10000 });
        const list = response.data?.list;
        
        if (list?.length > 0) {
            let text = `📖 *Urban Dictionary: ${query}*\n\n`;
            list.slice(0, 3).forEach((def, i) => {
                text += `*${i+1}.* ${def.definition?.replace(/\[|\]/g, '').substring(0, 200)}...\n`;
                if (def.example) text += `💬 ${def.example?.replace(/\[|\]/g, '').substring(0, 100)}...\n`;
                text += `👍 ${def.thumbs_up} | 👎 ${def.thumbs_down}\n\n`;
            });
            await sock.sendMessage(remoteJid, { text: text + footer });
            return;
        }
    } catch (e) {}
    
    await sock.sendMessage(remoteJid, { text: `🔗 Urban Dictionary: https://www.urbandictionary.com/define.php?term=${encodeURIComponent(query)}\n\n${footer}` });
}

// ===== IP LOOKUP =====
async function handleIP(sock, msg, query, startTime) {
    const remoteJid = msg.key.remoteJid;
    await react(sock, remoteJid, msg.key, '📍');
    
    try {
        const response = await axios.get(`http://ip-api.com/json/${encodeURIComponent(query)}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`, { timeout: 10000 });
        const data = response.data;
        
        if (data.status === 'success') {
            let text = `📍 *IP Lookup*\n\n`;
            text += `🌍 *IP:* ${data.query}\n`;
            text += `🏙️ *Location:* ${data.city}, ${data.regionName}, ${data.country} (${data.countryCode})\n`;
            text += `📮 *ZIP:* ${data.zip || 'N/A'}\n`;
            text += `📍 *Coordinates:* ${data.lat}, ${data.lon}\n`;
            text += `📡 *ISP:* ${data.isp}\n`;
            text += `🏢 *Org:* ${data.org || 'N/A'}\n`;
            text += `🔢 *AS:* ${data.as || 'N/A'}\n`;
            text += `⏰ *Timezone:* ${data.timezone}\n\n${footer}`;
            await sock.sendMessage(remoteJid, { text });
            return;
        }
    } catch (e) {}
    
    await sock.sendMessage(remoteJid, { text: `❌ *IP lookup failed*\n\n🔗 Check: https://whatismyipaddress.com/ip/${query}\n\n${footer}` });
}

// ===== GIF SEARCH =====
async function handleGIF(sock, msg, query, startTime) {
    const remoteJid = msg.key.remoteJid;
    await react(sock, remoteJid, msg.key, '🎬');
    
    try {
        const response = await axios.get(`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(query)}&limit=3&rating=g`, { timeout: 10000 });
        const gifs = response.data?.data;
        
        if (gifs?.length > 0) {
            const gif = gifs[0];
            await sock.sendMessage(remoteJid, { 
                video: { url: gif.images.original.mp4 || gif.images.original.url },
                caption: `🎬 *GIF: ${query}*\n📌 ${gif.title}\n🔗 ${gif.url}\n\n${footer}`,
                mimetype: 'video/mp4',
                gifPlayback: true
            });
            return;
        }
    } catch (e) {}
    
    try {
        const response = await axios.get(`https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=AIzaSyD-EXAMPLE&limit=1`, { timeout: 10000 });
        const gif = response.data?.results?.[0];
        if (gif) {
            await sock.sendMessage(remoteJid, { 
                video: { url: gif.media_formats?.mp4?.url || gif.media_formats?.gif?.url },
                caption: `🎬 *GIF: ${query}*\n\n${footer}`,
                mimetype: 'video/mp4',
                gifPlayback: true
            });
            return;
        }
    } catch (e) {}
    
    await sock.sendMessage(remoteJid, { text: `🔗 GIPHY: https://giphy.com/search/${encodeURIComponent(query)}\n🔗 Tenor: https://tenor.com/search/${encodeURIComponent(query)}\n\n${footer}` });
}

// ===== CALCULATOR =====
async function handleCalc(sock, msg, expression, startTime) {
    const remoteJid = msg.key.remoteJid;
    await react(sock, remoteJid, msg.key, '🧮');
    
    try {
        const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, '');
        const result = eval(sanitized);
        
        if (isNaN(result) || !isFinite(result)) throw new Error('Invalid');
        
        await sock.sendMessage(remoteJid, { text: `🧮 *Calculator*\n\n📝 ${expression}\n✅ = *${result}*\n\n${footer}` });
    } catch (e) {
        await sock.sendMessage(remoteJid, { text: `❌ *Invalid expression!*\n\n📝 ${expression}\n\n💡 Example: .calc 2+2*3\n\n${footer}` });
    }
}

// ===== DNS/WHOIS =====
async function handleDNS(sock, msg, domain, startTime) {
    const remoteJid = msg.key.remoteJid;
    await react(sock, remoteJid, msg.key, '🔍');
    
    domain = domain.replace(/https?:\/\//g, '').replace(/\/.*/g, '');
    
    try {
        const response = await axios.get(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`, { timeout: 10000 });
        const answers = response.data?.Answer;
        
        if (answers?.length > 0) {
            let text = `🔍 *DNS Lookup: ${domain}*\n\n`;
            answers.forEach(a => {
                text += `📡 *${a.type} Record:* ${a.data}\n`;
            });
            text += `\n🔗 WHOIS: https://who.is/whois/${domain}\n🔗 DNS: https://dns.google.com/query?name=${domain}\n\n${footer}`;
            await sock.sendMessage(remoteJid, { text });
            return;
        }
    } catch (e) {}
    
    await sock.sendMessage(remoteJid, { text: `🔍 *Domain Lookup*\n\n🌐 *Domain:* ${domain}\n🔗 WHOIS: https://who.is/whois/${domain}\n🔗 DNS: https://dns.google.com/query?name=${domain}\n\n${footer}` });
}

module.exports = {
    handleGoogle,
    handleWikipedia,
    handleWeather,
    handleLyrics,
    handleTranslate,
    handleUrban,
    handleIP,
    handleGIF,
    handleCalc,
    handleDNS
};