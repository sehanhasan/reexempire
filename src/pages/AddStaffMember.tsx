
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { ArrowLeft, Save, Upload, UserCog } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { staffService } from "@/services";

export default function AddStaffMember() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const staffId = searchParams.get("id");
  const [isLoading, setIsLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const [staffData, setStaffData] = useState({
    first_name: "",
    last_name: "",
    passport: "",
    gender: "male",
    date_of_birth: "",
    username: "",
    position: "",
    department: "",
    join_date: new Date().toISOString().split("T")[0],
    employment_type: "full_time",
    employee_id: "EMP-001",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "Selangor",
    postal_code: "",
    emergency_name: "",
    emergency_relationship: "",
    emergency_phone: "",
    emergency_email: ""
  });

  useEffect(() => {
    if (staffId) {
      setIsEdit(true);
      fetchStaffMember(staffId);
    }
  }, [staffId]);

  const fetchStaffMember = async (id) => {
    try {
      setIsLoading(true);
      const data = await staffService.getById(id);
      if (data) {
        setStaffData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          passport: data.passport || "",
          gender: data.gender || "male",
          date_of_birth: data.date_of_birth || "",
          username: data.username || "",
          position: data.position || "",
          department: data.department || "",
          join_date: data.join_date || new Date().toISOString().split("T")[0],
          employment_type: data.employment_type || "full_time",
          employee_id: data.employee_id || "EMP-001",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "Selangor",
          postal_code: data.postal_code || "",
          emergency_name: data.emergency_contact_name || "",
          emergency_relationship: data.emergency_contact_relationship || "",
          emergency_phone: data.emergency_contact_phone || "",
          emergency_email: data.emergency_contact_email || ""
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

  const handleChange = (field, value) => {
    setStaffData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // Format the data for the API
      const formattedData = {
        name: `${staffData.first_name} ${staffData.last_name}`,
        first_name: staffData.first_name,
        last_name: staffData.last_name,
        passport: staffData.passport,
        gender: staffData.gender,
        date_of_birth: staffData.date_of_birth,
        username: staffData.username,
        position: staffData.position,
        department: staffData.department,
        join_date: staffData.join_date,
        employment_type: staffData.employment_type,
        employee_id: staffData.employee_id,
        email: staffData.email,
        phone: staffData.phone,
        address: staffData.address,
        city: staffData.city,
        state: staffData.state,
        postal_code: staffData.postal_code,
        emergency_contact_name: staffData.emergency_name,
        emergency_contact_relationship: staffData.emergency_relationship,
        emergency_contact_phone: staffData.emergency_phone,
        emergency_contact_email: staffData.emergency_email,
        status: "Active" // Default status
      };
      
      if (isEdit) {
        await staffService.update(staffId, formattedData);
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
  
  return (
    <div className="page-container">
      <PageHeader
        title={isEdit ? "Edit Staff Member" : "Add Staff Member"}
        description={isEdit ? "Update staff member details" : "Add a new staff member to the team."}
        actions={
          <Button variant="outline" onClick={() => navigate("/staff")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Staff
          </Button>
        }
      />
      
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Profile Photo</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="h-32 w-32 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <UserCog className="h-16 w-16 text-blue-500" />
                </div>
                <Button variant="outline" type="button" className="mt-2">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Photo
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={staffData.first_name}
                      onChange={(e) => handleChange("first_name", e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={staffData.last_name}
                      onChange={(e) => handleChange("last_name", e.target.value)}
                      required 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passport">Passport #</Label>
                    <Input 
                      id="passport" 
                      placeholder="e.g. A12345678" 
                      value={staffData.passport}
                      onChange={(e) => handleChange("passport", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select 
                      value={staffData.gender}
                      onValueChange={(value) => handleChange("gender", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input 
                      id="dateOfBirth" 
                      type="date" 
                      value={staffData.date_of_birth}
                      onChange={(e) => handleChange("date_of_birth", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      placeholder="Enter username for login"
                      value={staffData.username}
                      onChange={(e) => handleChange("username", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">This will be used for staff login</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Employment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Select 
                  value={staffData.position}
                  onValueChange={(value) => handleChange("position", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project_manager">Project Manager</SelectItem>
                    <SelectItem value="interior_designer">Interior Designer</SelectItem>
                    <SelectItem value="electrician">Electrician</SelectItem>
                    <SelectItem value="plumber">Plumber</SelectItem>
                    <SelectItem value="carpenter">Carpenter</SelectItem>
                    <SelectItem value="admin">Administrative Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select 
                  value={staffData.department}
                  onValueChange={(value) => handleChange("department", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="management">Management</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="admin">Administration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="joinDate">Join Date</Label>
                <Input
                  id="joinDate"
                  type="date"
                  value={staffData.join_date}
                  onChange={(e) => handleChange("join_date", e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type</Label>
                <Select 
                  value={staffData.employment_type}
                  onValueChange={(value) => handleChange("employment_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input 
                  id="employeeId" 
                  value={staffData.employee_id}
                  onChange={(e) => handleChange("employee_id", e.target.value)}
                  disabled={isEdit} 
                />
              </div>
            </div>
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
                <Input 
                  id="email" 
                  type="email" 
                  value={staffData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  placeholder="e.g. 012-3456789"
                  value={staffData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
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
                value={staffData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city"
                  value={staffData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select 
                  value={staffData.state}
                  onValueChange={(value) => handleChange("state", value)}
                >
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
                <Input 
                  id="postalCode"
                  value={staffData.postal_code}
                  onChange={(e) => handleChange("postal_code", e.target.value)}
                  required 
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyName">Contact Name</Label>
                <Input 
                  id="emergencyName"
                  value={staffData.emergency_name}
                  onChange={(e) => handleChange("emergency_name", e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyRelationship">Relationship</Label>
                <Input 
                  id="emergencyRelationship"
                  value={staffData.emergency_relationship}
                  onChange={(e) => handleChange("emergency_relationship", e.target.value)}
                  required 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Phone Number</Label>
                <Input 
                  id="emergencyPhone" 
                  placeholder="e.g. 012-3456789"
                  value={staffData.emergency_phone}
                  onChange={(e) => handleChange("emergency_phone", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyEmail">Email Address</Label>
                <Input 
                  id="emergencyEmail" 
                  type="email"
                  value={staffData.emergency_email}
                  onChange={(e) => handleChange("emergency_email", e.target.value)}
                />
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
    </div>
  );
}
