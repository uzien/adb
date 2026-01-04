import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fullName, email, phone, birthDate, program, message } = req.body;

    // 1. Save to database
    const { data: dbData, error: dbError } = await supabase
      .from('applications')
      .insert([{
        full_name: fullName,
        email: email,
        phone: phone,
        birth_date: birthDate,
        program: program,
        message: message
      }]);

    if (dbError) throw dbError;

    // 2. Send to Telegram
    const telegramMessage = `
🎓 *YANGI ARIZA!* 
    
👤 *Ism:* ${fullName}
📧 *Email:* ${email}
📱 *Telefon:* ${phone}
🎂 *Tug'ilgan sana:* ${birthDate}
📚 *Yo'nalish:* ${program}
💬 *Xabar:* ${message || "Yo'q"}

⏰ *Vaqt:* ${new Date().toLocaleString('uz-UZ')}
🆔 *ID:* ${dbData[0].id.substring(0, 8)}
    `;

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: telegramMessage,
          parse_mode: 'Markdown',
        }),
      }
    );

    return res.status(200).json({ 
      success: true, 
      message: 'Application submitted successfully!' 
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}