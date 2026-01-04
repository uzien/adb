import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  const { language = 'uz', limit = 10 } = req.query;

  const { data, error } = await supabase
    .from('news_posts')
    .select('*')
    .eq('status', 'published')
    .eq('language', language)
    .order('published_at', { ascending: false })
    .limit(parseInt(limit));

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
}