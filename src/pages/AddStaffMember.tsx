import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardTitle, CardDescription, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { staffService } from "@/services";
import { Staff } from "@/types/database";
import { useIsMobile } from "@/hooks/use-mobile";
export default function AddStaffMember() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const staffId = searchParams.get("id");
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [staffData, setStaffData] = useState<Partial<Staff>>({
    first_name: "",
    last_name: "",
    passport: "",
    phone: "",
    join_date: new Date().toISOString().split("T")[0],
    status: "Active"
  });
  useEffect(() => {
    if (staffId) {
      setIsEdit(true);
      fetchStaffMember(staffId);
    }
  }, [staffId]);
  const fetchStaffMember = async (id: string) => {
    try {
      setIsLoading(true);
      const data = await staffService.getById(id);
      if (data) {
        setStaffData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          passport: data.passport || "",
          phone: data.phone || "",
          join_date: data.join_date || new Date().toISOString().split("T")[0],
          status: data.status || "Active"
        });
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching staff member:", error);
      toast({
        title: "Error",
        description: "Failed to load staff member details",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };
  const handleChange = (field: string, value: string) => {
    setStaffData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      // Validate required fields
      if (!staffData.first_name || !staffData.last_name) {
        toast({
          title: "Error",
          description: "First name and last name are required",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Format the data for the API
      const formattedData: Partial<Staff> = {
        name: `${staffData.first_name} ${staffData.last_name}`,
        first_name: staffData.first_name,
        last_name: staffData.last_name,
        passport: staffData.passport,
        role: "Staff",
        // Default role
        join_date: staffData.join_date,
        phone: staffData.phone,
        status: staffData.status
      };
      if (isEdit) {
        await staffService.update(staffId!, formattedData);
        toast({
          title: "Staff Updated",
          description: "The staff member has been updated successfully."
        });
      } else {
        await staffService.create(formattedData);
        toast({
          title: "Staff Added",
          description: "The staff member has been added successfully."
        });
      }
      setIsLoading(false);
      navigate("/staff");
    } catch (error) {
      console.error("Error saving staff member:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEdit ? "update" : "add"} staff member. Please try again.`,
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };
  return <div className={`${isMobile ? 'page-container' : 'mt-6'}`}>
      
      <form onSubmit={handleSubmit} className="mt-2 space-y-6">
        <Card>
            <CardHeader>
              <CardTitle className="text-lg text-cyan-600">Staff Information</CardTitle>
            </CardHeader>
          <CardContent className="space-y-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={staffData.first_name} onChange={e => handleChange("first_name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={staffData.last_name} onChange={e => handleChange("last_name", e.target.value)} required />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="passport">Passport #</Label>
                <Input id="passport" placeholder="e.g. A12345678" value={staffData.passport} onChange={e => handleChange("passport", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="joinDate">Join Date</Label>
                <Input id="joinDate" type="date" value={staffData.join_date} onChange={e => handleChange("join_date", e.target.value)} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={staffData.status} onValueChange={value => handleChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Setting status to Inactive will ban user from logging in</p>
              </div> */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="e.g. 012-3456789" value={staffData.phone} onChange={e => handleChange("phone", e.target.value)} required />
                <p className="text-xs text-muted-foreground">Malaysian phone format: 01X-XXXXXXX</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-4">
            <Button variant="outline" type="button" onClick={() => navigate("/staff")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? 'Saving...' : isEdit ? 'Update Staff' : 'Save Staff'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>;
}