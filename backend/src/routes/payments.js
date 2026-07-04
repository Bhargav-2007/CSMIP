const express = require('express');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// Get payment history
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total] = await Promise.all([
      req.prisma.payment.findMany({
        where: { userId: req.user.id },
        include: { application: { include: { service: true } } },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      req.prisma.payment.count({ where: { userId: req.user.id } })
    ]);

    res.json({
      data: payments.map(p => ({
        id: p.id,
        amount: parseFloat(p.amount),
        status: p.status,
        service: p.application?.service?.name,
        transaction_id: p.transactionId,
        created_at: p.createdAt
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'PAYMENTS_FETCH_ERROR', message: 'Failed to fetch payments' }
    });
  }
});

// Initiate payment
router.post('/initiate', authenticate, async (req, res) => {
  try {
    const { applicationId } = req.body;

    if (!applicationId) {
      return res.status(400).json({
        error: { code: 'MISSING_APP_ID', message: 'Application ID is required' }
      });
    }

    const application = await req.prisma.application.findUnique({
      where: { id: applicationId },
      include: { service: true }
    });

    if (!application) {
      return res.status(404).json({
        error: { code: 'APPLICATION_NOT_FOUND', message: 'Application not found' }
      });
    }

    if (application.userId !== req.user.id) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }

    const existingPayment = await req.prisma.payment.findUnique({
      where: { applicationId }
    });

    if (existingPayment && existingPayment.status === 'SUCCESS') {
      return res.status(400).json({
        error: { code: 'ALREADY_PAID', message: 'This application has already been paid' }
      });
    }

    const payment = await req.prisma.payment.create({
      data: {
        userId: req.user.id,
        applicationId,
        serviceId: application.serviceId,
        amount: application.service.fee,
        status: 'PENDING',
        paymentGateway: process.env.PAYMENT_GATEWAY || 'mock'
      }
    });

    res.status(201).json({
      payment_id: payment.id,
      amount: parseFloat(payment.amount),
      status: payment.status,
      created_at: payment.createdAt
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'PAYMENT_CREATE_ERROR', message: 'Failed to create payment' }
    });
  }
});

// Mock payment endpoint (for testing)
router.post('/mock', authenticate, async (req, res) => {
  try {
    const { paymentId, status, serviceSlug, billNumber, amount, payerName } = req.body;

    if (paymentId) {
      const payment = await req.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: status || 'SUCCESS',
          transactionId: `MOCK-${Date.now()}`,
          gatewayResponse: { mock: true }
        }
      });

      if (payment.applicationId && payment.status === 'SUCCESS') {
        await req.prisma.application.update({
          where: { id: payment.applicationId },
          data: { paymentStatus: 'SUCCESS' }
        });
      }

      return res.json({
        payment_id: payment.id,
        status: payment.status,
        transaction_id: payment.transactionId
      });
    }

    let serviceId = null;
    if (serviceSlug) {
      const service = await req.prisma.service.findUnique({ where: { slug: serviceSlug } });
      serviceId = service?.id || null;
    }

    const payment = await req.prisma.payment.create({
      data: {
        userId: req.user.id,
        serviceId,
        amount: Number(amount || 0),
        status: status || 'SUCCESS',
        paymentGateway: 'mock',
        transactionId: `MOCK-${Date.now()}`,
        gatewayResponse: { mock: true, billNumber, payerName }
      }
    });

    res.json({
      payment_id: payment.id,
      status: payment.status,
      transaction_id: payment.transactionId,
      amount: parseFloat(payment.amount)
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'PAYMENT_UPDATE_ERROR', message: 'Failed to update payment' }
    });
  }
});

// Webhook from payment gateway
router.post('/webhook', async (req, res) => {
  try {
    const { paymentId, status, transactionId } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        error: { code: 'MISSING_PAYMENT_ID', message: 'Payment ID is required' }
      });
    }

    const payment = await req.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        transactionId,
        gatewayResponse: req.body
      }
    });

    res.json({ received: true });
  } catch (error) {
    res.status(500).json({
      error: { code: 'WEBHOOK_ERROR', message: 'Webhook processing failed' }
    });
  }
});

module.exports = router;
