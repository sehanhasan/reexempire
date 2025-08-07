
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { invoiceService } from "@/services";
import { InvoiceItem } from "@/types/database";
import { formatCurrency } from "@/utils/formatters";

interface InvoiceItemsTableProps {
  invoiceId: string | undefined;
}

export function InvoiceItemsTable({ invoiceId }: InvoiceItemsTableProps) {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      if (!invoiceId) return;

      try {
        const data = await invoiceService.getItemsByInvoiceId(invoiceId);
        setItems(data || []);
      } catch (error) {
        console.error("Error fetching invoice items:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [invoiceId]);

  if (isLoading) {
    return <div className="text-center py-4">Loading items...</div>;
  }

  if (!items.length) {
    return <div className="text-center py-4 text-muted-foreground">No items found</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Description</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Unit Price</TableHead>
          <TableHead>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.description}</TableCell>
            <TableCell>{item.quantity}</TableCell>
            <TableCell>{item.unit}</TableCell>
            <TableCell>{item.unit_price}</TableCell>
            <TableCell>{formatCurrency(item.amount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
