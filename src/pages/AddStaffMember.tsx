import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { staffService } from "@/services";
import { Staff } from "@/types/database";

export default function AddStaffMember() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const staffId = searchParams.get("id");
  const [isLoading, setIsLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [showPassword, setShowPassword] = useState(!staffId); // Show password field for new staff
  const [staffData, setStaffData] = useState<Partial<Staff>>({
    first_name: "",
    last_name: "",
    passport: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    role: "Staff" as "Staff" | "Manager" | "Admin",
    join_date: new Date().toISOString().split("T")[0],
    address: "",
    city: "",
    state: "Selangor",
    postal_code: "",
    password: "",
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
          email: data.email || "",
          phone: data.phone || "",
          position: data.position || "",
          department: data.department || "",
          role: data.role || "Staff",
          join_date: data.join_date || new Date().toISOString().split("T")[0],
          address: data.address || "",
          city: data.city || "",
          state: data.state || "Selangor",
          postal_code: data.postal_code || "",
          password: "",
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

      // Format the data for the API
      const formattedData: Partial<Staff> = {
        name: `${staffData.first_name} ${staffData.last_name}`,
        first_name: staffData.first_name,
        last_name: staffData.last_name,
        passport: staffData.passport,
        role: staffData.role as "Staff" | "Manager" | "Admin",
        join_date: staffData.join_date,
        email: staffData.email,
        phone: staffData.phone,
        address: staffData.address,
        city: staffData.city,
        state: staffData.state,
        postal_code: staffData.postal_code,
        status: staffData.status,
        position: staffData.position,
        department: staffData.department
      };

      // Add password only if it's provided
      if (staffData.password) {
        formattedData.password = staffData.password;
      }

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

  return <div className="page-container">
      <PageHeader title={isEdit ? "Edit Staff Member" : "Add Staff Member"} actions={<Button variant="outline" onClick={() => navigate("/staff")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Staff
          </Button>} />
      
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={staffData.role} 
                  onValueChange={(value: "Staff" | "Manager" | "Admin") => handleChange("role", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Staff">Staff</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Staff: Limited access | Manager: Schedule management | Admin: Full access
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Join Date</Label>
                <Input id="joinDate" type="date" value={staffData.join_date} onChange={e => handleChange("join_date", e.target.value)} required />
              </div>
              <div className="space-y-2">
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
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={staffData.email} onChange={e => handleChange("email", e.target.value)} required />
                <p className="text-xs text-muted-foreground">Will be used for login</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="e.g. 012-3456789" value={staffData.phone} onChange={e => handleChange("phone", e.target.value)} />
                <p className="text-xs text-muted-foreground">Malaysian phone format: 01X-XXXXXXX</p>
              </div>
            </div>
            
            {(showPassword || !isEdit) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={staffData.password} 
                    onChange={e => handleChange("password", e.target.value)} 
                    required={!isEdit}
                  />
                  <p className="text-xs text-muted-foreground">
                    {isEdit ? "Leave empty to keep current password" : "Must be at least 6 characters"}
                  </p>
                </div>
                {isEdit && (
                  <div className="flex items-end">
                    <Button type="button" variant="outline" className="mb-2" onClick={() => setShowPassword(false)}>
                      Cancel Password Change
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {isEdit && !showPassword && (
              <div>
                <Button type="button" variant="outline" onClick={() => setShowPassword(true)}>
                  Reset Password
                </Button>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input id="position" placeholder="e.g. Project Manager" value={staffData.position} onChange={e => handleChange("position", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" placeholder="e.g. Operations" value={staffData.department} onChange={e => handleChange("department", e.target.value)} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={staffData.address} onChange={e => handleChange("address", e.target.value)} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={staffData.city} onChange={e => handleChange("city", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" value={staffData.state} onChange={e => handleChange("state", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input id="postalCode" value={staffData.postal_code} onChange={e => handleChange("postal_code", e.target.value)} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-4">
            <Button variant="outline" type="button" onClick={() => navigate("/staff")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? 'Saving...' : isEdit ? 'Update Staff Member' : 'Save Staff Member'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>;
}
