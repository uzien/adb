import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const ADMIN_IDS = process.env.TELEGRAM_ADMIN_IDS?.split(',') || [];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const update = req.body;
  const message = update.message;
  
  if (!message || !message.text) {
    return res.status(200).json({ ok: true });
  }

  const chatId = message.chat.id;
  const text = message.text.trim();

  // Check if user is admin
  if (!ADMIN_IDS.includes(chatId.toString())) {
    await sendMessage(chatId, "⚠️ Siz admin emassiz!");
    return res.status(200).json({ ok: true });
  }

  // Handle /start command
  if (text === '/start') {
    await sendMessage(chatId, 
      `🤖 *ADU Litsey Admin Bot*\n\n` +
      `*Buyruqlar:*\n` +
      `/news - Yangilik qo'shish\n` +
      `/list - Yangiliklarni ko'rish\n` +
      `/publish [id] - Yangilikni nashr qilish\n` +
      `/help - Yordam`
    );
  }

  // Handle /news command
  else if (text.startsWith('/news')) {
    const parts = text.split('|').map(p => p.trim());
    if (parts.length < 3) {
      await sendMessage(chatId, 
        "📝 *Format:*\n" +
        "`/news Sarlavha|Matn|Rasm URL (ixtiyoriy)`\n\n" +
        "*Misol:*\n" +
        "`/news Yangi laboratoriya|Bugun yangi...|https://image.url`"
      );
    } else {
      const title = parts[0].replace('/news ', '');
      const content = parts[1];
      const imageUrl = parts[2] || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80';
      
      const { data, error } = await supabase
        .from('news_posts')
        .insert([{
          title: title,
          content: content,
          excerpt: content.substring(0, 150) + '...',
          image_url: imageUrl,
          status: 'draft'
        }]);

      if (error) {
        await sendMessage(chatId, `❌ Xatolik: ${error.message}`);
      } else {
        await sendMessage(chatId, 
          `✅ *Yangi yangilik qo'shildi!*\n\n` +
          `*Sarlavha:* ${title}\n` +
          `*ID:* ${data[0].id}\n\n` +
          `Nashr qilish uchun:\n` +
          `\`/publish ${data[0].id}\``
        );
      }
    }
  }

  // Handle /list command
  else if (text === '/list') {
    const { data } = await supabase
      .from('news_posts')
      .select('id, title, status')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!data || data.length === 0) {
      await sendMessage(chatId, "📭 Yangiliklar topilmadi.");
    } else {
      let message = "📋 *Yangi yangiliklar:*\n\n";
      data.forEach((item, index) => {
        message += `${index + 1}. ${item.title} (${item.status})\n`;
        message += `   ID: \`${item.id}\`\n\n`;
      });
      await sendMessage(chatId, message);
    }
  }

  // Handle /publish command
  else if (text.startsWith('/publish')) {
    const id = text.replace('/publish ', '').trim();
    
    const { data, error } = await supabase
      .from('news_posts')
      .update({ 
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error || !data || data.length === 0) {
      await sendMessage(chatId, "❌ Yangilik topilmadi yoki xatolik yuz berdi.");
    } else {
      await sendMessage(chatId, 
        `🎉 *Yangilik nashr qilindi!*\n\n` +
        `*${data[0].title}*\n` +
        `Vebsaytda ko'rish mumkin.`
      );
    }
  }

  return res.status(200).json({ ok: true });
}

async function sendMessage(chatId, text) {
  const response = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
      }),
    }
  );
  return response.json();
}