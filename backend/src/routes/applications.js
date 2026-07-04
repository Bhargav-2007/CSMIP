const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// Helper function to generate reference number
const generateRefNo = (prefix) => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
  return `${prefix}-${year}-${random}`;
};

// Create application
router.post('/', authenticate, async (req, res) => {
  try {
    const { serviceId, formData } = req.body;

    if (!serviceId) {
      return res.status(400).json({
        error: {
          code: 'MISSING_SERVICE_ID',
          message: 'Service ID is required'
        }
      });
    }

    const service = await req.prisma.service.findUnique({
      where: { id: serviceId },
      include: { formFields: true }
    });

    if (!service) {
      return res.status(404).json({
        error: {
          code: 'SERVICE_NOT_FOUND',
          message: 'Service not found'
        }
      });
    }

    // Validate required fields
    for (const field of service.formFields) {
      if (field.required && !formData[field.name]) {
        return res.status(400).json({
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: `Field '${field.label}' is required`
          }
        });
      }
    }

    const refNo = generateRefNo('APP');
    const slaDueDate = new Date();
    slaDueDate.setDate(slaDueDate.getDate() + service.slaDay);

    const application = await req.prisma.application.create({
      data: {
        refNo,
        userId: req.user.id,
        serviceId,
        formData,
        status: 'DRAFT',
        slaDueDate
      }
    });

    res.status(201).json({
      ref_no: application.refNo,
      service_id: application.serviceId,
      status: application.status,
      form_data: application.formData,
      created_at: application.createdAt
    });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({
      error: {
        code: 'APPLICATION_CREATE_ERROR',
        message: 'Failed to create application'
      }
    });
  }
});

// Get user's applications
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId: req.user.id, deletedAt: null };
    if (status) where.status = status;

    const [applications, total] = await Promise.all([
      req.prisma.application.findMany({
        where,
        include: { service: true },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      req.prisma.application.count({ where })
    ]);

    res.json({
      data: applications.map(a => ({
        ref_no: a.refNo,
        service: a.service.name,
        status: a.status,
        remarks: a.remarks,
        created_at: a.createdAt,
        submitted_at: a.submittedAt
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      error: {
        code: 'APPLICATIONS_FETCH_ERROR',
        message: 'Failed to fetch applications'
      }
    });
  }
});

// Get application by reference number
router.get('/:refNo', authenticate, async (req, res) => {
  try {
    const { refNo } = req.params;

    const application = await req.prisma.application.findUnique({
      where: { refNo },
      include: { service: true }
    });

    if (!application || application.deletedAt) {
      return res.status(404).json({
        error: {
          code: 'APPLICATION_NOT_FOUND',
          message: 'Application not found'
        }
      });
    }

    if (application.userId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'OFFICER') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this application'
        }
      });
    }

    res.json({
      ref_no: application.refNo,
      service_id: application.serviceId,
      service_name: application.service.name,
      status: application.status,
      form_data: application.formData,
      remarks: application.remarks,
      documents: application.documents,
      created_at: application.createdAt,
      submitted_at: application.submittedAt
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      error: {
        code: 'APPLICATION_FETCH_ERROR',
        message: 'Failed to fetch application'
      }
    });
  }
});

// Update application (draft only)
router.put('/:refNo', authenticate, async (req, res) => {
  try {
    const { refNo } = req.params;
    const { formData } = req.body;

    const application = await req.prisma.application.findUnique({
      where: { refNo }
    });

    if (!application) {
      return res.status(404).json({
        error: {
          code: 'APPLICATION_NOT_FOUND',
          message: 'Application not found'
        }
      });
    }

    if (application.userId !== req.user.id) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this application'
        }
      });
    }

    if (application.status !== 'DRAFT') {
      return res.status(400).json({
        error: {
          code: 'CANNOT_UPDATE',
          message: 'Can only update draft applications'
        }
      });
    }

    const updated = await req.prisma.application.update({
      where: { refNo },
      data: { formData, updatedAt: new Date() }
    });

    res.json({
      ref_no: updated.refNo,
      status: updated.status,
      updated_at: updated.updatedAt
    });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({
      error: {
        code: 'APPLICATION_UPDATE_ERROR',
        message: 'Failed to update application'
      }
    });
  }
});

// Submit application
router.post('/:refNo/submit', authenticate, async (req, res) => {
  try {
    const { refNo } = req.params;

    const application = await req.prisma.application.findUnique({
      where: { refNo }
    });

    if (!application) {
      return res.status(404).json({
        error: {
          code: 'APPLICATION_NOT_FOUND',
          message: 'Application not found'
        }
      });
    }

    if (application.userId !== req.user.id) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to submit this application'
        }
      });
    }

    if (application.status !== 'DRAFT') {
      return res.status(400).json({
        error: {
          code: 'CANNOT_SUBMIT',
          message: 'Can only submit draft applications'
        }
      });
    }

    const updated = await req.prisma.application.update({
      where: { refNo },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date()
      }
    });

    // Create status history
    await req.prisma.statusHistory.create({
      data: {
        applicationId: updated.id,
        previousStatus: 'DRAFT',
        newStatus: 'SUBMITTED',
        remarks: 'Application submitted by citizen'
      }
    });

    res.json({
      ref_no: updated.refNo,
      status: updated.status,
      submitted_at: updated.submittedAt
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({
      error: {
        code: 'APPLICATION_SUBMIT_ERROR',
        message: 'Failed to submit application'
      }
    });
  }
});

// Delete application (draft only)
router.delete('/:refNo', authenticate, async (req, res) => {
  try {
    const { refNo } = req.params;

    const application = await req.prisma.application.findUnique({
      where: { refNo }
    });

    if (!application) {
      return res.status(404).json({
        error: {
          code: 'APPLICATION_NOT_FOUND',
          message: 'Application not found'
        }
      });
    }

    if (application.userId !== req.user.id) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this application'
        }
      });
    }

    if (application.status !== 'DRAFT') {
      return res.status(400).json({
        error: {
          code: 'CANNOT_DELETE',
          message: 'Can only delete draft applications'
        }
      });
    }

    await req.prisma.application.update({
      where: { refNo },
      data: { deletedAt: new Date() }
    });

    res.json({
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({
      error: {
        code: 'APPLICATION_DELETE_ERROR',
        message: 'Failed to delete application'
      }
    });
  }
});

module.exports = router;
