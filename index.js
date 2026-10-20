const mineflayer = require('mineflayer');
const fs = require('fs');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 10000;

// ---------- 使用者注意 ----------
/* 在這裡填入你的 Minecraft 帳號資訊
   不要把你的帳號寫死在公開程式碼中 */
const MINECRAFT_USERNAME = 'YOUR_EMAIL_OR_USERNAME';
const MINECRAFT_AUTH = 'microsoft'; // 或 'mojang'

// 伺服器設定
const SERVER_HOST = 'YOUR_SERVER_IP_OR_DOMAIN';
const SERVER_PORT = 25565;

// 運行模式選擇
// "cloud" = Render 雲端掛機
// "local" = 本地終端機掛機（可開機自動啟動）
const RUN_MODE = 'cloud'; 

let sessionFile = 'session.json';
let session;

let botActive = true;
let bot;

function createBot() {
    if (!botActive) return;

    bot = mineflayer.createBot({
        host: SERVER_HOST,
        port: SERVER_PORT,
        username: MINECRAFT_USERNAME,
        auth: MINECRAFT_AUTH,
        version: '1.20.4', // 適用伺服器版本
        session: session
    });

    // ---------- Bot 事件 ----------
    bot.on('microsoftAuth', (newSession) => {
        session = newSession;
        fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));
        console.log('Microsoft session 已保存');
    });

    bot.on('spawn', () => {
        console.log('Bot 已 spawn');
        if (RUN_MODE === 'cloud') {
            console.log('運行模式：雲端 Render');
        } else {
            console.log('運行模式：本地終端機');
        }
    });

    bot.on('end', () => {
        console.log('Bot 已掉線');
        if (botActive) setTimeout(createBot, 5000); // 自動重連
    });

    bot.on('error', console.log);
    bot.on('kicked', console.log);
    bot.on('login', () => console.log('Bot 已登入'));
}

// 啟動 Bot
createBot();

// ------------------ Web 介面 ------------------
if (RUN_MODE === 'cloud') {
    // 雲端模式才啟用 Web 控制
    app.get('/pause', (req, res) => {
        botActive = false;
        if (bot) bot.quit('被暫停');
        res.send('Bot 已暫停
回主頁');
    });

    app.get('/resume', (req, res) => {
        if (!botActive) {
            botActive = true;
            createBot();
        }
        res.send('Bot 已啟動
回主頁');
    });

    app.get('/', (req, res) => {
        const botStatus = botActive ? (bot?.entity ? '在線' : '離線') : '暫停';
        res.send(`
            
            
            
                
Bot 控制面板

                
Bot 狀態: ${botStatus}


                暫停 Bot
                啟動 Bot
            
            
        `);
    });

    app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));
} else {
    console.log('本地終端機模式，不啟用 Web 介面');
}
