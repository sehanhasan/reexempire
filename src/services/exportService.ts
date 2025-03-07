
import { format } from "date-fns";

export const exportService = {
  /**
   * Export data to CSV file
   * @param data Array of objects to export
   * @param filename Name of the file to download
   */
  exportToCSV(data: any[], filename: string): void {
    if (!data || !data.length) {
      console.error("No data to export");
      return;
    }

    // Get headers from first item
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
      // Headers row
      headers.join(","),
      // Data rows
      ...data.map(item => 
        headers
          .map(header => {
            const value = item[header];
            // Handle different data types
            if (value === null || value === undefined) return '';
            if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
            if (value instanceof Date) return `"${format(value, 'yyyy-MM-dd')}"`;
            return value;
          })
          .join(",")
      )
    ].join("\n");
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    
    // Start download and cleanup
    link.click();
    document.body.removeChild(link);
  },
};
