
import { formatCurrency } from "@/utils/formatters";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  category?: string;
}

interface InvoiceItemsTableProps {
  items: InvoiceItem[];
}

export function InvoiceItemsTable({ items }: InvoiceItemsTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No items found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2 font-medium">Description</th>
            <th className="text-center py-3 px-2 font-medium w-20">Qty</th>
            <th className="text-center py-3 px-2 font-medium w-20">Unit</th>
            <th className="text-right py-3 px-2 font-medium w-24">Price</th>
            <th className="text-right py-3 px-2 font-medium w-24">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="py-3 px-2">
                <div>
                  <div className="font-medium">{item.description}</div>
                  {item.category && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.category}
                    </div>
                  )}
                </div>
              </td>
              <td className="text-center py-3 px-2">{item.quantity}</td>
              <td className="text-center py-3 px-2">{item.unit}</td>
              <td className="text-right py-3 px-2">{item.unit_price.toFixed(2)}</td>
              <td className="text-right py-3 px-2">{item.amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
