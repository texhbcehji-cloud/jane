const axios = require('axios');
const express = require('express');

// الإعدادات المباشرة
const API_KEY = 'UAKd9d5512d-6f21-4d74-961d-c852a2d1d725'; 
const GOOGLE_URL = "https://script.google.com/macros/s/AKfycbyqZsqSsrDeJpxwDmu8rNFIT1rI6bEXLOeeR2tYebtRLYEMFPWjjAGhxliuSVP0XRNx/exec";

let seenMessages = new Set();

async function monitor2Chat() {
    try {
        console.log(`[${new Date().toLocaleTimeString()}] جاري فحص الرسائل...`);
        
        // تعديل الرابط ليكون المسار كاملاً وصحيحاً
        const response = await axios.get('https://api.2chat.io/v1/messages?direction=outbound&limit=20', {
            headers: { 
                'Authorization': API_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 10000 // مهلة 10 ثوانٍ للرد
        });

        // التأكد من وجود بيانات
        const messages = response.data && response.data.data ? response.data.data : [];

        if (messages.length === 0) {
            console.log("لا توجد رسائل صادرة حالياً.");
        }

        for (let msg of messages) {
            if (msg.text && msg.text.includes('Go') && !seenMessages.has(msg.id)) {
                
                console.log(`✅ تم العثور على "Go" في الرسالة: ${msg.id}`);

                await axios.post(GOOGLE_URL, {
                    phone: msg.remote_jid,
                    text: msg.text,
                    timestamp: msg.created_at
                }).catch(err => console.error("خطأ أثناء الإرسال لجوجل:", err.message));

                seenMessages.add(msg.id);
            }
        }

        // تنظيف الذاكرة
        if (seenMessages.size > 500) {
            const iterator = seenMessages.values();
            seenMessages.delete(iterator.next().value);
        }

    } catch (error) {
        // معالجة خطأ الاتصال بشكل أفضل
        if (error.code === 'ENOTFOUND') {
            console.error("❌ خطأ: تعذر الوصول إلى سيرفر 2Chat (مشكلة DNS أو إنترنت).");
        } else {
            console.error("❌ خطأ أثناء الفحص:", error.message);
        }
    }
}

// إنشاء سيرفر ويب بسيط لإبقاء التطبيق حياً في Railway
const app = express();
app.get('/', (req, res) => res.send('OK - Monitoring Active'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is live on port ${PORT}`);
    // بدء الفحص بعد 5 ثوانٍ من تشغيل السيرفر للتأكد من استقرار الشبكة
    setTimeout(monitor2Chat, 5000);
});

// الفحص الدوري كل 60 ثانية
setInterval(monitor2Chat, 60000);
