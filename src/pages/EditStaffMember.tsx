
import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
import { staffService } from "@/services/staffService";

export default function EditStaffMember() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const paramId = searchParams.get("id");
  const staffId = id || paramId;
  const isNew = !staffId;
  
  const [isLoading, setIsLoading] = useState(false);
  const [staffData, setStaffData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    status: "Active",
    join_date: new Date().toISOString().split("T")[0],
    employment_type: "full_time",
    passport: "",
    username: "",
    address: "",
    city: "",
    state: "Selangor",
    postal_code: "",
    emergency_contact_name: "",
    emergency_contact_relationship: "",
    emergency_contact_phone: "",
    emergency_contact_email: ""
  });

  // Fetch staff data if editing existing staff
  useEffect(() => {
    const fetchStaffData = async () => {
      if (!staffId) return;
      
      try {
        setIsLoading(true);
        const data = await staffService.getById(staffId);
        if (data) {
          // Map data from database to form
          setStaffData({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            position: data.position || "",
            department: data.department || "",
            status: data.status || "Active",
            join_date: data.join_date || new Date().toISOString().split("T")[0],
            employment_type: data.employment_type || "full_time",
            passport: data.passport || "",
            username: data.username || "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "Selangor",
            postal_code: data.postal_code || "",
            emergency_contact_name: data.emergency_contact_name || "",
            emergency_contact_relationship: data.emergency_contact_relationship || "",
            emergency_contact_phone: data.emergency_contact_phone || "",
            emergency_contact_email: data.emergency_contact_email || ""
          });
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching staff data:", error);
        toast({
          title: "Error",
          description: "Could not load staff member data. Please try again.",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };
    
    fetchStaffData();
  }, [staffId]);
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setStaffData({
      ...staffData,
      [id]: value
    });
  };
  
  // Handle select changes
  const handleSelectChange = (id, value) => {
    setStaffData({
      ...staffData,
      [id]: value
    });
  };
  
  // Save staff member
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // Prepare data for submission
      const staffPayload = {
        name: staffData.name,
        email: staffData.email,
        phone: staffData.phone,
        position: staffData.position,
        department: staffData.department,
        status: staffData.status,
        join_date: staffData.join_date,
        employment_type: staffData.employment_type,
        passport: staffData.passport,
        username: staffData.username,
        address: staffData.address,
        city: staffData.city,
        state: staffData.state,
        postal_code: staffData.postal_code,
        emergency_contact_name: staffData.emergency_contact_name,
        emergency_contact_relationship: staffData.emergency_contact_relationship,
        emergency_contact_phone: staffData.emergency_contact_phone,
        emergency_contact_email: staffData.emergency_contact_email
      };
      
      let result;
      if (isNew) {
        result = await staffService.create(staffPayload);
        toast({
          title: "Staff Member Added",
          description: "The staff member has been added successfully."
        });
      } else {
        result = await staffService.update(staffId, staffPayload);
        toast({
          title: "Staff Member Updated",
          description: "The staff member has been updated successfully."
        });
      }
      
      setIsLoading(false);
      navigate("/staff");
    } catch (error) {
      console.error("Error saving staff member:", error);
      toast({
        title: "Error",
        description: "There was a problem saving the staff member. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };
  
  return (
    <div className="page-container">
      <PageHeader
        title={isNew ? "Add Staff Member" : "Edit Staff Member"}
        description={isNew ? "Add a new staff member to the team." : "Update staff member details."}
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
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={staffData.name} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passport">Passport #</Label>
                    <Input 
                      id="passport" 
                      value={staffData.passport} 
                      onChange={handleInputChange} 
                      placeholder="e.g. A12345678" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      value={staffData.username} 
                      onChange={handleInputChange} 
                      placeholder="Username for login"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select 
                      value={staffData.gender || "male"} 
                      onValueChange={(value) => handleSelectChange("gender", value)}
                    >
                      <SelectTrigger id="gender">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={staffData.status} 
                      onValueChange={(value) => handleSelectChange("status", value)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="On Leave">On Leave</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
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
                  value={staffData.position || ""} 
                  onValueChange={(value) => handleSelectChange("position", value)}
                  required
                >
                  <SelectTrigger id="position">
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
                  value={staffData.department || ""} 
                  onValueChange={(value) => handleSelectChange("department", value)}
                  required
                >
                  <SelectTrigger id="department">
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
                <Label htmlFor="join_date">Join Date</Label>
                <Input
                  id="join_date"
                  type="date"
                  value={staffData.join_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employment_type">Employment Type</Label>
                <Select 
                  value={staffData.employment_type} 
                  onValueChange={(value) => handleSelectChange("employment_type", value)}
                >
                  <SelectTrigger id="employment_type">
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
                <Input id="employeeId" value={`EMP-${staffId?.substring(0, 4) || "001"}`} disabled />
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
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  value={staffData.phone} 
                  onChange={handleInputChange}
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
                value={staffData.address} 
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  value={staffData.city} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select 
                  value={staffData.state} 
                  onValueChange={(value) => handleSelectChange("state", value)}
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
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input 
                  id="postal_code" 
                  value={staffData.postal_code} 
                  onChange={handleInputChange} 
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
                <Label htmlFor="emergency_contact_name">Contact Name</Label>
                <Input 
                  id="emergency_contact_name" 
                  value={staffData.emergency_contact_name} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                <Input 
                  id="emergency_contact_relationship" 
                  value={staffData.emergency_contact_relationship} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Phone Number</Label>
                <Input 
                  id="emergency_contact_phone" 
                  value={staffData.emergency_contact_phone} 
                  onChange={handleInputChange}
                  placeholder="e.g. 012-3456789"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_email">Email Address</Label>
                <Input 
                  id="emergency_contact_email" 
                  type="email" 
                  value={staffData.emergency_contact_email} 
                  onChange={handleInputChange} 
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
              {isLoading ? "Saving..." : isNew ? "Save Staff Member" : "Update Staff Member"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
