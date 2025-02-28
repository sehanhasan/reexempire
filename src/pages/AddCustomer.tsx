
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" required />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" required />
              </div>
            )}
            
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
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  placeholder="e.g. 012-3456789"
                  required
                />
                <p className="text-xs text-muted-foreground">Malaysian phone format: 01X-XXXXXXX</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea 
                id="address" 
                rows={3} 
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select defaultValue="Selangor">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Johor">Johor</SelectItem>
                    <SelectItem value="Kedah">Kedah</SelectItem>
                    <SelectItem value="Kelantan">Kelantan</SelectItem>
                    <SelectItem value="Melaka">Melaka</SelectItem>
                    <SelectItem value="Negeri Sembilan">Negeri Sembilan</SelectItem>
                    <SelectItem value="Pahang">Pahang</SelectItem>
                    <SelectItem value="Perak">Perak</SelectItem>
                    <SelectItem value="Perlis">Perlis</SelectItem>
                    <SelectItem value="Pulau Pinang">Pulau Pinang</SelectItem>
                    <SelectItem value="Sabah">Sabah</SelectItem>
                    <SelectItem value="Sarawak">Sarawak</SelectItem>
                    <SelectItem value="Selangor">Selangor</SelectItem>
                    <SelectItem value="Terengganu">Terengganu</SelectItem>
                    <SelectItem value="Kuala Lumpur">Kuala Lumpur</SelectItem>
                    <SelectItem value="Labuan">Labuan</SelectItem>
                    <SelectItem value="Putrajaya">Putrajaya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input id="postalCode" required />
              </div>
            </div>
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
