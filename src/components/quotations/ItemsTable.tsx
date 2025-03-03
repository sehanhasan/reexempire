
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ItemBase } from "./types";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell 
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

interface ItemsTableProps<T extends ItemBase> {
  items: T[];
  handleItemChange: (id: number, field: keyof T, value: any) => void;
  removeItem: (id: number) => void;
}

export function ItemsTable<T extends ItemBase>({ 
  items, 
  handleItemChange, 
  removeItem 
}: ItemsTableProps<T>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Qty</label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, "quantity", parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Unit</label>
                    <Select
                      value={item.unit}
                      onValueChange={(value) => handleItemChange(item.id, "unit", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Unit">Unit</SelectItem>
                        <SelectItem value="Hour">Hour</SelectItem>
                        <SelectItem value="Day">Day</SelectItem>
                        <SelectItem value="Meter">Meter</SelectItem>
                        <SelectItem value="Sq.m">Sq.m</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Unit Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">RM</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Amount</label>
                    <div className="text-lg font-medium pt-1.5 pl-2">
                      RM {item.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-700"
                    disabled={items.length <= 1}
                  >
                    <X className="h-4 w-4 mr-1" /> Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="py-3 px-4 text-left font-medium">Description</TableHead>
            <TableHead className="py-3 px-4 text-center font-medium w-20">Qty</TableHead>
            <TableHead className="py-3 px-4 text-center font-medium w-24">Unit</TableHead>
            <TableHead className="py-3 px-4 text-right font-medium w-32">Unit Price</TableHead>
            <TableHead className="py-3 px-4 text-right font-medium w-32">Amount</TableHead>
            <TableHead className="py-3 px-4 text-center font-medium w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={`row-${item.id}`}>
              <TableCell className="py-3 px-4">
                <Input
                  placeholder="Item description"
                  value={item.description}
                  onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                  required
                />
              </TableCell>
              <TableCell className="py-3 px-4">
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(item.id, "quantity", parseInt(e.target.value) || 1)}
                  required
                  className="text-center"
                />
              </TableCell>
              <TableCell className="py-3 px-4">
                <Select
                  value={item.unit}
                  onValueChange={(value) => handleItemChange(item.id, "unit", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unit">Unit</SelectItem>
                    <SelectItem value="Hour">Hour</SelectItem>
                    <SelectItem value="Day">Day</SelectItem>
                    <SelectItem value="Meter">Meter</SelectItem>
                    <SelectItem value="Sq.m">Sq.m</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="py-3 px-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">RM</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                    required
                    className="text-right pl-10"
                  />
                </div>
              </TableCell>
              <TableCell className="py-3 px-4 text-right font-medium">
                RM {item.amount.toFixed(2)}
              </TableCell>
              <TableCell className="py-3 px-4 text-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 hover:text-red-700"
                  disabled={items.length <= 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
