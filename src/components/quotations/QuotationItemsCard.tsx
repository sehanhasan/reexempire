
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ItemsTable } from "./ItemsTable";
import { QuotationItem } from "./types";
import { CategoryItemSelector } from "./CategoryItemSelector";
import { categoryService } from "@/services";

interface QuotationItemsCardProps {
  items: QuotationItem[];
  onItemsChange: (items: QuotationItem[]) => void;
}

export function QuotationItemsCard({ items, onItemsChange }: QuotationItemsCardProps) {
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

  const addNewItem = () => {
    const newItem: QuotationItem = {
      id: Date.now(),
      description: "",
      category: "",
      quantity: 1,
      unit: "",
      unitPrice: 0,
      amount: 0
    };
    const updatedItems = [...items, newItem];
    onItemsChange(updatedItems);
    
    // Scroll to the new item after a brief delay to ensure it's rendered
    setTimeout(() => {
      const newItemElement = document.querySelector(`[data-item-id="${newItem.id}"]`);
      if (newItemElement) {
        newItemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleItemChange = (id: number, field: keyof QuotationItem, value: any) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculate amount when quantity or unitPrice changes
        if (field === 'quantity' || field === 'unitPrice') {
          const quantity = field === 'quantity' ? parseFloat(value) || 0 : updatedItem.quantity;
          const unitPrice = field === 'unitPrice' ? value : updatedItem.unitPrice;
          updatedItem.amount = quantity * unitPrice;
        }
        
        return updatedItem;
      }
      return item;
    });
    onItemsChange(updatedItems);
  };

  const removeItem = (id: number) => {
    const filteredItems = items.filter(item => item.id !== id);
    onItemsChange(filteredItems);
  };

  const handleCategoryItemSelect = (categoryItem: any) => {
    const newItem: QuotationItem = {
      id: Date.now(),
      description: categoryItem.name,
      category: categoryItem.category,
      quantity: 1,
      unit: categoryItem.unit,
      unitPrice: categoryItem.price,
      amount: categoryItem.price
    };
    const updatedItems = [...items, newItem];
    onItemsChange(updatedItems);
    
    // Scroll to the new item after a brief delay to ensure it's rendered
    setTimeout(() => {
      const newItemElement = document.querySelector(`[data-item-id="${newItem.id}"]`);
      if (newItemElement) {
        newItemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg text-cyan-600">Items</CardTitle>
            <CardDescription>Add items and services for this quotation.</CardDescription>
          </div>
          <div className="flex gap-2">
            <CategoryItemSelector onItemSelect={handleCategoryItemSelect} />
            <Button type="button" onClick={addNewItem} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ItemsTable
          items={items}
          handleItemChange={handleItemChange}
          removeItem={removeItem}
          categoryUnits={categoryUnits}
        />
      </CardContent>
    </Card>
  );
}
