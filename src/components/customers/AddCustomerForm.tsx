import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { customerService } from "@/services";
interface AddCustomerFormProps {
  onSuccess?: () => void;
  isModal?: boolean;
}
export default function AddCustomerForm({
  onSuccess,
  isModal = false
}: AddCustomerFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const customerId = queryParams.get('id');
  const isEditing = !!customerId;
  const [customerType, setCustomerType] = useState("individual");
  const [name, setName] = useState("");
  const [residence, setResidence] = useState("Star Residences ONE");
  const [unitNumber, setUnitNumber] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [ssm, setSsm] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);

  // Fetch customer data if editing
  useEffect(() => {
    if (customerId) {
      const fetchCustomer = async () => {
        try {
          setIsLoading(true);
          const customer = await customerService.getById(customerId);
          if (customer) {
            setCustomerType(customer.name.includes("Sdn Bhd") || customer.name.includes("Berhad") || customer.name.includes("(M)") ? "company" : "individual");
            setName(customer.name);
            setUnitNumber(customer.unit_number || "");
            setWhatsapp(customer.phone ? customer.phone.replace(/^\+60/, "") : "");
            setEmail(customer.email || "");
            setResidence(customer.address || "Star Residences ONE");
            setNotes(customer.notes || "");
          }
          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching customer:", error);
          toast({
            title: "Error",
            description: "Failed to load customer details.",
            variant: "destructive"
          });
          setIsLoading(false);
        }
      };
      fetchCustomer();
    }
  }, [customerId]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !unitNumber || !whatsapp) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    try {
      setIsSubmitting(true);
      const customer = {
        name: customerType === "company" ? name : name,
        unit_number: unitNumber,
        phone: whatsapp,
        email: email || null,
        notes: notes || null,
        address: residence || null,
        city: null,
        state: null,
        postal_code: null
      };
      if (isEditing && customerId) {
        await customerService.update(customerId, customer);
        toast({
          title: "Customer Updated",
          description: "The customer has been updated successfully."
        });
      } else {
        await customerService.create(customer);
        toast({
          title: "Customer Added",
          description: "The customer has been added successfully."
        });
      }
      if (onSuccess) {
        onSuccess();
      } else if (!isModal) {
        navigate("/customers");
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      toast({
        title: "Error",
        description: `There was an error ${isEditing ? 'updating' : 'adding'} the customer. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isLoading) {
    return <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading customer data...</span>
      </div>;
  }
  return <form onSubmit={handleSubmit} className="space-y-6">
        <CardContent className="pt-6 space-y-4">
          {/* <div className="space-y-2">
            
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input type="radio" name="customerType" value="individual" checked={customerType === "individual"} onChange={() => setCustomerType("individual")} className="h-4 w-4 accent-blue-600" />
                <span className="text-sm">Individual</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input type="radio" name="customerType" value="company" checked={customerType === "company"} onChange={() => setCustomerType("company")} className="h-4 w-4 accent-blue-600" />
                <span className="text-sm">Company</span>
              </label>
            </div>
          </div> */}
          
          {customerType === "individual" ? <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={name} onChange={e => setName(e.target.value)} required />
            </div> : <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" value={name} onChange={e => setName(e.target.value)} required />
            </div>}
          
          <div className="space-y-2">
            <Label htmlFor="unitNumber">Unit #</Label>
            <Input id="unitNumber" placeholder="e.g. X-XX-XX" value={unitNumber} onChange={e => setUnitNumber(e.target.value)} required />
            <p className="text-xs text-muted-foreground">Format: X-XX-XX</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="residence">Location</Label>
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
            <Input id="whatsapp" placeholder="e.g. +60123456789" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required />
            <p className="text-xs text-muted-foreground">Enter full number including country code if not Malaysian</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address (Optional)</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          
          {customerType === "company" && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ssm">SSM Registration No.</Label>
                <Input id="ssm" placeholder="e.g. 1234567-A" value={ssm} onChange={e => setSsm(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input id="contactPerson" value={contactPerson} onChange={e => setContactPerson(e.target.value)} />
              </div>
            </div>}
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" placeholder="Enter any additional notes about this customer..." rows={4} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-4">
          {!isModal && <Button variant="outline" type="button" onClick={() => navigate("/customers")}>
              Cancel
            </Button>}
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isEditing ? 'Update Customer' : 'Save Customer'}
          </Button>
        </CardFooter>
    </form>;
}