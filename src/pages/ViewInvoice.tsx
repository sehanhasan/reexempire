
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { invoiceService } from '@/services/invoiceService';
import { customerService } from '@/services/customerService';
import { FileText, Download, Share2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { toast } from 'sonner';
import { shareInvoice } from '@/utils/mobileShare';

export default function ViewInvoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  // Set viewport to allow pinch-to-zoom
  useEffect(() => {
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 'width=1024, initial-scale=0.3, minimum-scale=0.1, maximum-scale=3.0, user-scalable=yes');
    } else {
      const newViewport = document.createElement('meta');
      newViewport.name = 'viewport';
      newViewport.content = 'width=1024, initial-scale=0.3, minimum-scale=0.1, maximum-scale=3.0, user-scalable=yes';
      document.head.appendChild(newViewport);
    }

    // Cleanup on unmount
    return () => {
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
      }
    };
  }, []);

  const { data: invoice, isLoading, refetch } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceService.getById(id!),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: customer } = useQuery({
    queryKey: ['customer', invoice?.customer_id],
    queryFn: () => customerService.getById(invoice!.customer_id),
    enabled: !!invoice?.customer_id,
    staleTime: 0,
  });

  const { data: items = [] } = useQuery({
    queryKey: ['invoice-items', id],
    queryFn: () => invoiceService.getItemsByInvoiceId(id!),
    enabled: !!id,
    staleTime: 0,
  });

  // Set page title with invoice number
  useEffect(() => {
    if (invoice) {
      document.title = `Invoice #${invoice.reference_number} - Reex Empire`;
    }
    return () => {
      document.title = 'Reex Empire';
    };
  }, [invoice]);

  const handleShare = async () => {
    if (!invoice || !customer) {
      toast.error('Missing invoice or customer information');
      return;
    }

    try {
      await shareInvoice(invoice.id, invoice.reference_number, customer.name);
      toast.success('Invoice shared successfully!');
    } catch (error) {
      console.error('Error sharing invoice:', error);
      toast.error('Failed to share invoice');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" style={{ minWidth: '1024px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" style={{ minWidth: '1024px' }}>
        <div className="text-center">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Invoice Not Found</h2>
          <p className="text-muted-foreground">The invoice you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')} className="mt-4">Return Home</Button>
        </div>
      </div>
    );
  }

  // Group items by category with sequential index numbers
  const groupedItems: { [key: string]: any[] } = {};
  const categoryOrder: string[] = [];
  
  items.forEach(item => {
    const category = item.category || "Other Items";
    if (!groupedItems[category]) {
      groupedItems[category] = [];
      categoryOrder.push(category);
    }
    groupedItems[category].push(item);
  });

  return (
    <div className="min-h-screen bg-background" style={{ minWidth: '1024px' }} id="invoice-view">
      <div className="py-4 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Compact Header with Company and Invoice Info in Columns */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Company Logo and Details */}
              <div>
                <img 
                  src="https://i.ibb.co/Ltyts5K/reex-empire-logo.png" 
                  alt="Reex Empire Logo" 
                  className="h-16 w-auto mb-3"
                />
                <h2 className="text-sm font-bold text-gray-900 mb-2">Reex Empire Sdn Bhd (1426553-A)</h2>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>No. 29-1, Jalan 2A/6, Taman Setapak Indah</p>
                  <p>53300 Setapak Kuala Lumpur</p>
                  <p className="text-gray-800">www.reexempire.com</p>
                </div>
                {/* Subject within customer info */}
                {invoice.subject && (
                  <div className="mt-3 pt-2 border-t">
                    <p className="text-sm text-gray-800 font-semibold mb-1">Subject: {invoice.subject}</p>
                  </div>
                )}
              </div>
              
              {/* Right Column - Invoice Details and Customer */}
              <div>
                <div className="mb-3">
                  <h1 className="text-xl font-bold text-gray-900">Invoice #{invoice.reference_number}</h1>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="mb-1" variant={invoice.status === 'Paid' ? "default" : "secondary"}>
                      {invoice.status}
                    </Badge>
                    {invoice.quotation_ref_number && (
                      <Badge variant="outline" className="mb-1 bg-blue-50 text-blue-700 border-blue-200">
                        From Quotation #{invoice.quotation_ref_number}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Issue Date:</strong> {formatDate(invoice.issue_date)}</p>
                    <p><strong>Due Date:</strong> {formatDate(invoice.due_date)}</p>
                  </div>
                </div>
                
                {customer && (
                  <div className="w-64 bg-gray-100 p-3 rounded-lg text-sm">
                    <p className="text-lg font-bold text-gray-500 font-medium mb-1">Bill To</p>
                    <div className="text-sm text-gray-800 space-y-1">
                      <p>Attn: {customer.name}</p>
                      <p className="font-semibold">{customer.unit_number}</p>
                      <p>{customer.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Compact Items Table with Sequential Category Index Numbers */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left p-2 font-semibold text-gray-700">Description</th>
                      <th className="text-right p-2 font-semibold text-gray-700 w-16">Qty</th>
                      <th className="text-right p-2 font-semibold text-gray-700 w-24">Unit Price</th>
                      <th className="text-right p-2 font-semibold text-gray-700 w-24">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryOrder.map((category, categoryIndex) => (
                      <React.Fragment key={category}>
                        <tr className="bg-blue-50 border-t border-b">
                          <td colSpan={4} className="p-2 font-semibold text-blue-800 text-sm">
                            {categoryIndex + 1}- {category}
                          </td>
                        </tr>
                        {groupedItems[category].map((item, index) => (
                          <tr key={`${category}-${index}`} className="border-b hover:bg-gray-50">
                            <td className="p-2 text-gray-800">{item.description}</td>
                            <td className="text-right p-2 text-gray-800">{item.quantity}</td>
                            <td className="text-right p-2 text-gray-800">{item.unit_price.toFixed(2)}</td>
                            <td className="text-right p-2 font-semibold text-gray-800">{item.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Compact Subtotal and Total Information */}
              <div className="p-3 bg-gray-50 border-t">
                <div className="flex justify-end">
                  <div className="w-64 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Subtotal:</span>
                      <span>{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    
                    {invoice.tax_rate > 0 && (
                      <div className="flex justify-between">
                        <span className="font-medium">
                          Tax ({invoice.tax_rate}%):
                        </span>
                        <span>{formatCurrency(invoice.tax_amount)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-base font-bold border-t pt-1">
                      <span>Total:</span>
                      <span className="text-blue-600">{formatCurrency(invoice.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="text-center text-gray-600 text-sm py-3 bg-gray-50 rounded-lg">
            <p>For all enquiries, please contact Khalil Pasha</p>
            <p>Email: reexsb@gmail.com Tel: 011-1665 6525 / 019-999 1024</p>
          </div>
          
          <div className="text-center text-gray-500 text-xs py-3">
            <p>&copy; {new Date().getFullYear()} Reex Empire Sdn Bhd. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
