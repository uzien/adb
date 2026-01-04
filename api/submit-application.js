export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Form received at:', new Date().toISOString());
  console.log('Headers:', req.headers);
  
  try {
    const body = await req.json();
    console.log('Form data:', body);
    
    // Always return success for now
    return res.status(200).json({ 
      success: true, 
      message: 'Form received successfully!',
      receivedAt: new Date().toISOString(),
      data: body
    });
    
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return res.status(400).json({ 
      success: false,
      error: 'Invalid JSON',
      details: error.message 
    });
  }
}