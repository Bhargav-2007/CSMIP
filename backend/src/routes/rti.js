const express = require('express');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

const generateRefNo = (prefix) => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
  return `${prefix}-${year}-${random}`;
};

router.post('/', authenticate, async (req, res) => {
  try {
    const { subject, description, category } = req.body;

    if (!subject || !description) {
      return res.status(400).json({
        error: { code: 'MISSING_FIELDS', message: 'Subject and description are required' }
      });
    }

    const rti = await req.prisma.rTIRequest.create({
      data: {
        refNo: generateRefNo('RTI'),
        userId: req.user.id,
        subject,
        description,
        category,
        status: 'PENDING'
      }
    });

    res.status(201).json({
      ref_no: rti.refNo,
      status: rti.status,
      created_at: rti.createdAt
    });
  } catch (error) {
    console.error('Error creating RTI:', error);
    res.status(500).json({
      error: { code: 'RTI_CREATE_ERROR', message: 'Failed to create RTI request' }
    });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId: req.user.id, deletedAt: null };
    if (status) where.status = status;

    const [rtis, total] = await Promise.all([
      req.prisma.rTIRequest.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
      req.prisma.rTIRequest.count({ where })
    ]);

    res.json({
      data: rtis.map(r => ({
        ref_no: r.refNo,
        subject: r.subject,
        status: r.status,
        created_at: r.createdAt
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
      error: { code: 'RTI_FETCH_ERROR', message: 'Failed to fetch RTI requests' }
    });
  }
});

router.get('/:refNo', authenticate, async (req, res) => {
  try {
    const rti = await req.prisma.rTIRequest.findUnique({
      where: { refNo: req.params.refNo }
    });

    if (!rti || rti.deletedAt) {
      return res.status(404).json({
        error: { code: 'RTI_NOT_FOUND', message: 'RTI request not found' }
      });
    }

    if (rti.userId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'OFFICER') {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }

    res.json({
      ref_no: rti.refNo,
      subject: rti.subject,
      description: rti.description,
      status: rti.status,
      response_text: rti.responseText,
      response_documents: rti.responseDocuments,
      created_at: rti.createdAt,
      responded_at: rti.respondedAt
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'RTI_FETCH_ERROR', message: 'Failed to fetch RTI request' }
    });
  }
});

module.exports = router;
