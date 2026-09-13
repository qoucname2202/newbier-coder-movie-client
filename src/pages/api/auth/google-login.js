import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, name, googleId, picture } = req.body;

    // Validate required fields
    if (!email || !googleId) {
      return res.status(400).json({ message: 'Email and Google ID are required' });
    }

    // Call your backend API endpoint for Google authentication
    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/google-login`, {
      email,
      name,
      googleId,
      picture
    });

    // Return the response from the backend
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Google login error:', error);
    
    // Forward error from the backend if available
    if (error.response) {
      return res.status(error.response.status).json({
        message: error.response.data.message || 'Google authentication failed',
      });
    }

    // Generic error
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
}