const express = require('express');
const router = express.Router();

// List all services
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { deletedAt: null, isActive: true };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [services, total] = await Promise.all([
      req.prisma.service.findMany({
        where,
        include: { formFields: { orderBy: { order: 'asc' } } },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      req.prisma.service.count({ where })
    ]);

    res.json({
      data: services.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description,
        category: s.category,
        fee: parseFloat(s.fee),
        sla_days: s.slaDay,
        requirements: s.requirements,
        fields: s.formFields.map(f => ({
          name: f.name,
          label: f.label,
          type: f.type,
          required: f.required,
          placeholder: f.placeholder,
          options: f.options,
          validation: f.validation
        }))
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      error: {
        code: 'SERVICES_FETCH_ERROR',
        message: 'Failed to fetch services'
      }
    });
  }
});

// Get service by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const service = await req.prisma.service.findUnique({
      where: { slug },
      include: { formFields: { orderBy: { order: 'asc' } } }
    });

    if (!service || service.deletedAt) {
      return res.status(404).json({
        error: {
          code: 'SERVICE_NOT_FOUND',
          message: 'Service not found'
        }
      });
    }

    res.json({
      id: service.id,
      name: service.name,
      slug: service.slug,
      description: service.description,
      category: service.category,
      fee: parseFloat(service.fee),
      sla_days: service.slaDay,
      requirements: service.requirements,
      fields: service.formFields.map(f => ({
        name: f.name,
        label: f.label,
        type: f.type,
        required: f.required,
        placeholder: f.placeholder,
        options: f.options,
        validation: f.validation
      }))
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      error: {
        code: 'SERVICE_FETCH_ERROR',
        message: 'Failed to fetch service'
      }
    });
  }
});

// Get alerts (mock)
router.get('/alerts', async (req, res) => {
  res.json({
    alerts: [
      {
        id: '1',
        type: 'info',
        message: 'Apply for Birth Certificate online - Fast track available',
        created_at: new Date().toISOString()
      }
    ]
  });
});

// Get schemes (mock)
router.get('/schemes', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [schemes, total] = await Promise.all([
      req.prisma.scheme.findMany({
        where: { deletedAt: null, isActive: true },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      req.prisma.scheme.count({ where: { deletedAt: null, isActive: true } })
    ]);

    res.json({
      data: schemes.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description,
        category: s.category,
        eligibility: s.eligibility,
        benefits: s.benefits,
        application_url: s.applicationUrl,
        contact_info: s.contactInfo
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching schemes:', error);
    res.status(500).json({
      error: {
        code: 'SCHEMES_FETCH_ERROR',
        message: 'Failed to fetch schemes'
      }
    });
  }
});

module.exports = router;
