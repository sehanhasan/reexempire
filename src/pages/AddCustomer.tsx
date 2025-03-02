
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ArrowLeft, Save, User } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function AddCustomer() {
  const navigate = useNavigate();
  const [customerType, setCustomerType] = useState("individual");
  const [residence, setResidence] = useState("Star Residences ONE");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would save to the database
    toast({
      title: "Customer Added",
      description: "The customer has been added successfully."
    });
    
    navigate("/customers");
  };
  
  return (
    <div className="page-container">
      <PageHeader
        title="Add Customer"
        description="Add a new customer to the system."
        actions={
          <Button variant="outline" onClick={() => navigate("/customers")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Button>
        }
      />
      
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Customer Type</Label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="customerType"
                    value="individual"
                    checked={customerType === "individual"}
                    onChange={() => setCustomerType("individual")}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <span className="text-sm">Individual</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="customerType"
                    value="company"
                    checked={customerType === "company"}
                    onChange={() => setCustomerType("company")}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <span className="text-sm">Company</span>
                </label>
              </div>
            </div>
            
            {customerType === "individual" ? (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" required />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" required />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="unitNumber">Unit #</Label>
              <Input id="unitNumber" placeholder="e.g. X-XX-XX" required />
              <p className="text-xs text-muted-foreground">Format: X-XX-XX</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="residence">Residence</Label>
              <Select value={residence} onValueChange={setResidence}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Star Residences ONE">Star Residences ONE</SelectItem>
                  <SelectItem value="Star Residences TWO">Star Residences TWO</SelectItem>
                  <SelectItem value="Star Residences THREE">Star Residences THREE</SelectItem>
                  <SelectItem value="Ascott">Ascott</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                  +60
                </span>
                <Input 
                  id="whatsapp" 
                  className="rounded-l-none"
                  placeholder="e.g. 123456789"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">Malaysian number without leading 0</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address (Optional)</Label>
              <Input id="email" type="email" />
            </div>
            
            {customerType === "company" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ssm">SSM Registration No.</Label>
                  <Input id="ssm" placeholder="e.g. 1234567-A" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input id="contactPerson" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Enter any additional notes about this customer..."
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-4">
            <Button variant="outline" type="button" onClick={() => navigate("/customers")}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              Save Customer
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
