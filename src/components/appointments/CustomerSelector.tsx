
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Check } from "lucide-react";
import { Customer } from "@/types/database";

export interface CustomerSelectorProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer) => void;
  isLoading: boolean;
}

export function CustomerSelector({ customers, selectedCustomer, onSelectCustomer, isLoading }: CustomerSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.phone && customer.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.unit_number && customer.unit_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog open={true} onOpenChange={() => onSelectCustomer(selectedCustomer!)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Customer</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search customers..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="py-4 text-center text-sm text-gray-500">Loading customers...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-4 text-center text-sm text-gray-500">
              No customers found. Try a different search.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-100 ${
                    selectedCustomer?.id === customer.id ? "bg-blue-50" : ""
                  }`}
                  onClick={() => onSelectCustomer(customer)}
                >
                  <div>
                    <div className="font-medium">
                      {customer.unit_number ? `#${customer.unit_number}` : "No Unit"} 
                    </div>
                    <div className="text-sm">{customer.name}</div>
                    <div className="text-xs text-gray-500">
                      {customer.email || customer.phone || "No contact info"}
                    </div>
                  </div>
                  {selectedCustomer?.id === customer.id && (
                    <Badge className="ml-2 bg-blue-500">
                      <Check className="h-3 w-3 mr-1" />
                      Selected
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onSelectCustomer(selectedCustomer!)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
