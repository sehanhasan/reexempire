
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdditionalInfoCardProps {
  terms?: string | null;
  signatureData?: string;
}

export function AdditionalInfoCard({ terms, signatureData }: AdditionalInfoCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="font-semibold text-gray-700 mb-3 text-base">Additional Information</h3>
      
      {terms && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2 text-sm">Terms & Conditions:</h4>
          <div className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
            {terms}
          </div>
        </div>
      )}

      {signatureData && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-medium text-gray-700 mb-2 text-sm">Customer Signature:</h4>
          <div className="bg-gray-50 p-3 rounded-lg">
            <img 
              src={signatureData} 
              alt="Customer Signature" 
              className="max-w-xs h-20 object-contain"
            />
            <p className="text-xs text-gray-500 mt-2">
              Digitally signed on {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
