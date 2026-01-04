import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Form received:', req.body);
  
  try {
    const { fullName, email, phone, birthDate, program, message } = req.body;
    
    // 1. Save to database
    const { data, error } = await supabase
      .from('applications')
      .insert([{
        full_name: fullName,
        email: email,
        phone: phone,
        birth_date: birthDate,
        program: program,
        message: message,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Database error',
        details: error.message 
      });
    }

    // 2. Send to Telegram
    const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    
    if (TELEGRAM_TOKEN && CHAT_ID) {
      const telegramMessage = `
🎓 *YANGI ARIZA!* 

👤 *Ism:* ${fullName}
📧 *Email:* ${email}
📱 *Telefon:* ${phone}
📚 *Yo'nalish:* ${program}
⏰ *Vaqt:* ${new Date().toLocaleString('uz-UZ')}
      `;

      await fetch(
        `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: CHAT_ID,
            text: telegramMessage,
            parse_mode: 'Markdown',
          }),
        }
      );
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Application submitted! We will contact you soon.',
      id: data[0].id
    });
    
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
}