import authService from '../../../API/services/authService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const userData = req.body;
    console.log("API Router received signup data:", userData);

    // Validate required fields
    if (!userData.fullname || !userData.email || !userData.password) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }
    
    // Gửi request tới backend API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullname: userData.fullname,
        email: userData.email,
        password: userData.password,
        retype_password: userData.retype_password || userData.password,
        address: userData.address || '',
        phone: userData.phone || '',
        date_of_birth: userData.date_of_birth || ''
      }),
    });
    
    // Log toàn bộ response để debug
    const responseText = await response.text();
    console.log("Backend response text:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Error parsing JSON response:", e);
      if (responseText.includes('<!DOCTYPE')) {
        return res.status(500).json({ 
          message: 'Lỗi kết nối máy chủ. Vui lòng kiểm tra lại API URL.' 
        });
      }
      return res.status(500).json({ 
        message: 'Invalid response from server' 
      });
    }
    
    console.log("Parsed backend response:", data);
    
    if (!response.ok) {
      return res.status(response.status).json({
        message: data.error || data.message || 'Registration failed'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: data.message || 'Registration successful',
      data: data
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Forward error from the backend if available
    if (error.response) {
      return res.status(error.response.status).json({
        message: error.response.data.message || 'Registration failed',
      });
    }

    // Generic error
    return res.status(500).json({ 
      message: error.message || 'Server error. Please try again later.' 
    });
  }
}