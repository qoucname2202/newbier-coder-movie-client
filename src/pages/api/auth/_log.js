// Handle auth error logging for API
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Log auth errors
    console.error('Auth log:', req.body);
    
    // Return success
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error logging auth event:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}