import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardTitle, CardDescription, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { customerService } from "@/services";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();
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
            // Ensure WhatsApp number shows with country code when editing
            setWhatsapp(customer.phone || "");
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
  
  const formatWhatsAppNumber = (number: string) => {
    if (!number) return number;
    
    // Remove all non-numeric characters except +
    let cleaned = number.replace(/[^\d+]/g, '');
    
    // Only add +60 if there's no country code already
    if (cleaned && !cleaned.startsWith('+')) {
      cleaned = '+60' + cleaned;
    }
    
    return cleaned;
  };

  const handleWhatsAppChange = (value: string) => {
    const formatted = formatWhatsAppNumber(value);
    setWhatsapp(formatted);
  };

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
        phone: formatWhatsAppNumber(whatsapp),
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
  return (
    <div className={`${isMobile ? 'page-container' : 'mt-6'}`}>
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-cyan-600">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customerType === "individual" ? (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input id="companyName" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitNumber">Unit #</Label>
                  <Input id="unitNumber" placeholder="e.g. X-XX-XX" value={unitNumber} onChange={e => setUnitNumber(e.target.value)} required />
                  <p className="text-xs text-muted-foreground">Format: X-XX-XX</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number</Label>
                  <Input id="whatsapp" placeholder="e.g. +60123456789" value={whatsapp} onChange={e => handleWhatsAppChange(e.target.value)} required />
                  <p className="text-xs text-muted-foreground">Country code (+60) will be added automatically</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="residence">Location</Label>
                  <Select value={residence} onValueChange={setResidence}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Star Residences One">Star Residences One</SelectItem>
                      <SelectItem value="Star Residences Two">Star Residences Two</SelectItem>
                      <SelectItem value="Star Residences Three">Star Residences Three</SelectItem>
                      <SelectItem value="Star Suites">Star Suites</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {customerType === "company" && (
                  <div className="space-y-2">
                    <Label htmlFor="ssm">SSM Registration No.</Label>
                    <Input id="ssm" placeholder="e.g. 1234567-A" value={ssm} onChange={e => setSsm(e.target.value)} />
                  </div>
                )}
              </div>

              {customerType === "company" && (
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input id="contactPerson" value={contactPerson} onChange={e => setContactPerson(e.target.value)} />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="Enter any additional notes about this customer..." rows={4} value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-4">
              <Button variant="outline" type="button" onClick={() => {
                if (isModal && onSuccess) {
                  onSuccess();
                } else {
                  navigate("/customers");
                }
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditing ? 'Update Customer' : 'Save Customer'}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}
    </div>
  );
}