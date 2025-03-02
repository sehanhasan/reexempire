
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow, Table, TableHeader, TableHead, TableBody } from "@/components/ui/table";
import { X } from "lucide-react";
import { QuotationItem } from "./types";
import { useIsMobile } from "@/hooks/use-mobile";

interface ItemsTableProps {
  items: QuotationItem[];
  handleItemChange: (id: number, field: keyof QuotationItem, value: any) => void;
  removeItem: (id: number) => void;
  showCategory?: boolean;
}

export function ItemsTable({ 
  items, 
  handleItemChange, 
  removeItem,
  showCategory = false 
}: ItemsTableProps) {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <div className="space-y-4">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="border rounded-lg p-4 relative"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeItem(item.id)}
              className="absolute top-2 right-2 h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
            
            {showCategory && item.category && (
              <div className="mb-3">
                <div className="text-xs text-muted-foreground">Category</div>
                <div className="font-medium text-sm bg-slate-100 px-2 py-1 rounded inline-block">
                  {item.category}
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Description</label>
                <Input
                  value={item.description}
                  onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                  placeholder={showCategory && item.category ? `${item.category} - Description` : "Description"}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(item.id, "quantity", parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Unit</label>
                  <Input
                    value={item.unit}
                    onChange={(e) => handleItemChange(item.id, "unit", e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Unit Price (RM)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(item.id, "unitPrice", parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Amount (RM)</label>
                  <Input
                    type="number"
                    value={item.amount.toFixed(2)}
                    disabled
                    className="bg-slate-50"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showCategory && <TableHead>Category</TableHead>}
          <TableHead>Description</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Unit Price (RM)</TableHead>
          <TableHead>Amount (RM)</TableHead>
          <TableHead width={80}></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            {showCategory && (
              <TableCell>
                {item.category && (
                  <span className="bg-slate-100 px-2 py-1 rounded text-sm">
                    {item.category}
                  </span>
                )}
              </TableCell>
            )}
            <TableCell>
              <Input
                value={item.description}
                onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                placeholder={showCategory && item.category ? `${item.category} - Description` : "Description"}
              />
            </TableCell>
            <TableCell>
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => handleItemChange(item.id, "quantity", parseInt(e.target.value))}
              />
            </TableCell>
            <TableCell>
              <Input
                value={item.unit}
                onChange={(e) => handleItemChange(item.id, "unit", e.target.value)}
              />
            </TableCell>
            <TableCell>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.unitPrice}
                onChange={(e) => handleItemChange(item.id, "unitPrice", parseFloat(e.target.value))}
              />
            </TableCell>
            <TableCell>
              <Input
                type="number"
                value={item.amount.toFixed(2)}
                disabled
                className="bg-slate-50"
              />
            </TableCell>
            <TableCell>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(item.id)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
