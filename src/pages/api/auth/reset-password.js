import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { token, newPassword, confirmPassword } = req.body;

    // Validate required fields
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }    // Send request to backend API using axios
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/reset-password`,
      {
        token,
        newPassword,
        confirmPassword
      }
    );
    
    // Add success flag if not present in the response
    const responseData = {
      ...response.data,
      success: true
    };
    
    // Return the response from the backend
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Reset password error:', error);
    
    // Forward error from the backend if available
    if (error.response) {
      return res.status(error.response.status).json({
        message: error.response.data.error || error.response.data.message || 'Reset password failed',
      });
    }

    // Generic error
    return res.status(500).json({ message: error.message || 'Server error. Please try again later.' });
  }
}
