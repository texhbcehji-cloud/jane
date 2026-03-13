const axios = require('axios');
const express = require('express');

// الإعدادات المباشرة
const API_KEY = 'UAKd9d5512d-6f21-4d74-961d-c852a2d1d725'; 
const GOOGLE_URL = "https://script.google.com/macros/s/AKfycbyqZsqSsrDeJpxwDmu8rNFIT1rI6bEXLOeeR2tYebtRLYEMFPWjjAGhxliuSVP0XRNx/exec";

let seenMessages = new Set();

// دالة فحص الرسائل
async function monitor2Chat() {
    try {
        console.log(`[${new Date().toLocaleTimeString()}] محاولة اتصال بـ 2Chat...`);
        
        const response = await axios.get('https://api.2chat.io/v1/messages', {
            params: { direction: 'outbound', limit: 15 },
            headers: { 'Authorization': API_KEY },
            timeout: 20000 // زيادة المهلة لـ 20 ثانية
        });

        const messages = response.data?.data || [];
        console.log(`تم جلب ${messages.length} رسالة.`);

        for (let msg of messages) {
            if (msg.text && msg.text.includes('Go') && !seenMessages.has(msg.id)) {
                console.log(`🎯 صيد ثمين! وجدنا "Go" في الرسالة ${msg.id}`);

                await axios.post(GOOGLE_URL, {
                    phone: msg.remote_jid,
                    text: msg.text,
                    timestamp: msg.created_at
                });

                seenMessages.add(msg.id);
            }
        }
    } catch (error) {
        if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN' || error.code === 'ETIMEDOUT') {
            console.error("⚠️ فشل في التعرف على العنوان (DNS/Network). سأحاول مجدداً بعد قليل...");
        } else {
            console.error("❌ خطأ برمجي أو في الصلاحيات:", error.message);
        }
    }
}

// إعداد سيرفر ويب بسيط للبقاء نشطاً
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => res.send('Worker is Alive'));

app.listen(PORT, () => {
    console.log(`✅ السيرفر يعمل الآن على منفذ ${PORT}`);
    // بدء الفحص الأول بعد 15 ثانية لضمان استقرار حاوية Railway
    setTimeout(monitor2Chat, 15000);
});

// تكرار الفحص كل دقيقة
setInterval(monitor2Chat, 60000);
