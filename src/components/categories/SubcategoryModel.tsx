
import { useState, useEffect } from "react";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Plus, Trash } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export interface PricingOption {
  id: string;
  name: string;
  price: number;
  unit: string;
}

export interface Subcategory {
  id: string;
  name: string;
  description: string;
  pricingOptions: PricingOption[];
}

interface SubcategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: {
    id: string;
    name: string;
  };
  subcategory?: Subcategory;
  onSave: (subcategory: Subcategory) => void;
}

export function SubcategoryModal({
  open,
  onOpenChange,
  category,
  subcategory,
  onSave,
}: SubcategoryModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pricingOptions, setPricingOptions] = useState<PricingOption[]>([
    { id: `po-${Date.now()}`, name: "", price: 0, unit: "Unit" }
  ]);

  // Reset form when modal opens with new data
  useEffect(() => {
    if (open) {
      setName(subcategory?.name || "");
      setDescription(subcategory?.description || "");
      setPricingOptions(
        subcategory?.pricingOptions?.length 
          ? [...subcategory.pricingOptions] 
          : [{ id: `po-${Date.now()}`, name: "", price: 0, unit: "Unit" }]
      );
    }
  }, [open, subcategory]);

  const addPricingOption = () => {
    setPricingOptions([
      ...pricingOptions,
      { id: `po-${Date.now()}`, name: "", price: 0, unit: "Unit" }
    ]);
  };

  const removePricingOption = (id: string) => {
    if (pricingOptions.length > 1) {
      setPricingOptions(pricingOptions.filter(option => option.id !== id));
    }
  };

  const updatePricingOption = (id: string, field: keyof PricingOption, value: any) => {
    setPricingOptions(pricingOptions.map(option => 
      option.id === id ? { ...option, [field]: value } : option
    ));
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: "Missing Information",
        description: "Subcategory name is required",
        variant: "destructive",
      });
      return;
    }
    
    const newSubcategory: Subcategory = {
      id: subcategory?.id || `subcat-${Date.now()}`,
      name,
      description,
      pricingOptions: pricingOptions.filter(option => option.name.trim() !== "")
    };
    
    onSave(newSubcategory);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[90vw] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>
            {subcategory ? "Edit Subcategory" : "Add Subcategory"}
          </SheetTitle>
          <SheetDescription>
            Add a new subcategory to <span className="font-medium">{category?.name || ""}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Subcategory Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sink Installation"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this subcategory"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
              <Label>Pricing Options</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPricingOption}>
                <Plus className="h-4 w-4 mr-1" /> Add Option
              </Button>
            </div>

            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price (RM)</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingOptions.map((option) => (
                    <TableRow key={option.id}>
                      <TableCell>
                        <Input
                          value={option.name}
                          onChange={(e) => updatePricingOption(option.id, "name", e.target.value)}
                          placeholder="Option name"
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">RM</span>
                          <Input
                            type="number"
                            value={option.price}
                            onChange={(e) => updatePricingOption(option.id, "price", parseFloat(e.target.value) || 0)}
                            className="pl-10"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={option.unit}
                          onChange={(e) => updatePricingOption(option.id, "unit", e.target.value)}
                          placeholder="Unit"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePricingOption(option.id)}
                          disabled={pricingOptions.length <= 1}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button onClick={handleSave}>Save Subcategory</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
