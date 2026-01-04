export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    path: req.url
  });
}