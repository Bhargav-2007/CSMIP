const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Create sample services
    const services = [
      {
        name: 'Birth Certificate',
        slug: 'birth-certificate',
        description: 'Apply for an official birth certificate from vital records office',
        category: 'vital_records',
        fee: '100',
        slaDay: 5,
        requirements: ['Birth proof', 'Parents ID proof', 'Address proof'],
        isActive: true,
        formFields: {
          create: [
            { name: 'full_name', label: 'Full Name', type: 'TEXT', required: true, order: 1 },
            { name: 'dob', label: 'Date of Birth', type: 'DATE', required: true, order: 2 },
            { name: 'mother_name', label: 'Mother Name', type: 'TEXT', required: true, order: 3 },
            { name: 'father_name', label: 'Father Name', type: 'TEXT', required: false, order: 4 }
          ]
        }
      },
      {
        name: 'Death Certificate',
        slug: 'death-certificate',
        description: 'Apply for an official death certificate',
        category: 'vital_records',
        fee: '50',
        slaDay: 3,
        requirements: ['Medical report', 'ID proof of informant'],
        isActive: true,
        formFields: {
          create: [
            { name: 'deceased_name', label: 'Name of Deceased', type: 'TEXT', required: true, order: 1 },
            { name: 'dod', label: 'Date of Death', type: 'DATE', required: true, order: 2 },
            { name: 'informant_name', label: 'Name of Informant', type: 'TEXT', required: true, order: 3 }
          ]
        }
      },
      {
        name: 'Property Tax Certificate',
        slug: 'property-tax',
        description: 'Get your property tax certificate and payment status',
        category: 'property',
        fee: '200',
        slaDay: 7,
        requirements: ['Property deed', 'ID proof', 'Address proof'],
        isActive: true,
        formFields: {
          create: [
            { name: 'property_address', label: 'Property Address', type: 'TEXTAREA', required: true, order: 1 },
            { name: 'property_type', label: 'Property Type', type: 'SELECT', required: true, options: ['Residential', 'Commercial', 'Industrial'], order: 2 }
          ]
        }
      }
    ];

    for (const service of services) {
      const existing = await prisma.service.findUnique({ where: { slug: service.slug } });
      if (!existing) {
        await prisma.service.create({ data: service });
        console.log(`✓ Created service: ${service.name}`);
      }
    }

    // Create sample schemes
    const schemes = [
      {
        name: 'Jan Dhan Yojana',
        slug: 'jan-dhan-yojana',
        description: 'Financial inclusion of all households in the country',
        category: 'banking',
        eligibility: 'All Indian citizens above 18 years',
        benefits: 'Free bank account, Debit card, Insurance coverage',
        applicationUrl: 'https://jandhanyojana.gov.in',
        contactInfo: '1800-180-1111',
        isActive: true
      },
      {
        name: 'Pradhan Mantri Awas Yojana',
        slug: 'pmawy',
        description: 'Provide housing to all eligible families',
        category: 'housing',
        eligibility: 'BPL families, economically weaker sections',
        benefits: 'Financial assistance up to Rs. 2 Lakhs',
        applicationUrl: 'https://pmaymis.gov.in',
        contactInfo: 'contact@pmaymis.gov.in',
        isActive: true
      }
    ];

    for (const scheme of schemes) {
      const existing = await prisma.scheme.findUnique({ where: { slug: scheme.slug } });
      if (!existing) {
        await prisma.scheme.create({ data: scheme });
        console.log(`✓ Created scheme: ${scheme.name}`);
      }
    }

    console.log('✓ Database seeding completed!\n');
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
