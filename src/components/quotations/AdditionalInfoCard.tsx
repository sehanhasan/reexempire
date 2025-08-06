
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface AdditionalInfoCardProps {
  subject?: string;
  terms?: string;
  signatureData?: string;
}

export function AdditionalInfoCard({ subject, terms, signatureData }: AdditionalInfoCardProps) {
  const hasAnyContent = subject || terms || signatureData;

  if (!hasAnyContent) {
    return null;
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        {subject && (
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Subject</h4>
            <p className="text-sm">{subject}</p>
          </div>
        )}

        {terms && (
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Terms & Conditions</h4>
            <p className="text-sm whitespace-pre-wrap">{terms}</p>
          </div>
        )}

        {signatureData && (
          <>
            {(subject || terms) && <Separator />}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-3">Customer Signature</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <img 
                  src={signatureData} 
                  alt="Customer Signature" 
                  className="max-w-full h-auto border border-gray-200 rounded bg-white"
                  style={{ maxHeight: '150px' }}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Signed digitally on {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
