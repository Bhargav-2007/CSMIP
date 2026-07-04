const express = require('express');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { generateOTP, sendOTP, isValidPhone, formatPhone } = require('../utils/otp');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Store OTP attempts in memory (in production, use Redis)
const otpAttempts = {};
const otpStorage = {};

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !isValidPhone(phone)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_PHONE',
          message: 'Invalid phone number. Must be 10 digits.'
        }
      });
    }

    const formattedPhone = formatPhone(phone);

    // Check attempt count
    const attempts = otpAttempts[formattedPhone] || 0;
    if (attempts >= parseInt(process.env.OTP_MAX_ATTEMPTS || 3)) {
      return res.status(429).json({
        error: {
          code: 'MAX_ATTEMPTS_EXCEEDED',
          message: 'Too many OTP requests. Please try again later.'
        }
      });
    }

    const otp = generateOTP();
    const expiryTime = Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES || 5) * 60 * 1000);

    // Store OTP
    otpStorage[formattedPhone] = {
      otp,
      expiryTime,
      attempts: 0
    };

    otpAttempts[formattedPhone] = attempts + 1;

    // Send OTP (mock for now)
    await sendOTP(formattedPhone, otp);

    res.json({
      message: 'OTP sent successfully',
      phone: formattedPhone,
      dev_otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      error: {
        code: 'OTP_SEND_ERROR',
        message: 'Failed to send OTP'
      }
    });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !isValidPhone(phone)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_PHONE',
          message: 'Invalid phone number'
        }
      });
    }

    if (!otp || otp.length !== parseInt(process.env.OTP_LENGTH || 6)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_OTP',
          message: 'Invalid OTP format'
        }
      });
    }

    const formattedPhone = formatPhone(phone);
    const storedData = otpStorage[formattedPhone];

    if (!storedData) {
      return res.status(400).json({
        error: {
          code: 'OTP_NOT_FOUND',
          message: 'OTP not found. Please request a new one.'
        }
      });
    }

    if (storedData.expiryTime < Date.now()) {
      delete otpStorage[formattedPhone];
      return res.status(400).json({
        error: {
          code: 'OTP_EXPIRED',
          message: 'OTP has expired. Please request a new one.'
        }
      });
    }

    if (storedData.otp !== otp) {
      storedData.attempts += 1;
      if (storedData.attempts >= 3) {
        delete otpStorage[formattedPhone];
        return res.status(429).json({
          error: {
            code: 'MAX_OTP_ATTEMPTS',
            message: 'Maximum OTP attempts exceeded'
          }
        });
      }
      return res.status(400).json({
        error: {
          code: 'INCORRECT_OTP',
          message: 'Incorrect OTP'
        }
      });
    }

    // Find or create user
    let user = await req.prisma.user.findUnique({
      where: { phone: formattedPhone }
    });

    if (!user) {
      user = await req.prisma.user.create({
        data: {
          phone: formattedPhone,
          role: 'CITIZEN'
        }
      });
    }

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Clear OTP storage
    delete otpStorage[formattedPhone];
    delete otpAttempts[formattedPhone];

    res.json({
      message: 'OTP verified successfully',
      token,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        created_at: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      error: {
        code: 'OTP_VERIFY_ERROR',
        message: 'Failed to verify OTP'
      }
    });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id }
    });

    res.json({
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      error: {
        code: 'USER_FETCH_ERROR',
        message: 'Failed to fetch user'
      }
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required'
        }
      });
    }

    const payload = verifyRefreshToken(refresh_token);
    if (!payload) {
      return res.status(401).json({
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token'
        }
      });
    }

    const user = await req.prisma.user.findUnique({
      where: { id: payload.id }
    });

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({
      token: newToken,
      refresh_token: newRefreshToken
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({
      error: {
        code: 'REFRESH_ERROR',
        message: 'Failed to refresh token'
      }
    });
  }
});

// Logout (optional - mainly for frontend to clear tokens)
router.post('/logout', authenticate, (req, res) => {
  res.json({
    message: 'Logged out successfully'
  });
});

module.exports = router;
