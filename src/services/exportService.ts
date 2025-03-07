
import { Invoice, Quotation, Staff, Customer } from "@/types/database";
import { format } from "date-fns";

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
