import { Invoice, Quotation, Staff, Customer } from "@/types/database";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";

export const exportService = {
  /**
   * Converts an array of data to CSV format and triggers download
   */
  downloadCSV(data: any[], filename: string): void {
    if (data.length === 0) {
      console.warn("No data to export");
      return;
    }

    // Get headers from the first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content with headers
    let csvContent = headers.join(",") + "\n";
    
    // Add rows
    data.forEach(item => {
      const row = headers.map(header => {
        // Get the value and format it for CSV
        const value = item[header] !== null && item[header] !== undefined ? item[header] : "";
        
        // Escape quotes and wrap in quotes if needed
        const formattedValue = typeof value === "string" ? 
          `"${value.replace(/"/g, '""')}"` : 
          value;
        
        return formattedValue;
      }).join(",");
      
      csvContent += row + "\n";
    });
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    // Set up and trigger download
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Export invoice to PDF
   */
  async exportInvoiceToPDF(invoice: any, customer: Customer, items: any[]): Promise<void> {
    try {
      // For now, we'll create a simple PDF export using browser's print functionality
      // This can be enhanced with a proper PDF library later
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Unable to open print window');
      }

      const invoiceHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice ${invoice.reference_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { margin-bottom: 30px; }
            .invoice-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .customer-info { margin: 20px 0; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .totals { margin-top: 20px; text-align: right; }
            .total-row { margin: 5px 0; }
            .final-total { font-weight: bold; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="invoice-title">Invoice ${invoice.reference_number}</div>
            <p>Date: ${new Date(invoice.issue_date).toLocaleDateString()}</p>
            ${invoice.due_date ? `<p>Due Date: ${new Date(invoice.due_date).toLocaleDateString()}</p>` : ''}
          </div>
          
          <div class="customer-info">
            <h3>Bill To:</h3>
            <p><strong>${customer.name}</strong></p>
            ${customer.unit_number ? `<p>Unit: ${customer.unit_number}</p>` : ''}
            ${customer.address ? `<p>${customer.address}</p>` : ''}
            ${customer.city || customer.state || customer.postal_code ? 
              `<p>${[customer.city, customer.state, customer.postal_code].filter(Boolean).join(', ')}</p>` : ''}
            ${customer.email ? `<p>Email: ${customer.email}</p>` : ''}
            ${customer.phone ? `<p>Phone: ${customer.phone}</p>` : ''}
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>${item.unit}</td>
                  <td>RM ${item.unit_price?.toFixed(2) || '0.00'}</td>
                  <td>RM ${item.amount?.toFixed(2) || '0.00'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">Subtotal: RM ${invoice.subtotal?.toFixed(2) || '0.00'}</div>
            ${invoice.is_deposit_invoice ? `
              <div class="total-row">Deposit (${invoice.deposit_percentage}%): RM ${invoice.deposit_amount?.toFixed(2) || '0.00'}</div>
            ` : ''}
            ${invoice.tax_amount > 0 ? `
              <div class="total-row">Tax (${invoice.tax_rate}%): RM ${invoice.tax_amount?.toFixed(2) || '0.00'}</div>
            ` : ''}
            <div class="total-row final-total">Total: RM ${invoice.total?.toFixed(2) || '0.00'}</div>
          </div>

          ${invoice.notes ? `
            <div style="margin-top: 30px;">
              <h3>Notes:</h3>
              <p>${invoice.notes}</p>
            </div>
          ` : ''}
        </body>
        </html>
      `;

      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
      
      // Wait a moment for content to load, then trigger print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);

      toast({
        title: "PDF Export",
        description: "Invoice PDF export initiated. Please check your browser's print dialog."
      });
    } catch (error) {
      console.error('PDF export error:', error);
      throw error;
    }
  },
  
  /**
   * Prepares invoice data for CSV export
   */
  prepareInvoiceData(invoices: Invoice[]): any[] {
    return invoices.map(invoice => ({
      "Reference Number": invoice.reference_number,
      "Issue Date": invoice.issue_date,
      "Due Date": invoice.due_date,
      "Status": invoice.status,
      "Payment Status": invoice.payment_status,
      "Subtotal": invoice.subtotal,
      "Tax Amount": invoice.tax_amount,
      "Total": invoice.total,
      "Is Deposit Invoice": invoice.is_deposit_invoice ? "Yes" : "No",
      "Deposit Amount": invoice.deposit_amount,
      "Notes": invoice.notes || ""
    }));
  },
  
  /**
   * Prepares quotation data for CSV export
   */
  prepareQuotationData(quotations: Quotation[]): any[] {
    return quotations.map(quotation => ({
      "Reference Number": quotation.reference_number,
      "Issue Date": quotation.issue_date,
      "Expiry Date": quotation.expiry_date,
      "Status": quotation.status,
      "Subtotal": quotation.subtotal,
      "Total": quotation.total,
      "Requires Deposit": quotation.requires_deposit ? "Yes" : "No",
      "Deposit Amount": quotation.deposit_amount,
      "Notes": quotation.notes || ""
    }));
  },
  
  /**
   * Prepares staff data for CSV export
   */
  prepareStaffData(staff: Staff[]): any[] {
    return staff.map(member => ({
      "Name": member.name,
      "Position": member.position || "",
      "Email": member.email || "",
      "Phone": member.phone || "",
      "Status": member.status,
      "Join Date": member.join_date,
      "Department": member.department || ""
    }));
  },
  
  /**
   * Prepares customer data for CSV export
   */
  prepareCustomerData(customers: Customer[]): any[] {
    return customers.map(customer => ({
      "Name": customer.name,
      "Email": customer.email || "",
      "Phone": customer.phone || "",
      "Address": customer.address || "",
      "City": customer.city || "",
      "State": customer.state || "",
      "Postal Code": customer.postal_code || ""
    }));
  }
};
