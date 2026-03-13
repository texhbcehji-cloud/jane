const axios = require('axios');

// الإعدادات المباشرة (Hardcoded)
const API_KEY = 'UAKd9d5512d-6f21-4d74-961d-c852a2d1d725'; 
const GOOGLE_URL = "https://script.google.com/macros/s/AKfycbyqZsqSsrDeJpxwDmu8rNFIT1rI6bEXLOeeR2tYebtRLYEMFPWjjAGhxliuSVP0XRNx/exec";

// مصفوفة لحفظ المعرفات ومنع تكرار إرسال نفس الرسالة
let seenMessages = new Set();

async function monitor2Chat() {
    try {
        console.log(`[${new Date().toLocaleTimeString()}] جاري فحص الرسائل الجديدة...`);
        
        // جلب آخر 20 رسالة صادرة من API
        const response = await axios.get('https://api.2chat.io/v1/messages?direction=outbound&limit=20', {
            headers: { 'Authorization': API_KEY }
        });

        const messages = response.data.data || [];

        for (let msg of messages) {
            // الشروط: تحتوي على Go، لم يتم معالجتها من قبل، وليست فارغة
            if (msg.text && msg.text.includes('Go') && !seenMessages.has(msg.id)) {
                
                console.log(`✅ تم العثور على تطابق! إرسال الرسالة رقم: ${msg.id}`);

                await axios.post(GOOGLE_URL, {
                    phone: msg.remote_jid,
                    text: msg.text,
                    timestamp: msg.created_at
                });

                // تسجيل الرسالة كـ "تمت معالجتها"
                seenMessages.add(msg.id);
            }
        }

        // تنظيف الذاكرة دورياً (حفظ آخر 500 معرف فقط)
        if (seenMessages.size > 500) {
            const iterator = seenMessages.values();
            seenMessages.delete(iterator.next().value);
        }

    } catch (error) {
        console.error("❌ خطأ أثناء الاتصال بـ 2Chat:", error.message);
    }
}

// الفحص كل 60 ثانية
setInterval(monitor2Chat, 60000);

// تشغيل الفحص الأول عند تشغيل السيرفر
monitor2Chat();

// إبقاء السيرفر حياً لـ Railway
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('2Chat Monitor is running...'));
app.listen(process.env.PORT || 3000);
