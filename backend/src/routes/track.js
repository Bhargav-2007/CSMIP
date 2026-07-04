const express = require('express');
const router = express.Router();

router.get('/:refNo', async (req, res) => {
  try {
    const refNo = req.params.refNo;
    const application = await req.prisma.application.findUnique({
      where: { refNo },
      include: { service: true }
    });

    if (application) {
      return res.json({
        kind: 'application',
        data: {
          ref_no: application.refNo,
          service_name: application.service?.name || 'Service',
          status: application.status,
          created_at: application.createdAt,
          timeline: [
            { status: application.status, at: application.createdAt, note: 'Application submitted' }
          ]
        }
      });
    }

    const complaint = await req.prisma.complaint.findUnique({ where: { refNo } });
    if (complaint) {
      return res.json({
        kind: 'complaint',
        data: {
          ref_no: complaint.refNo,
          title: complaint.title,
          status: complaint.status,
          created_at: complaint.createdAt,
          timeline: [
            { status: complaint.status, at: complaint.createdAt, note: 'Complaint received' }
          ]
        }
      });
    }

    const rti = await req.prisma.rTIRequest.findUnique({ where: { refNo } });
    if (rti) {
      return res.json({
        kind: 'rti',
        data: {
          ref_no: rti.refNo,
          subject: rti.subject,
          status: rti.status,
          created_at: rti.createdAt,
          timeline: [
            { status: rti.status, at: rti.createdAt, note: 'RTI request received' }
          ]
        }
      });
    }

    return res.status(404).json({
      error: { code: 'TRACK_NOT_FOUND', message: 'No record found for this reference number' }
    });
  } catch (error) {
    res.status(500).json({ error: { code: 'TRACK_ERROR', message: 'Unable to track record' } });
  }
});

module.exports = router;
