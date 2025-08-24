import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast"
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CopyButton } from "@/components/CopyButton"
import { format } from 'date-fns';

import { quotationService, categoryService } from '@/services';
import { Quotation, Customer, QuotationItem, Subcategory } from '@/types/database';

export function ViewQuotation() {
  const { id } = useParams<{ id: string }>();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load quotation
        const quotationData = await quotationService.getById(id as string);
        setQuotation(quotationData);

        // Load customer
        const customerData = await quotationService.getCustomerByQuotationId(id as string);
        setCustomer(customerData);

        // Load quotation items
        const itemsData = await quotationService.getQuotationItems(id as string);
        setQuotationItems(itemsData);

        // Load subcategories with units
        const subcategoriesData = await categoryService.getAllSubcategories();
        setSubcategories(subcategoriesData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load quotation details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const getItemUnit = (category: string) => {
    const subcategory = subcategories.find(sub => sub.name === category);
    return subcategory?.unit || '';
  };

  const formatUnitPrice = (price: number, category: string) => {
    const unit = getItemUnit(category);
    return unit ? `${price.toFixed(2)}/${unit}` : price.toFixed(2);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'Sent':
        return <Badge variant="default">Sent</Badge>;
      case 'Viewed':
        return <Badge variant="outline">Viewed</Badge>;
      case 'Accepted':
        return <Badge>Accepted</Badge>;
      case 'Rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4 max-w-4xl">Loading quotation details...</div>;
  }

  if (!quotation || !customer) {
    return <div className="container mx-auto p-4 max-w-4xl">Quotation not found.</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-4">
        <Link to="/quotations">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quotations
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{quotation.subject}</h2>
            <div className="text-gray-500">
              Reference: <CopyButton text={quotation.reference_number} />
            </div>
          </div>
          <div className="flex flex-col items-end">
            {getStatusBadge(quotation.status)}
            <div className="text-gray-500">
              Issued: {format(new Date(quotation.issue_date), 'PPP')}
            </div>
            <div className="text-gray-500">
              Expires: {format(new Date(quotation.expiry_date), 'PPP')}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Customer Information</h3>
          <div>
            <strong>{customer.name}</strong>
            <div className="text-gray-500">{customer.email}</div>
            <div className="text-gray-500">{customer.phone}</div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Description</th>
                  <th className="text-center p-2 font-medium">Qty</th>
                  <th className="text-right p-2 font-medium">Unit Price (RM)</th>
                  <th className="text-right p-2 font-medium">Amount (RM)</th>
                </tr>
              </thead>
              <tbody>
                {quotationItems.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{item.description}</td>
                    <td className="text-center p-2">{item.quantity}</td>
                    <td className="text-right p-2">{formatUnitPrice(item.unit_price, item.category || '')}</td>
                    <td className="text-right p-2">{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="w-72 space-y-2">
            <div className="flex justify-between">
              <div className="font-medium">Subtotal:</div>
              <div>RM {quotation.subtotal.toFixed(2)}</div>
            </div>
            <div className="flex justify-between">
              <div className="font-medium">Total:</div>
              <div>RM {quotation.total.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Deposit Information</h3>
          <div className="flex justify-between">
            <div className="font-medium">Requires Deposit:</div>
            <div>{quotation.requires_deposit ? 'Yes' : 'No'}</div>
          </div>
          {quotation.requires_deposit && (
            <>
              <div className="flex justify-between">
                <div className="font-medium">Deposit Amount:</div>
                <div>RM {quotation.deposit_amount.toFixed(2)}</div>
              </div>
              <div className="flex justify-between">
                <div className="font-medium">Deposit Percentage:</div>
                <div>{quotation.deposit_percentage}%</div>
              </div>
            </>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Notes</h3>
          <div className="text-gray-700">{quotation.notes || 'No notes provided.'}</div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Terms and Conditions</h3>
          <div className="text-gray-700">{quotation.terms || 'No terms and conditions provided.'}</div>
        </div>
      </div>
    </div>
  );
}
