
import { Invoice, Quotation, Staff, Customer } from "@/types/database";
import jsPDF from "jspdf";
import "jspdf-autotable";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Helper function to convert data to CSV format
const convertToCSV = (data: any[]): string => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
};

// Helper function to trigger download
const downloadFile = (content: string, filename: string, type: string = 'text/csv') => {
  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const exportService = {
  // CSV Export function
  downloadCSV(data: any[], filename: string): void {
    const csvContent = convertToCSV(data);
    downloadFile(csvContent, `${filename}.csv`);
  },

  // PDF Export for Invoice
  exportInvoiceToPDF(invoice: any): void {
    const doc = new jsPDF();
    
    // Add invoice header
    doc.setFontSize(20);
    doc.text('INVOICE', 20, 30);
    
    // Add invoice details
    doc.setFontSize(12);
    doc.text(`Reference: ${invoice.reference_number}`, 20, 50);
    doc.text(`Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 20, 60);
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 20, 70);
    
    // Add customer information
    if (invoice.customer) {
      doc.text('Bill To:', 20, 90);
      doc.text(invoice.customer.name || '', 20, 100);
      if (invoice.customer.address) {
        doc.text(invoice.customer.address, 20, 110);
      }
      if (invoice.customer.email) {
        doc.text(invoice.customer.email, 20, 120);
      }
    }
    
    // Add items table
    if (invoice.items && invoice.items.length > 0) {
      const tableData = invoice.items.map((item: any) => [
        item.description,
        item.quantity.toString(),
        item.unit,
        `$${item.unit_price.toFixed(2)}`,
        `$${item.amount.toFixed(2)}`
      ]);
      
      doc.autoTable({
        head: [['Description', 'Quantity', 'Unit', 'Unit Price', 'Amount']],
        body: tableData,
        startY: 140,
      });
    }
    
    // Add totals
    const finalY = (doc as any).lastAutoTable?.finalY || 180;
    doc.text(`Subtotal: $${invoice.subtotal?.toFixed(2) || '0.00'}`, 120, finalY + 20);
    if (invoice.tax_amount) {
      doc.text(`Tax: $${invoice.tax_amount.toFixed(2)}`, 120, finalY + 30);
    }
    doc.text(`Total: $${invoice.total?.toFixed(2) || '0.00'}`, 120, finalY + 40);
    
    // Download the PDF
    doc.save(`invoice-${invoice.reference_number}.pdf`);
  },

  // Data preparation functions for different entities
  prepareInvoiceData(invoices: Invoice[]): any[] {
    return invoices.map(invoice => ({
      reference_number: invoice.reference_number,
      customer_name: (invoice as any).customer?.name || '',
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      status: invoice.status,
      payment_status: invoice.payment_status,
      subtotal: invoice.subtotal,
      tax_amount: invoice.tax_amount,
      total: invoice.total,
      notes: invoice.notes || '',
      created_at: invoice.created_at
    }));
  },

  prepareQuotationData(quotations: Quotation[]): any[] {
    return quotations.map(quotation => ({
      reference_number: quotation.reference_number,
      customer_id: quotation.customer_id,
      issue_date: quotation.issue_date,
      expiry_date: quotation.expiry_date,
      status: quotation.status,
      subtotal: quotation.subtotal,
      total: quotation.total,
      notes: quotation.notes || '',
      created_at: quotation.created_at
    }));
  },

  prepareStaffData(staff: Staff[]): any[] {
    return staff.map(member => ({
      name: member.name,
      position: member.position || '',
      email: member.email || '',
      phone: member.phone || '',
      status: member.status,
      join_date: member.join_date,
      created_at: member.created_at
    }));
  },

  prepareCustomerData(customers: Customer[]): any[] {
    return customers.map(customer => ({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      postal_code: customer.postal_code || '',
      created_at: customer.created_at
    }));
  }
};
