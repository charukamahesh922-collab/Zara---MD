const { react, getUptime, footer } = require('../utils/helper');
const axios = require('axios');

// ===== CHATGPT / AI CHAT =====
async function handleAI(sock, msg, query, startTime) {
    const remoteJid = msg.key.remoteJid;
    await react(sock, remoteJid, msg.key, '🤖');
    
    try {
        // Using free GPT API
        const response = await axios.get(`https://api.davidcyriltech.my.id/ai/gpt?prompt=${encodeURIComponent(query)}`, { timeout: 30000 });
        
        if (response.data?.response || response.data?.result) {
            const aiResponse = response.data.response || response.data.result;
            let text = `🤖 *AI Response*\n\n`;
            text += `📝 *Query:* ${query}\n\n`;
            text += `💬 *Answer:*\n${aiResponse}\n\n`;
            text += `⚡ Powered by GPT\n\n${footer}`;
            await sock.sendMessage(remoteJid, { text });
            return;
        }
    } catch (e) {}
    
    // Try backup API
    try {
        const response = await axios.get(`https://api.giftedtech.my.id/api/ai/gpt?apikey=gifted&query=${encodeURIComponent(query)}`, { timeout: 30000 });
        
        if (response.data?.response || response.data?.result) {
            const aiResponse = response.data.response || response.data.result;
            let text = `🤖 *AI Response*\n\n📝 *Query:* ${query}\n\n💬 *Answer:*\n${aiResponse}\n\n⚡ Powered by GPT\n\n${footer}`;
            await sock.sendMessage(remoteJid, { text });
            return;
        }
    } catch (e) {}
    
    // Try another API
    try {
        const response = await axios.get(`https://api.nexoracle.com/ai/chat?query=${encodeURIComponent(query)}`, { timeout: 30000 });
        
        if (response.data?.response || response.data?.result) {
            const aiResponse = response.data.response || response.data.result;
            let text = `🤖 *AI Response*\n\n📝 *Query:* ${query}\n\n💬 *Answer:*\n${aiResponse}\n\n⚡ Powered by GPT\n\n${footer}`;
            await sock.sendMessage(remoteJid, { text });
            return;
        }
    } catch (e) {}
    
    await sock.sendMessage(remoteJid, { text: `❌ *AI is currently unavailable*\n\n😔 All AI APIs are down\n💡 Please try again later\n\n${footer}` });
}

// ===== CHATGPT (Alternative) =====
async function handleChatGPT(sock, msg, query, startTime) {
    const remoteJid = msg.key.remoteJid;
    await react(sock, remoteJid, msg.key, '💬');
    
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: query }],
            max_tokens: 500
        }, {
            headers: {
                'Authorization': `Bearer YOUR_OPENAI_API_KEY`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
        
        const aiResponse = response.data?.choices?.[0]?.message?.content;
        
        if (aiResponse) {
            let text = `💬 *ChatGPT*\n\n📝 *Query:* ${query}\n\n🤖 *Response:*\n${aiResponse}\n\n⚡ Powered by OpenAI\n\n${footer}`;
            await sock.sendMessage(remoteJid, { text });
            return;
        }
    } catch (e) {}
    
    // Fallback to free API
    await handleAI(sock, msg, query, startTime);
}

// ===== IMAGE GENERATION (DALL-E / Stable Diffusion) =====
async function handleImagine(sock, msg, query, startTime) {
    const remoteJid = msg.key.remoteJid;
    await react(sock, remoteJid, msg.key, '🎨');
    
    try {
        // Try free AI image generator
        const response = await axios.get(`https://api.davidcyriltech.my.id/ai/imagine?prompt=${encodeURIComponent(query)}`, { timeout: 60000 });
        
        if (response.data?.image_url || response.data?.url) {
            const imageUrl = response.data.image_url || response.data.url;
            await sock.sendMessage(remoteJid, { 
                image: { url: imageUrl },
                caption: `🎨 *AI Generated Image*\n\n📝 *Prompt:* ${query}\n⚡ Powered by AI\n\n${footer}`
            });
            return;
        }
    } catch (e) {}
    
    // Try backup
    try {
        const response = await axios.get(`https://api.giftedtech.my.id/api/ai/imagine?apikey=gifted&prompt=${encodeURIComponent(query)}`, { timeout: 60000 });
        
        if (response.data?.image_url || response.data?.url) {
            const imageUrl = response.data.image_url || response.data.url;
            await sock.sendMessage(remoteJid, { 
                image: { url: imageUrl },
                caption: `🎨 *AI Generated Image*\n\n📝 *Prompt:* ${query}\n⚡ Powered by AI\n\n${footer}`
            });
            return;
        }
    } catch (e) {}
    
    await sock.sendMessage(remoteJid, { text: `❌ *Image generation failed*\n\n😔 Unable to generate image\n💡 Try: .ai ${query}\n\n${footer}` });
}

// ===== BLACKBOX AI (Coding Assistant) =====
async function handleBlackbox(sock, msg, query, startTime) {
    const remoteJid = msg.key.remoteJid;
    await react(sock, remoteJid, msg.key, '💻');
    
    try {
        const response = await axios.post('https://api.blackbox.ai/api/chat', {
            messages: [{ role: 'user', content: query }],
            model: 'deepseek-ai/DeepSeek-V3'
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });
        
        if (response.data?.choices?.[0]?.message?.content) {
            const aiResponse = response.data.choices[0].message.content;
            let text = `💻 *Code Assistant*\n\n📝 *Query:* ${query}\n\n🤖 *Response:*\n${aiResponse.substring(0, 800)}...\n\n⚡ Powered by Blackbox AI\n\n${footer}`;
            await sock.sendMessage(remoteJid, { text });
            return;
        }
    } catch (e) {}
    
    await sock.sendMessage(remoteJid, { text: `❌ *Code Assistant unavailable*\n\n😔 Please try again later\n\n${footer}` });
}

// ===== SIMI SIMI (Fun AI Chat) =====
async function handleSimi(sock, msg, query, startTime) {
    const remoteJid = msg.key.remoteJid;
    await react(sock, remoteJid, msg.key, '😄');
    
    try {
        const response = await axios.get(`https://api.simsimi.net/v2/?text=${encodeURIComponent(query)}&lc=en`, { timeout: 10000 });
        
        if (response.data?.success) {
            await sock.sendMessage(remoteJid, { text: `😄 *Simi Simi*\n\n📝 You: ${query}\n🤖 Simi: ${response.data.success}\n\n${footer}` });
            return;
        }
    } catch (e) {}
    
    try {
        const response = await axios.get(`https://simsimi.fun/api/v2/?text=${encodeURIComponent(query)}&lc=en`, { timeout: 10000 });
        
        if (response.data?.success) {
            await sock.sendMessage(remoteJid, { text: `😄 *Simi Simi*\n\n📝 You: ${query}\n🤖 Simi: ${response.data.success}\n\n${footer}` });
            return;
        }
    } catch (e) {}
    
    await sock.sendMessage(remoteJid, { text: `😄 *Simi Simi is sleeping*\n\n💤 Try again later!\n\n${footer}` });
}

// ===== CHARACTER AI =====
async function handleCharacter(sock, msg, query, startTime) {
    const remoteJid = msg.key.remoteJid;
    await react(sock, remoteJid, msg.key, '🎭');
    
    // Parse character and message: .char elon musk|what is spacex
    const parts = query.split('|');
    const character = parts[0]?.trim();
    const message = parts[1]?.trim();
    
    if (character && message) {
        try {
            const response = await axios.get(`https://api.davidcyriltech.my.id/ai/character?name=${encodeURIComponent(character)}&message=${encodeURIComponent(message)}`, { timeout: 30000 });
            
            if (response.data?.response) {
                await sock.sendMessage(remoteJid, { text: `🎭 *Character AI*\n\n👤 *${character}:*\n${response.data.response}\n\n${footer}` });
                return;
            }
        } catch (e) {}
    }
    
    await sock.sendMessage(remoteJid, { text: `🎭 *Character AI*\n\n📌 Usage: .char <character>|<message>\n💡 Example: .char elon musk|tell me about spacex\n\n${footer}` });
}

// ===== TEXT TO SPEECH =====
async function handleTTS(sock, msg, query, startTime) {
    const remoteJid = msg.key.remoteJid;
    await react(sock, remoteJid, msg.key, '🔊');
    
    try {
        const response = await axios.get(`https://api.davidcyriltech.my.id/ai/tts?text=${encodeURIComponent(query)}&lang=en`, { timeout: 30000 });
        
        if (response.data?.audio_url || response.data?.url) {
            const audioUrl = response.data.audio_url || response.data.url;
            await sock.sendMessage(remoteJid, { 
                audio: { url: audioUrl },
                mimetype: 'audio/mp4',
                ptt: false
            });
            await sock.sendMessage(remoteJid, { text: `🔊 *Text to Speech*\n\n📝 ${query}\n\n${footer}` });
            return;
        }
    } catch (e) {}
    
    await sock.sendMessage(remoteJid, { text: `❌ *TTS failed*\n\n😔 Unable to generate speech\n\n${footer}` });
}

// ===== ANIME AI ART =====
async function handleAnimeAI(sock, msg, query, startTime) {
    const remoteJid = msg.key.remoteJid;
    await react(sock, remoteJid, msg.key, '🎨');
    
    try {
        const response = await axios.get(`https://api.davidcyriltech.my.id/ai/anime?prompt=${encodeURIComponent(query)}`, { timeout: 60000 });
        
        if (response.data?.image_url || response.data?.url) {
            const imageUrl = response.data.image_url || response.data.url;
            await sock.sendMessage(remoteJid, { 
                image: { url: imageUrl },
                caption: `🎨 *Anime AI Art*\n\n📝 *Prompt:* ${query}\n⚡ Powered by AI\n\n${footer}`
            });
            return;
        }
    } catch (e) {}
    
    await sock.sendMessage(remoteJid, { text: `❌ *Anime generation failed*\n\n😔 Try again later\n\n${footer}` });
}

// ===== AI DETECTOR =====
async function handleAIDetect(sock, msg, query, startTime) {
    const remoteJid = msg.key.remoteJid;
    await react(sock, remoteJid, msg.key, '🔍');
    
    try {
        const response = await axios.post('https://api.sapling.ai/api/v1/aidetect', {
            text: query
        }, {
            params: { key: 'YOUR_SAPLING_API_KEY' },
            timeout: 15000
        });
        
        const score = response.data?.score;
        
        if (score !== undefined) {
            const percent = (score * 100).toFixed(1);
            const emoji = score > 0.8 ? '🤖' : score > 0.5 ? '🤔' : '👤';
            let text = `🔍 *AI Detection*\n\n`;
            text += `📊 *AI Score:* ${percent}% ${emoji}\n`;
            text += `📝 *Text:* ${query.substring(0, 200)}...\n\n`;
            if (score > 0.8) text += `⚠️ Likely AI-generated\n`;
            else if (score > 0.5) text += `🤔 Possibly AI-generated\n`;
            else text += `✅ Likely human-written\n`;
            text += `\n${footer}`;
            await sock.sendMessage(remoteJid, { text });
            return;
        }
    } catch (e) {}
    
    await sock.sendMessage(remoteJid, { text: `🔍 *AI Detection*\n\n📝 Text submitted for analysis\n\n💡 This feature requires an API key\n\n${footer}` });
}

module.exports = {
    handleAI,
    handleChatGPT,
    handleImagine,
    handleBlackbox,
    handleSimi,
    handleCharacter,
    handleTTS,
    handleAnimeAI,
    handleAIDetect
};