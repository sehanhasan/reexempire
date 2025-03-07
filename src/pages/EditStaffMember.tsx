import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getStaffMember, updateStaffMember } from "@/services/staffService";
import type { Staff } from "@/types/database";

const EditStaffMember = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [staff, setStaff] = useState<Staff>({
    id: "",
    name: "",
    position: "",
    email: "",
    phone: "",
    status: "active",
    join_date: new Date().toISOString().split("T")[0],
    created_at: "",
    updated_at: "",
    username: "",
    passport: "",
    gender: "male",
    department: "",
    employment_type: "full-time",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    emergency_contact_name: "",
    emergency_contact_relationship: "",
    emergency_contact_phone: "",
    emergency_contact_email: "",
  });

  const { isLoading, error } = useQuery({
    queryKey: ["staff", id],
    queryFn: () => getStaffMember(id as string),
    onSuccess: (data) => {
      if (data) {
        setStaff(data);
      }
    },
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch staff member",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setStaff((prevStaff) => ({
      ...prevStaff,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (id) {
        await updateStaffMember(id, staff);
        toast({
          title: "Success",
          description: "Staff member updated successfully",
        });
        navigate("/staff");
      } else {
        toast({
          title: "Error",
          description: "Staff ID is missing",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update staff member",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Staff Member</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                  Name
                </label>
                <div className="mt-2">
                  <Input
                    type="text"
                    name="name"
                    id="name"
                    value={staff.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="position" className="block text-sm font-medium leading-6 text-gray-900">
                  Position
                </label>
                <div className="mt-2">
                  <Input
                    type="text"
                    name="position"
                    id="position"
                    value={staff.position || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                  Email
                </label>
                <div className="mt-2">
                  <Input
                    type="email"
                    name="email"
                    id="email"
                    value={staff.email || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium leading-6 text-gray-900">
                  Phone
                </label>
                <div className="mt-2">
                  <Input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={staff.phone || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium leading-6 text-gray-900">
                  Status
                </label>
                <div className="mt-2">
                  <Select value={staff.status} onValueChange={(value) => setStaff((prevStaff) => ({ ...prevStaff, status: value }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label htmlFor="join_date" className="block text-sm font-medium leading-6 text-gray-900">
                  Join Date
                </label>
                <div className="mt-2">
                  <Input
                    type="date"
                    name="join_date"
                    id="join_date"
                    value={staff.join_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium leading-6 text-gray-900">
                  Username
                </label>
                <div className="mt-2">
                  <Input
                    type="text"
                    name="username"
                    id="username"
                    value={staff.username || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="passport" className="block text-sm font-medium leading-6 text-gray-900">
                  Passport
                </label>
                <div className="mt-2">
                  <Input
                    type="text"
                    name="passport"
                    id="passport"
                    value={staff.passport || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="gender" className="block text-sm font-medium leading-6 text-gray-900">
                  Gender
                </label>
                <div className="mt-2">
                  <Select value={staff.gender || "male"} onValueChange={(value) => setStaff((prevStaff) => ({ ...prevStaff, gender: value }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label htmlFor="department" className="block text-sm font-medium leading-6 text-gray-900">
                  Department
                </label>
                <div className="mt-2">
                  <Input
                    type="text"
                    name="department"
                    id="department"
                    value={staff.department || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="employment_type" className="block text-sm font-medium leading-6 text-gray-900">
                  Employment Type
                </label>
                <div className="mt-2">
                  <Select value={staff.employment_type || "full-time"} onValueChange={(value) => setStaff((prevStaff) => ({ ...prevStaff, employment_type: value }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select employment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="temporary">Temporary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium leading-6 text-gray-900">
                  Address
                </label>
                <div className="mt-2">
                  <Input
                    type="text"
                    name="address"
                    id="address"
                    value={staff.address || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium leading-6 text-gray-900">
                  City
                </label>
                <div className="mt-2">
                  <Input
                    type="text"
                    name="city"
                    id="city"
                    value={staff.city || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium leading-6 text-gray-900">
                  State
                </label>
                <div className="mt-2">
                  <Input
                    type="text"
                    name="state"
                    id="state"
                    value={staff.state || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="postal_code" className="block text-sm font-medium leading-6 text-gray-900">
                  Postal Code
                </label>
                <div className="mt-2">
                  <Input
                    type="text"
                    name="postal_code"
                    id="postal_code"
                    value={staff.postal_code || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="emergency_contact_name" className="block text-sm font-medium leading-6 text-gray-900">
                  Emergency Contact Name
                </label>
                <div className="mt-2">
                  <Input
                    type="text"
                    name="emergency_contact_name"
                    id="emergency_contact_name"
                    value={staff.emergency_contact_name || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="emergency_contact_relationship" className="block text-sm font-medium leading-6 text-gray-900">
                  Emergency Contact Relationship
                </label>
                <div className="mt-2">
                  <Input
                    type="text"
                    name="emergency_contact_relationship"
                    id="emergency_contact_relationship"
                    value={staff.emergency_contact_relationship || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="emergency_contact_phone" className="block text-sm font-medium leading-6 text-gray-900">
                  Emergency Contact Phone
                </label>
                <div className="mt-2">
                  <Input
                    type="tel"
                    name="emergency_contact_phone"
                    id="emergency_contact_phone"
                    value={staff.emergency_contact_phone || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="emergency_contact_email" className="block text-sm font-medium leading-6 text-gray-900">
                Emergency Contact Email
              </label>
              <div className="mt-2">
                <Input
                  type="email"
                  name="emergency_contact_email"
                  id="emergency_contact_email"
                  value={staff.emergency_contact_email || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <Button type="submit">Update Staff Member</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditStaffMember;
