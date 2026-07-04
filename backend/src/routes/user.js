const express = require('express');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    res.json({
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.createdAt,
        updated_at: user.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'PROFILE_FETCH_ERROR', message: 'Failed to fetch profile' }
    });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await req.prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        updatedAt: new Date()
      }
    });

    res.json({
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role,
        updated_at: user.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'PROFILE_UPDATE_ERROR', message: 'Failed to update profile' }
    });
  }
});

module.exports = router;
