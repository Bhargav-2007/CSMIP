const express = require('express');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const [appCount, complaintCount, rtiCount, paymentSum] = await Promise.all([
      req.prisma.application.count({ where: { userId, deletedAt: null } }),
      req.prisma.complaint.count({ where: { userId, deletedAt: null } }),
      req.prisma.rTIRequest.count({ where: { userId, deletedAt: null } }),
      req.prisma.payment.aggregate({
        where: { userId, status: 'SUCCESS' },
        _sum: { amount: true }
      })
    ]);

    res.json({
      stats: {
        applications: appCount,
        complaints: complaintCount,
        rti_requests: rtiCount,
        total_payments: parseFloat(paymentSum._sum.amount || 0)
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'STATS_ERROR', message: 'Failed to fetch statistics' }
    });
  }
});

// Get recent items
router.get('/recent', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const [applications, complaints, rtis, payments] = await Promise.all([
      req.prisma.application.findMany({
        where: { userId, deletedAt: null },
        include: { service: true },
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      req.prisma.complaint.findMany({
        where: { userId, deletedAt: null },
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      req.prisma.rTIRequest.findMany({
        where: { userId, deletedAt: null },
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      req.prisma.payment.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    res.json({
      recent: {
        applications: applications.map(a => ({
          ref_no: a.refNo,
          service: a.service.name,
          status: a.status,
          created_at: a.createdAt
        })),
        complaints: complaints.map(c => ({
          ref_no: c.refNo,
          title: c.title,
          status: c.status,
          created_at: c.createdAt
        })),
        rti_requests: rtis.map(r => ({
          ref_no: r.refNo,
          subject: r.subject,
          status: r.status,
          created_at: r.createdAt
        })),
        payments: payments.map(p => ({
          id: p.id,
          amount: parseFloat(p.amount),
          status: p.status,
          created_at: p.createdAt
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'RECENT_ERROR', message: 'Failed to fetch recent items' }
    });
  }
});

module.exports = router;
