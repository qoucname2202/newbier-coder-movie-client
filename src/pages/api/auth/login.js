import authService from '../../../API/services/authService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Gửi request tới backend API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Backend trả về lỗi trong field 'error'
      throw new Error(data.error || data.message || 'Login failed');
    }

    // Return the response from the backend
    return res.status(200).json(data);
  } catch (error) {
    console.error('Login error:', error);
    
    // Forward error from the backend if available
    if (error.response) {
      return res.status(error.response.status).json({
        message: error.response.data.error || error.response.data.message || 'Authentication failed',
      });
    }

    // Generic error
    return res.status(500).json({ message: error.message || 'Server error. Please try again later.' });
  }
}