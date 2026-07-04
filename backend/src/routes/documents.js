const express = require('express');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

/**
 * Upload document for AI analysis
 * POST /api/documents/upload
 * Body: FormData with file and metadata
 */
router.post('/upload', authenticate, async (req, res) => {
  try {
    // In a real implementation, you would:
    // 1. Save the file to storage (S3, filesystem, etc.)
    // 2. Extract text from the file
    // 3. Store metadata in database
    // For now, return a mock response

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        error: { code: 'NO_FILE', message: 'No file uploaded' }
      });
    }

    const file = req.files.file;
    const allowedExtensions = ['pdf', 'txt', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
    const fileExt = file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(fileExt)) {
      return res.status(400).json({
        error: { code: 'INVALID_FILE', message: `File type .${fileExt} not supported` }
      });
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return res.status(400).json({
        error: { code: 'FILE_TOO_LARGE', message: 'File size exceeds 10MB limit' }
      });
    }

    // Mock file processing - in production, extract actual content
    const fileContent = `Document: ${file.name}\nSize: ${file.size} bytes\nType: ${file.mimetype}\n\nFile uploaded successfully. AI can now analyze this document.`;

    res.json({
      success: true,
      file: {
        name: file.name,
        size: file.size,
        type: file.mimetype,
        uploadedAt: new Date()
      },
      preview: fileContent.substring(0, 500),
      message: 'File uploaded successfully. You can now ask questions about this document.'
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'UPLOAD_ERROR', message: 'Failed to upload document' }
    });
  }
});

/**
 * Get list of user's uploaded documents
 * GET /api/documents/list
 */
router.get('/list', authenticate, async (req, res) => {
  try {
    // In a real implementation, query documents from database
    res.json({
      documents: [
        {
          id: '1',
          name: 'Application Form.pdf',
          uploadedAt: new Date(),
          size: 2048,
          type: 'pdf'
        },
        {
          id: '2',
          name: 'Complaint Details.txt',
          uploadedAt: new Date(),
          size: 1024,
          type: 'text'
        }
      ]
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch documents' }
    });
  }
});

/**
 * Delete uploaded document
 * DELETE /api/documents/:docId
 */
router.delete('/:docId', authenticate, async (req, res) => {
  try {
    // In a real implementation, delete from storage and database
    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'DELETE_ERROR', message: 'Failed to delete document' }
    });
  }
});

module.exports = router;
