import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ItemRequest, User } from '../types';
import { format } from 'date-fns';

// Helper function to format date
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '';
  return format(new Date(dateString), 'MMM dd, yyyy');
};

// Helper function to get status display name
const getStatusDisplay = (status: string): string => {
  const statusMap: Record<string, string> = {
    draft: 'Draft',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    fulfilled: 'Fulfilled'
  };
  return statusMap[status] || status;
};

// Helper function to get priority display name
const getPriorityDisplay = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical'
  };
  return priorityMap[priority] || priority;
};

// Function to prepare data for export
export const prepareRequestsForExport = (
  requests: ItemRequest[],
  users: Record<string, User>,
  categories: Record<string, { name: string }>
) => {
  return requests.map(request => {
    const requester = users[request.userId] || { name: 'Unknown' };
    const approver = request.approvedBy ? users[request.approvedBy] || { name: 'Unknown' } : null;
    const category = categories[request.category] || { name: 'Unknown' };
    
    return {
      'ID': request.id,
      'Title': request.title,
      'Category': category.name,
      'Status': getStatusDisplay(request.status),
      'Priority': getPriorityDisplay(request.priority),
      'Quantity': request.quantity,
      'Requested By': requester.name,
      'Created Date': formatDate(request.createdAt),
      'Approved By': approver?.name || '',
      'Approved Date': formatDate(request.approvedAt),
      'Rejection Reason': request.rejectionReason || '',
      'Description': request.description
    };
  });
};

// Export to Excel
export const exportToExcel = (
  requests: ItemRequest[],
  users: Record<string, User>,
  categories: Record<string, { name: string }>
) => {
  const data = prepareRequestsForExport(requests, users, categories);
  
  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Inventory Requests');
  
  // Generate Excel file
  const fileName = `inventory_requests_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// Export to PDF
export const exportToPDF = (
  requests: ItemRequest[],
  users: Record<string, User>,
  categories: Record<string, { name: string }>
) => {
  const data = prepareRequestsForExport(requests, users, categories);
  
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text('Inventory Requests Summary', 14, 15);
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy')}`, 14, 22);
  
  // Create table
  autoTable(doc, {
    head: [Object.keys(data[0])],
    body: data.map(item => Object.values(item)),
    startY: 30,
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 20 }, // ID
      1: { cellWidth: 30 }, // Title
      2: { cellWidth: 20 }, // Category
      3: { cellWidth: 15 }, // Status
      4: { cellWidth: 15 }, // Priority
      5: { cellWidth: 15 }, // Quantity
      6: { cellWidth: 25 }, // Requested By
      7: { cellWidth: 20 }, // Created Date
      8: { cellWidth: 25 }, // Approved By
      9: { cellWidth: 20 }, // Approved Date
      10: { cellWidth: 30 }, // Rejection Reason
      11: { cellWidth: 40 }  // Description
    },
    didDrawPage: (data) => {
      // Add footer
      doc.setFontSize(8);
      doc.text('Gudang Mitra - Inventory Request Report', 14, doc.internal.pageSize.height - 10);
      doc.text(`Page ${doc.internal.getNumberOfPages()}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
    }
  });
  
  // Save the PDF
  const fileName = `inventory_requests_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
};
