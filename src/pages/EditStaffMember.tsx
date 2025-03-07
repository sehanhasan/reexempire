
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  CardTitle
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ArrowLeft, Save, User } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { staffService } from "@/services/staffService";
import { Staff } from "@/types/database";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";

export default function EditStaffMember() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isMobile = useIsMobile();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    email: "",
    phone: "",
    status: "Active",
    join_date: new Date().toISOString().split("T")[0],
    passport: "",
    username: ""
  });
  
  // Fetch staff data
  const { data: staffData, isLoading, error } = useQuery({
    queryKey: ['staff', id],
    queryFn: async () => {
      if (!id) return null;
      return staffService.getById(id);
    },
    enabled: !!id
  });
  
  // Update form data when staff data is loaded
  useEffect(() => {
    if (staffData) {
      setFormData({
        name: staffData.name || "",
        position: staffData.position || "",
        email: staffData.email || "",
        phone: staffData.phone || "",
        status: staffData.status || "Active",
        join_date: staffData.join_date ? new Date(staffData.join_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        passport: staffData.passport || "",
        username: staffData.username || ""
      });
    }
  }, [staffData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Staff name is required",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsProcessing(true);
      
      const staffData = {
        name: formData.name,
        position: formData.position,
        email: formData.email,
        phone: formData.phone,
        status: formData.status,
        join_date: formData.join_date,
        passport: formData.passport,
        username: formData.username
      };
      
      if (id) {
        // Update existing staff
        await staffService.update(id, staffData);
        toast({
          title: "Success",
          description: "Staff member has been updated"
        });
      } else {
        // Create new staff
        await staffService.create(staffData);
        toast({
          title: "Success",
          description: "New staff member has been added"
        });
      }
      
      navigate("/staff");
    } catch (error) {
      console.error("Error saving staff member:", error);
      toast({
        title: "Error",
        description: "Failed to save staff member. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="page-container">Loading staff details...</div>;
  }

  if (error) {
    return <div className="page-container">Error loading staff details. Please try again.</div>;
  }

  return (
    <div className="page-container">
      <PageHeader
        title={id ? "Edit Staff Member" : "Add Staff Member"}
        description="Manage staff information and account details"
        actions={
          <Button variant="outline" onClick={() => navigate("/staff")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Staff
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList>
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="account">Account Details</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={isMobile ? "space-y-4" : "grid grid-cols-2 gap-4"}>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Full name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="passport">Passport #</Label>
                    <Input
                      id="passport"
                      name="passport"
                      value={formData.passport}
                      onChange={handleChange}
                      placeholder="Passport number"
                    />
                  </div>
                </div>

                <div className={isMobile ? "space-y-4" : "grid grid-cols-2 gap-4"}>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email address"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={isMobile ? "space-y-4" : "grid grid-cols-2 gap-4"}>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      placeholder="Job position"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleSelectChange("status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="On Leave">On Leave</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="join_date">Join Date</Label>
                  <Input
                    id="join_date"
                    name="join_date"
                    type="date"
                    value={formData.join_date}
                    onChange={handleChange}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Username for login"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    This username will be used for staff login in the future.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline" 
            onClick={() => navigate("/staff")}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isProcessing}
          >
            <Save className="mr-2 h-4 w-4" />
            {isProcessing ? "Saving..." : "Save Staff Member"}
          </Button>
        </div>
      </form>
    </div>
  );
}
