
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ItemsTable } from "./ItemsTable";
import { InvoiceItem } from "./types";
import { categoryService } from "@/services";

interface InvoiceItemsCardProps {
  items: InvoiceItem[];
  setItems?: React.Dispatch<React.SetStateAction<InvoiceItem[]>>;
  isDepositInvoice?: boolean;
  setIsDepositInvoice?: React.Dispatch<React.SetStateAction<boolean>>;
  calculateItemAmount?: (item: InvoiceItem) => number;
  onItemsChange?: (items: InvoiceItem[]) => void; // keep backward compatibility
}

export function InvoiceItemsCard({ items, setItems, onItemsChange }: InvoiceItemsCardProps) {
  const [categoryUnits, setCategoryUnits] = useState<{ [key: string]: string }>({});
  
  useEffect(() => {
    const fetchCategoryUnits = async () => {
      try {
        const subcategories = await categoryService.getAllSubcategories();
        const units: { [key: string]: string } = {};
        
        subcategories.forEach(sub => {
          if (sub.description && sub.unit) {
            units[sub.description] = sub.unit;
          }
        });
        
        setCategoryUnits(units);
      } catch (error) {
        console.error("Error fetching category units:", error);
      }
    };
    
    fetchCategoryUnits();
  }, []);

  const updateItems = (updated: InvoiceItem[]) => {
    if (setItems) {
      setItems(updated);
    } else if (onItemsChange) {
      onItemsChange(updated);
    }
  };

  const addNewItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now(),
      description: "",
      category: "",
      quantity: 1,
      unit: "",
      unitPrice: 0,
      amount: 0
    };
    const updatedItems = [...items, newItem];
    updateItems(updatedItems);
    
    setTimeout(() => {
      const newItemElement = document.querySelector(`[data-item-id="${newItem.id}"]`);
      if (newItemElement) {
        newItemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleItemChange = (id: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        if (field === 'quantity' || field === 'unitPrice') {
          const quantity = field === 'quantity'
            ? (typeof value === 'string' ? parseFloat(value) || 0 : Number(value))
            : (typeof updatedItem.quantity === 'string' ? parseFloat(updatedItem.quantity as string) || 0 : Number(updatedItem.quantity));
          const unitPrice = field === 'unitPrice' ? Number(value) : Number(updatedItem.unitPrice);
          updatedItem.amount = quantity * unitPrice;
        }
        
        return updatedItem;
      }
      return item;
    });
    updateItems(updatedItems);
  };

  const removeItem = (id: number) => {
    const filteredItems = items.filter(item => item.id !== id);
    updateItems(filteredItems);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg text-cyan-600">Items</CardTitle>
            <CardDescription>Add items and services for this invoice.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={addNewItem} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ItemsTable
          items={items as any} // structurally compatible with QuotationItem
          handleItemChange={handleItemChange as any}
          removeItem={removeItem}
          categoryUnits={categoryUnits}
        />
      </CardContent>
    </Card>
  );
}

