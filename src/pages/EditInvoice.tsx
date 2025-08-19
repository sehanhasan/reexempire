import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Invoice } from '@/types/database';
import { invoiceService } from '@/services/invoiceService';
import { customerService } from '@/services/customerService';
import { Customer } from '@/types/database';
import { PageHeader } from '@/components/ui/page-header';
import { CustomerInfoCard } from '@/components/invoices/CustomerInfoCard';
import { QuotationItemsCard } from '@/components/quotations/QuotationItemsCard';
import { AdditionalInfoForm } from '@/components/quotations/AdditionalInfoForm';
import { InvoiceItem, DepositInfo } from '@/components/quotations/types';

export default function EditInvoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [issueDate, setIssueDate] = useState<Date | null>(new Date());
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [terms, setTerms] = useState<string>('');
  const [depositInfo, setDepositInfo] = useState<DepositInfo>({
    requiresDeposit: false,
    depositAmount: 0,
    depositPercentage: 50,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: invoice, isLoading, refetch } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceService.getById(id!),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (invoice) {
      setSelectedCustomer({
        id: invoice.customer_id,
        name: invoice.customer_name,
        email: invoice.customer_email,
        address: invoice.customer_address,
        unit_number: invoice.customer_unit_number,
        phone: invoice.customer_phone,
      });
      setIssueDate(new Date(invoice.issue_date));
      setDueDate(invoice.due_date ? new Date(invoice.due_date) : null);
      setTerms(invoice.terms || '');
      setDepositInfo({
        requiresDeposit: invoice.requires_deposit,
        depositAmount: invoice.deposit_amount,
        depositPercentage: invoice.deposit_percentage,
      });
    }
  }, [invoice]);

  const { data: invoiceItems } = useQuery({
    queryKey: ['invoice-items', id],
    queryFn: () => invoiceService.getItemsByInvoiceId(id!),
    enabled: !!id,
    staleTime: 0,
  });

  useEffect(() => {
    if (invoiceItems) {
      setItems(invoiceItems);
    }
  }, [invoiceItems]);

  const calculateItemAmount = (item: InvoiceItem) => {
    const quantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
    return quantity * item.unitPrice;
  };

  const updateInvoiceMutation = useMutation({
    mutationFn: invoiceService.update,
    onSuccess: () => {
      toast.success('Invoice updated successfully!');
      refetch();
    },
    onError: (error: any) => {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice');
    },
  });

  const handleSubmit = async (e: React.FormEvent, status?: string) => {
    e.preventDefault();
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }

    setIsSubmitting(true);
    try {
      const total = items.reduce((sum, item) => sum + item.amount, 0);

      const invoiceData: Partial<Invoice> = {
        customer_id: selectedCustomer.id,
        customer_name: selectedCustomer.name,
        customer_email: selectedCustomer.email,
        customer_address: selectedCustomer.address,
        customer_unit_number: selectedCustomer.unit_number,
        customer_phone: selectedCustomer.phone,
        issue_date: issueDate ? issueDate.toISOString() : new Date().toISOString(),
        due_date: dueDate ? dueDate.toISOString() : null,
        subtotal: total,
        total: total,
        terms: terms,
        requires_deposit: depositInfo.requiresDeposit,
        deposit_amount: depositInfo.depositAmount,
        deposit_percentage: depositInfo.depositPercentage,
        status: status || 'Sent',
      };

      await updateInvoiceMutation.mutateAsync([id!, invoiceData]);

      // Update items
      await invoiceService.updateItems(id!, items);

      setIsSubmitting(false);
      navigate('/invoices');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to save invoice');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <PageHeader title="Edit Invoice" />
      <div className="space-y-6">
        <CustomerInfoCard
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          issueDate={issueDate}
          setIssueDate={setIssueDate}
          dueDate={dueDate}
          setDueDate={setDueDate}
          documentType="invoice"
        />

        <QuotationItemsCard
          items={items}
          setItems={setItems}
          depositInfo={depositInfo}
          setDepositInfo={setDepositInfo}
          calculateItemAmount={calculateItemAmount}
          documentType="invoice"
        />

        <AdditionalInfoForm
          terms={terms}
          setTerms={setTerms}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/invoices')}
          documentType="invoice"
          isSubmitting={isSubmitting}
          showDraft={true}
          documentId={id}
          documentNumber={invoice?.reference_number}
          customerName={selectedCustomer?.name}
          isEditMode={true}
        />
      </div>
    </div>
  );
}
