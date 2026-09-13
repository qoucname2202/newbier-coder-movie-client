import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }    // Send request to backend API using axios for consistency
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/forgot-password`, 
      { email }
    );
    
    // Add success flag if not present in the response
    const responseData = {
      ...response.data,
      success: true
    };
    
    // Return the response from the backend
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Forgot password error:', error);
    
    // Forward error from the backend if available
    if (error.response) {
      return res.status(error.response.status).json({
        message: error.response.data.error || error.response.data.message || 'Forgot password failed',
      });
    }

    // Generic error
    return res.status(500).json({ message: error.message || 'Server error. Please try again later.' });
  }
}
