const axios = require('axios');
const express = require('express');

// الإعدادات المباشرة
const API_KEY = 'UAKd9d5512d-6f21-4d74-961d-c852a2d1d725'; 
const GOOGLE_URL = "https://script.google.com/macros/s/AKfycbyqZsqSsrDeJpxwDmu8rNFIT1rI6bEXLOeeR2tYebtRLYEMFPWjjAGhxliuSVP0XRNx/exec";

let seenMessages = new Set();

async function monitor2Chat() {
    try {
        console.log(`[${new Date().toLocaleTimeString()}] جاري محاولة الفحص...`);
        
        // استخدام Axios مع إعدادات إضافية لتجاوز مشاكل الشبكة
        const response = await axios({
            method: 'get',
            url: 'https://api.2chat.io/v1/messages',
            params: {
                direction: 'outbound',
                limit: 15
            },
            headers: { 
                'Authorization': API_KEY,
                'Accept': 'application/json'
            },
            timeout: 15000 // زيادة مهلة الانتظار لـ 15 ثانية
        });

        const messages = response.data && response.data.data ? response.data.data : [];

        if (messages.length === 0) {
            console.log("لا توجد رسائل صادرة.");
        }

        for (let msg of messages) {
            if (msg.text && msg.text.includes('Go') && !seenMessages.has(msg.id)) {
                
                console.log(`✅ تم العثور على Go! يرسل الآن إلى جوجل...`);

                await axios.post(GOOGLE_URL, {
                    phone: msg.remote_jid,
                    text: msg.text,
                    timestamp: msg.created_at
                }).catch(e => console.error("خطأ جوجل شيت:", e.message));

                seenMessages.add(msg.id);
            }
        }

    } catch (error) {
        if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
            console.error("⚠️ مشكلة في DNS السيرفر. سأحاول مجدداً في الدورة القادمة.");
        } else if (error.response) {
            console.error(`❌ خطأ من 2Chat (Status: ${error.response.status}):`, error.response.data);
        } else {
            console.error("❌ خطأ غير متوقع:", error.message);
        }
    }
}

const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => res.send('System Active'));

app.listen(PORT, () => {
    console.log(`Server is live on port ${PORT}`);
    // تأخير البداية قليلاً للسماح للشبكة بالاستقرار
    setTimeout(monitor2Chat, 10000);
});

// الفحص كل 60 ثانية
setInterval(monitor2Chat, 60000);
