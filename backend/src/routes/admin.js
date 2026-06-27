const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { exportToExcel, formatExportData } = require('../utils/export');
const router = express.Router();

// Admin dashboard stats
router.get('/stats', authenticate, authorize(['ADMIN', 'OFFICER']), async (req, res) => {
  try {
    const [userCount, appCount, complaintCount, rtiCount, paymentSum, openComplaints] = await Promise.all([
      req.prisma.user.count({ where: { deletedAt: null } }),
      req.prisma.application.count({ where: { deletedAt: null } }),
      req.prisma.complaint.count({ where: { deletedAt: null } }),
      req.prisma.rTIRequest.count({ where: { deletedAt: null } }),
      req.prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true }
      }),
      req.prisma.complaint.count({ where: { status: 'OPEN', deletedAt: null } })
    ]);

    res.json({
      stats: {
        total_users: userCount,
        total_applications: appCount,
        total_complaints: complaintCount,
        open_complaints: openComplaints,
        total_rti: rtiCount,
        total_revenue: parseFloat(paymentSum._sum.amount || 0)
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'STATS_ERROR', message: 'Failed to fetch statistics' }
    });
  }
});

// Get all applications (admin)
router.get('/applications', authenticate, authorize(['ADMIN', 'OFFICER']), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { deletedAt: null };
    if (status) where.status = status;

    const [apps, total] = await Promise.all([
      req.prisma.application.findMany({
        where,
        include: { user: true, service: true },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      req.prisma.application.count({ where })
    ]);

    res.json({
      data: apps.map(a => ({
        ref_no: a.refNo,
        user_phone: a.user.phone,
        service: a.service.name,
        status: a.status,
        created_at: a.createdAt
      })),
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'APPLICATIONS_ERROR', message: 'Failed to fetch applications' }
    });
  }
});

// Update application status (admin)
router.put('/applications/:refNo', authenticate, authorize(['ADMIN', 'OFFICER']), async (req, res) => {
  try {
    const { status, remarks } = req.body;

    const app = await req.prisma.application.update({
      where: { refNo: req.params.refNo },
      data: { status, remarks, updatedAt: new Date() }
    });

    await req.prisma.statusHistory.create({
      data: {
        applicationId: app.id,
        previousStatus: app.status,
        newStatus: status,
        remarks,
        changedBy: req.user.id
      }
    });

    res.json({ ref_no: app.refNo, status: app.status });
  } catch (error) {
    res.status(500).json({
      error: { code: 'UPDATE_ERROR', message: 'Failed to update application' }
    });
  }
});

// Get all complaints (admin)
router.get('/complaints', authenticate, authorize(['ADMIN', 'OFFICER']), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { deletedAt: null };
    if (status) where.status = status;

    const [complaints, total] = await Promise.all([
      req.prisma.complaint.findMany({
        where,
        include: { user: true },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      req.prisma.complaint.count({ where })
    ]);

    res.json({
      data: complaints.map(c => ({
        ref_no: c.refNo,
        user_phone: c.user.phone,
        title: c.title,
        status: c.status,
        priority: c.priority,
        created_at: c.createdAt
      })),
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'COMPLAINTS_ERROR', message: 'Failed to fetch complaints' }
    });
  }
});

// Assign complaint to officer
router.put('/complaints/:refNo/assign', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { assignedTo } = req.body;

    const complaint = await req.prisma.complaint.update({
      where: { refNo: req.params.refNo },
      data: { assignedTo, status: 'ASSIGNED', updatedAt: new Date() }
    });

    res.json({ ref_no: complaint.refNo, status: complaint.status });
  } catch (error) {
    res.status(500).json({
      error: { code: 'ASSIGN_ERROR', message: 'Failed to assign complaint' }
    });
  }
});

// Get all RTI (admin)
router.get('/rti', authenticate, authorize(['ADMIN', 'OFFICER']), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { deletedAt: null };
    if (status) where.status = status;

    const [rtis, total] = await Promise.all([
      req.prisma.rTIRequest.findMany({
        where,
        include: { user: true },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      req.prisma.rTIRequest.count({ where })
    ]);

    res.json({
      data: rtis.map(r => ({
        ref_no: r.refNo,
        user_phone: r.user.phone,
        subject: r.subject,
        status: r.status,
        created_at: r.createdAt
      })),
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'RTI_ERROR', message: 'Failed to fetch RTI requests' }
    });
  }
});

// Respond to RTI (admin)
router.put('/rti/:refNo/respond', authenticate, authorize(['ADMIN', 'OFFICER']), async (req, res) => {
  try {
    const { responseText, responseDocuments } = req.body;

    const rti = await req.prisma.rTIRequest.update({
      where: { refNo: req.params.refNo },
      data: {
        status: 'RESPONDED',
        responseText,
        responseDocuments: responseDocuments || [],
        respondedAt: new Date(),
        updatedAt: new Date()
      }
    });

    res.json({ ref_no: rti.refNo, status: rti.status });
  } catch (error) {
    res.status(500).json({
      error: { code: 'RESPOND_ERROR', message: 'Failed to respond to RTI' }
    });
  }
});

// Export data (JSON or Excel format)
router.get('/export/:kind', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { kind } = req.params;
    const { format = 'json' } = req.query; // default: json, or: xlsx

    let data = [];
    let sheetName = 'Data';

    if (kind === 'applications') {
      data = await req.prisma.application.findMany({
        where: { deletedAt: null },
        include: { user: true, service: true }
      });
      sheetName = 'Applications';
    } else if (kind === 'complaints') {
      data = await req.prisma.complaint.findMany({
        where: { deletedAt: null },
        include: { user: true }
      });
      sheetName = 'Complaints';
    } else if (kind === 'payments') {
      data = await req.prisma.payment.findMany({
        include: { user: true, application: { include: { service: true } } }
      });
      sheetName = 'Payments';
    } else if (kind === 'users') {
      data = await req.prisma.user.findMany({
        where: { deletedAt: null }
      });
      sheetName = 'Users';
    } else if (kind === 'rti') {
      data = await req.prisma.rTIRequest.findMany({
        where: { deletedAt: null },
        include: { user: true }
      });
      sheetName = 'RTI Requests';
    } else if (kind === 'all') {
      // Export all data in multiple sheets
      const [apps, comps, pays, users, rtis] = await Promise.all([
        req.prisma.application.findMany({
          where: { deletedAt: null },
          include: { user: true, service: true }
        }),
        req.prisma.complaint.findMany({
          where: { deletedAt: null },
          include: { user: true }
        }),
        req.prisma.payment.findMany({
          include: { user: true, application: { include: { service: true } } }
        }),
        req.prisma.user.findMany({
          where: { deletedAt: null }
        }),
        req.prisma.rTIRequest.findMany({
          where: { deletedAt: null },
          include: { user: true }
        })
      ]);

      if (format === 'xlsx') {
        const { exportToExcelMultiSheet } = require('../utils/export');
        const sheetsData = {
          'Applications': formatExportData('applications', apps),
          'Complaints': formatExportData('complaints', comps),
          'Payments': formatExportData('payments', pays),
          'Users': formatExportData('users', users),
          'RTI Requests': formatExportData('rti', rtis)
        };

        const buffer = exportToExcelMultiSheet(sheetsData);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="csmip-all-data-${Date.now()}.xlsx"`);
        res.send(buffer);
        return;
      }

      res.json({
        data: {
          applications: formatExportData('applications', apps),
          complaints: formatExportData('complaints', comps),
          payments: formatExportData('payments', pays),
          users: formatExportData('users', users),
          rti_requests: formatExportData('rti', rtis)
        },
        export_format: 'json',
        exported_at: new Date()
      });
      return;
    }

    // Format data for better readability
    const formattedData = formatExportData(kind, data);

    if (format === 'xlsx') {
      const buffer = exportToExcel(formattedData, sheetName);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="csmip-${kind}-${Date.now()}.xlsx"`);
      res.send(buffer);
    } else {
      res.json({
        data: formattedData,
        export_format: 'json',
        total: formattedData.length,
        exported_at: new Date()
      });
    }
  } catch (error) {
    res.status(500).json({
      error: { code: 'EXPORT_ERROR', message: 'Failed to export data' }
    });
  }
});

module.exports = router;
