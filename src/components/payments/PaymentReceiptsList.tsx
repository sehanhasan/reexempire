
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar } from 'lucide-react';
import { PaymentReceipt } from '@/services/paymentReceiptService';
import { format } from 'date-fns';

interface PaymentReceiptsListProps {
  receipts: PaymentReceipt[];
}

export function PaymentReceiptsList({ receipts }: PaymentReceiptsListProps) {
  if (receipts.length === 0) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'rejected':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending Review';
    }
  };

  const downloadReceipt = (receipt: PaymentReceipt) => {
    window.open(receipt.receipt_url, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Uploaded Payment Receipts ({receipts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {receipts.map((receipt) => (
            <div
              key={receipt.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">
                    {receipt.original_filename || 'Receipt'}
                  </span>
                  <Badge className={getStatusColor(receipt.status)}>
                    {getStatusText(receipt.status)}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(receipt.uploaded_at), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>

                {receipt.customer_notes && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Notes:</strong> {receipt.customer_notes}
                  </p>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadReceipt(receipt)}
              >
                <Download className="h-4 w-4 mr-1" />
                View
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
