const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

const generateRefNo = (prefix) => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
  return `${prefix}-${year}-${random}`;
};

// Create complaint
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, category, attachments } = req.body;

    if (!title || title.length < 3) {
      return res.status(400).json({
        error: { code: 'INVALID_TITLE', message: 'Title must be at least 3 characters' }
      });
    }

    if (!description || description.length < 5) {
      return res.status(400).json({
        error: { code: 'INVALID_DESCRIPTION', message: 'Description must be at least 5 characters' }
      });
    }

    const complaint = await req.prisma.complaint.create({
      data: {
        refNo: generateRefNo('CMP'),
        userId: req.user.id,
        title,
        description,
        category,
        attachments: attachments || [],
        status: 'OPEN'
      }
    });

    res.status(201).json({
      ref_no: complaint.refNo,
      status: complaint.status,
      created_at: complaint.createdAt
    });
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({
      error: { code: 'COMPLAINT_CREATE_ERROR', message: 'Failed to create complaint' }
    });
  }
});

// Get user's complaints
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId: req.user.id, deletedAt: null };
    if (status) where.status = status;

    const [complaints, total] = await Promise.all([
      req.prisma.complaint.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
      req.prisma.complaint.count({ where })
    ]);

    res.json({
      data: complaints.map(c => ({
        ref_no: c.refNo,
        title: c.title,
        status: c.status,
        priority: c.priority,
        created_at: c.createdAt
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
      error: { code: 'COMPLAINTS_FETCH_ERROR', message: 'Failed to fetch complaints' }
    });
  }
});

// Get complaint details
router.get('/:refNo', authenticate, async (req, res) => {
  try {
    const complaint = await req.prisma.complaint.findUnique({
      where: { refNo: req.params.refNo }
    });

    if (!complaint || complaint.deletedAt) {
      return res.status(404).json({
        error: { code: 'COMPLAINT_NOT_FOUND', message: 'Complaint not found' }
      });
    }

    if (complaint.userId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'OFFICER') {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }

    res.json({
      ref_no: complaint.refNo,
      title: complaint.title,
      description: complaint.description,
      status: complaint.status,
      priority: complaint.priority,
      remarks: complaint.remarks,
      attachments: complaint.attachments,
      created_at: complaint.createdAt
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'COMPLAINT_FETCH_ERROR', message: 'Failed to fetch complaint' }
    });
  }
});

// Update complaint (draft or by admin)
router.put('/:refNo', authenticate, async (req, res) => {
  try {
    const complaint = await req.prisma.complaint.findUnique({
      where: { refNo: req.params.refNo }
    });

    if (!complaint) {
      return res.status(404).json({
        error: { code: 'COMPLAINT_NOT_FOUND', message: 'Complaint not found' }
      });
    }

    if (complaint.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }

    const { title, description, category, status, priority, remarks, assignedTo } = req.body;

    const updated = await req.prisma.complaint.update({
      where: { refNo: req.params.refNo },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(category && { category }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(remarks && { remarks }),
        ...(assignedTo !== undefined && { assignedTo }),
        updatedAt: new Date()
      }
    });

    res.json({
      ref_no: updated.refNo,
      status: updated.status,
      updated_at: updated.updatedAt
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'COMPLAINT_UPDATE_ERROR', message: 'Failed to update complaint' }
    });
  }
});

// Delete complaint
router.delete('/:refNo', authenticate, async (req, res) => {
  try {
    const complaint = await req.prisma.complaint.findUnique({
      where: { refNo: req.params.refNo }
    });

    if (!complaint) {
      return res.status(404).json({
        error: { code: 'COMPLAINT_NOT_FOUND', message: 'Complaint not found' }
      });
    }

    if (complaint.userId !== req.user.id) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }

    await req.prisma.complaint.update({
      where: { refNo: req.params.refNo },
      data: { deletedAt: new Date() }
    });

    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    res.status(500).json({
      error: { code: 'COMPLAINT_DELETE_ERROR', message: 'Failed to delete complaint' }
    });
  }
});

module.exports = router;
