const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
// سنأخذ الروابط من إعدادات Railway للأمان
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

app.post('/webhook', async (req, res) => {
    const data = req.body;

    // التأكد من أن الحدث هو رسالة صادرة وتحتوي على كلمة Go
    // ملاحظة: 2Chat يرسل البيانات عادة في كائن يسمى 'data' أو مباشرة حسب نوع الـ Webhook
    const messageText = data.text || "";
    const isOutbound = data.direction === 'outbound';

    if (isOutbound && messageText.includes('Go')) {
        console.log(`تم العثور على كلمة Go في رسالة إلى: ${data.remote_jid}`);
        
        try {
            await axios.post(GOOGLE_SCRIPT_URL, {
                date: new Date().toLocaleString(),
                phone: data.remote_jid,
                message: messageText,
                status: 'Sent via 2Chat'
            });
            console.log('تم الإرسال إلى Google Sheets بنجاح');
        } catch (error) {
            console.error('خطأ في الإرسال لجوجل:', error.message);
        }
    }

    res.status(200).send('Event Received');
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
