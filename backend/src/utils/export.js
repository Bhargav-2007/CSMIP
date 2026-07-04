const XLSX = require('xlsx');

/**
 * Export data to Excel format
 * @param {Array} data - Array of objects to export
 * @param {String} sheetName - Name of the Excel sheet
 * @returns {Buffer} - Excel file buffer
 */
const exportToExcel = (data, sheetName = 'Data') => {
  if (!data || data.length === 0) {
    data = [{ 'message': 'No data to export' }];
  }

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Auto-adjust column widths
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.min(20, Math.max(10, String(data[0][key] || '').length + 2))
  }));
  ws['!cols'] = colWidths;

  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
};

/**
 * Export multiple sheets to Excel
 * @param {Object} sheetsData - Object with sheet names as keys and data arrays as values
 * @returns {Buffer} - Excel file buffer
 */
const exportToExcelMultiSheet = (sheetsData) => {
  const wb = XLSX.utils.book_new();

  Object.entries(sheetsData).forEach(([sheetName, data]) => {
    const processedData = Array.isArray(data) && data.length > 0 
      ? data 
      : [{ 'message': 'No data to export' }];
    
    const ws = XLSX.utils.json_to_sheet(processedData);
    
    // Auto-adjust column widths
    if (processedData.length > 0) {
      const colWidths = Object.keys(processedData[0]).map(key => ({
        wch: Math.min(20, Math.max(10, String(processedData[0][key] || '').length + 2))
      }));
      ws['!cols'] = colWidths;
    }
    
    XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)); // Sheet name limit is 31 chars
  });

  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
};

/**
 * Flatten nested objects for Excel export
 * @param {Array} data - Array of objects (potentially nested)
 * @returns {Array} - Flattened array of objects
 */
const flattenForExcel = (data) => {
  return data.map(item => {
    const flat = {};
    
    Object.keys(item).forEach(key => {
      const value = item[key];
      
      if (value === null || value === undefined) {
        flat[key] = '';
      } else if (typeof value === 'object') {
        if (Array.isArray(value)) {
          flat[key] = value.join(', ');
        } else if (value.id) {
          // For relations, just include the ID
          flat[key] = value.id;
        } else {
          flat[key] = JSON.stringify(value);
        }
      } else {
        flat[key] = value;
      }
    });
    
    return flat;
  });
};

/**
 * Format export data with proper column names
 * @param {String} kind - Type of data (applications, complaints, payments)
 * @param {Array} data - Raw data from database
 * @returns {Array} - Formatted data ready for export
 */
const formatExportData = (kind, data) => {
  switch (kind) {
    case 'applications':
      return data.map(app => ({
        'Reference No': app.refNo,
        'Service': app.service?.name || '',
        'Status': app.status,
        'Applicant Name': app.user?.name || '',
        'Phone': app.user?.phone || '',
        'Applied Date': new Date(app.createdAt).toLocaleDateString(),
        'Remarks': app.remarks || '',
        'Created': new Date(app.createdAt).toLocaleString()
      }));

    case 'complaints':
      return data.map(comp => ({
        'Reference No': comp.refNo,
        'Title': comp.title,
        'Description': comp.description,
        'Status': comp.status,
        'Priority': comp.priority,
        'Citizen': comp.user?.name || '',
        'Phone': comp.user?.phone || '',
        'Assigned To': comp.assignedTo || 'Unassigned',
        'Created': new Date(comp.createdAt).toLocaleString()
      }));

    case 'payments':
      return data.map(pay => ({
        'Payment ID': pay.id,
        'Amount': pay.amount,
        'Status': pay.status,
        'Payment Method': pay.paymentMethod || '',
        'Application Ref': pay.application?.refNo || '',
        'Service': pay.application?.service?.name || '',
        'Citizen': pay.user?.name || '',
        'Phone': pay.user?.phone || '',
        'Created': new Date(pay.createdAt).toLocaleString()
      }));

    case 'users':
      return data.map(user => ({
        'User ID': user.id,
        'Name': user.name,
        'Phone': user.phone,
        'Email': user.email || '',
        'Role': user.role,
        'Created': new Date(user.createdAt).toLocaleString()
      }));

    case 'rti':
      return data.map(rti => ({
        'Reference No': rti.refNo,
        'Subject': rti.subject,
        'Description': rti.description,
        'Status': rti.status,
        'Citizen': rti.user?.name || '',
        'Phone': rti.user?.phone || '',
        'Response': rti.responseText || '',
        'Created': new Date(rti.createdAt).toLocaleString()
      }));

    default:
      return flattenForExcel(data);
  }
};

module.exports = {
  exportToExcel,
  exportToExcelMultiSheet,
  flattenForExcel,
  formatExportData
};
