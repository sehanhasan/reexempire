
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Invoice, Customer } from '@/types/database';
import { invoiceService } from '@/services/invoiceService';
import { customerService } from '@/services/customerService';
import { PageHeader } from '@/components/common/PageHeader';
import { CustomerInfoCard } from '@/components/quotations/CustomerInfoCard';
import { QuotationItemsCard } from '@/components/quotations/QuotationItemsCard';
import { AdditionalInfoForm } from '@/components/quotations/AdditionalInfoForm';
import { InvoiceItem, DepositInfo } from '@/components/quotations/types';

export default function EditInvoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customerId, setCustomerId] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [terms, setTerms] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [depositInfo, setDepositInfo] = useState<DepositInfo>({
    requiresDeposit: false,
    depositAmount: 0,
    depositPercentage: 50,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentNumber, setDocumentNumber] = useState<string>('');

  const { data: invoice, isLoading, refetch } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceService.getById(id!),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: customer } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customerService.getById(customerId),
    enabled: !!customerId,
  });

  useEffect(() => {
    if (invoice) {
      setCustomerId(invoice.customer_id);
      setIssueDate(invoice.issue_date);
      setDueDate(invoice.due_date || '');
      setTerms(invoice.terms || '');
      setSubject(invoice.subject || '');
      setDocumentNumber(invoice.reference_number);
      setDepositInfo({
        requiresDeposit: invoice.is_deposit_invoice || false,
        depositAmount: Number(invoice.deposit_amount) || 0,
        depositPercentage: Number(invoice.deposit_percentage) || 50,
      });
    }
  }, [invoice]);

  useEffect(() => {
    if (customer) {
      setSelectedCustomer(customer);
    }
  }, [customer]);

  const { data: invoiceItems } = useQuery({
    queryKey: ['invoice-items', id],
    queryFn: () => invoiceService.getItemsByInvoiceId(id!),
    enabled: !!id,
    staleTime: 0,
  });

  useEffect(() => {
    if (invoiceItems) {
      const formattedItems = invoiceItems.map(item => ({
        id: parseInt(item.id),
        description: item.description,
        category: item.category || 'Other Items',
        quantity: Number(item.quantity),
        unit: item.unit,
        unitPrice: Number(item.unit_price),
        amount: Number(item.amount)
      }));
      setItems(formattedItems);
    }
  }, [invoiceItems]);

  const calculateItemAmount = (item: InvoiceItem) => {
    const quantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
    return quantity * item.unitPrice;
  };

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Invoice> }) => 
      invoiceService.update(id, updates),
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
      const total = items.reduce((sum, item) => sum + Number(item.amount), 0);

      const invoiceData: Partial<Invoice> = {
        customer_id: selectedCustomer.id,
        issue_date: issueDate,
        due_date: dueDate || null,
        subtotal: total,
        total: total,
        terms: terms,
        subject: subject,
        is_deposit_invoice: depositInfo.requiresDeposit,
        deposit_amount: Number(depositInfo.depositAmount),
        deposit_percentage: Number(depositInfo.depositPercentage),
        status: status || 'Sent',
        reference_number: documentNumber,
      };

      await updateInvoiceMutation.mutateAsync({ id: id!, updates: invoiceData });

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

  const handleCustomerChange = (newCustomerId: string) => {
    setCustomerId(newCustomerId);
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <PageHeader title="Edit Invoice" />
      <div className="space-y-6">
        <CustomerInfoCard
          customerId={customerId}
          setCustomer={handleCustomerChange}
          documentType="invoice"
          documentNumber={documentNumber}
          setDocumentNumber={setDocumentNumber}
          documentDate={issueDate}
          setDocumentDate={setIssueDate}
          expiryDate={dueDate}
          setExpiryDate={setDueDate}
          subject={subject}
          setSubject={setSubject}
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
