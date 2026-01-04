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
  const isAdmin = ADMIN_IDS.includes(chatId.toString());

  // Handle /start command
  if (text === '/start') {
    if (isAdmin) {
      await sendMessage(chatId, 
        `🤖 *ADU Litsey Admin Bot*\n\n` +
        `*Admin Buyruqlar:*\n` +
        `/news - Yangilik qo'shish\n` +
        `/list - Yangiliklarni ko'rish\n` +
        `/publish [id] - Yangilikni nashr qilish\n` +
        `/help - Yordam`
      );
    } else {
      await sendMessage(chatId, 
        `Assalomu alaykum! Bu ADU Litseyning admin boti. ` +
        `Agar siz admin bo'lsangiz, iltimos adminlar bilan bog'laning.`
      );
    }
    return res.status(200).json({ ok: true });
  }

  // If not admin and trying to use admin commands
  if (!isAdmin) {
    await sendMessage(chatId, "⚠️ Siz admin emassiz! Bu bot faqat adminlar uchun.");
    return res.status(200).json({ ok: true });
  }

  // Handle /news command (admin only)
  if (text.startsWith('/news')) {
    const parts = text.split('|').map(p => p.trim());
    if (parts.length < 3) {
      await sendMessage(chatId, 
        "📝 *Format:*\n" +
        "`/news Sarlavha|Matn|Rasm URL (ixtiyoriy)`\n\n" +
        "*Misol:*\n" +
        "`/news Yangi laboratoriya|Bugun yangi laboratoriya ochildi...|https://image.url`"
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
          status: 'draft',
          language: 'uz'
        }]);

      if (error) {
        await sendMessage(chatId, `❌ Xatolik: ${error.message}`);
      } else {
        await sendMessage(chatId, 
          `✅ *Yangi yangilik qo'shildi!*\n\n` +
          `*Sarlavha:* ${title}\n` +
          `*ID:* \`${data[0].id}\`\n\n` +
          `Nashr qilish uchun:\n` +
          `\`/publish ${data[0].id}\``
        );
      }
    }
  }

  // Handle /list command (admin only)
  else if (text === '/list') {
    const { data } = await supabase
      .from('news_posts')
      .select('id, title, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!data || data.length === 0) {
      await sendMessage(chatId, "📭 Yangiliklar topilmadi.");
    } else {
      let messageText = "📋 *Yangi yangiliklar:*\n\n";
      data.forEach((item, index) => {
        const date = new Date(item.created_at).toLocaleDateString('uz-UZ');
        messageText += `${index + 1}. ${item.title}\n`;
        messageText += `   Status: ${item.status}\n`;
        messageText += `   ID: \`${item.id}\`\n`;
        messageText += `   Sana: ${date}\n\n`;
      });
      await sendMessage(chatId, messageText);
    }
  }

  // Handle /publish command (admin only)
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
        `*${data[0].title}*\n\n` +
        `Endi vebsaytda ko'rish mumkin: \n` +
        `https://adulitsey.netlify.app`
      );
    }
  }

  // Handle /help command (admin only)
  else if (text === '/help') {
    await sendMessage(chatId, 
      `🤖 *ADU Litsey Admin Bot*\n\n` +
      `*Buyruqlar:*\n` +
      `/news - Yangilik qo'shish\n` +
      `/list - Yangiliklarni ko'rish\n` +
      `/publish [id] - Yangilikni nashr qilish\n` +
      `/help - Yordam\n\n` +
      `*Format:*\n` +
      `\`/news Sarlavha|Matn|Rasm URL\`\n` +
      `\`/publish yangilik_id\``
    );
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
