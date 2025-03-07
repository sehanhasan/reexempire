
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Card,
  CardContent,
  CardDescription,
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
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { staffService } from "@/services";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Staff } from "@/types/database";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

// Define form validation schema
const staffFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  position: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  join_date: z.string().min(1, "Join date is required"),
  status: z.enum(["Active", "On Leave", "Inactive"]),
  department: z.string().optional(),
  employment_type: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  passport: z.string().optional(),
  username: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  emergency_contact_email: z.string().email("Invalid email address").optional().or(z.literal(""))
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

export default function EditStaffMember() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isNew, setIsNew] = useState(!id);
  
  // Set up React Hook Form with zod validation
  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: "",
      position: "",
      email: "",
      phone: "",
      status: "Active" as const,
      join_date: format(new Date(), "yyyy-MM-dd"),
      department: "",
      employment_type: "",
      gender: "",
      address: "",
      city: "",
      state: "",
      postal_code: "",
      passport: "",
      username: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      emergency_contact_relationship: "",
      emergency_contact_email: ""
    }
  });
  
  // Fetch staff data if editing existing record
  const { isLoading: isLoadingStaff } = useQuery({
    queryKey: ["staff", id],
    queryFn: () => staffService.getById(id as string),
    enabled: !!id,
    meta: {
      onSettled: (data, error) => {
        if (error) {
          toast({
            title: "Error",
            description: "Failed to load staff details.",
            variant: "destructive",
          });
        } else if (data) {
          const joinDate = data.join_date ? format(new Date(data.join_date), "yyyy-MM-dd") : "";
          
          // Set form values from fetched data
          form.reset({
            name: data.name || "",
            position: data.position || "",
            email: data.email || "",
            phone: data.phone || "",
            status: (data.status as "Active" | "On Leave" | "Inactive") || "Active",
            join_date: joinDate,
            department: data.department || "",
            employment_type: data.employment_type || "",
            gender: data.gender || "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "",
            postal_code: data.postal_code || "",
            passport: data.passport || "",
            username: data.username || "",
            emergency_contact_name: data.emergency_contact_name || "",
            emergency_contact_phone: data.emergency_contact_phone || "",
            emergency_contact_relationship: data.emergency_contact_relationship || "",
            emergency_contact_email: data.emergency_contact_email || ""
          });
        }
      }
    }
  });
  
  // Handle form submission
  const onSubmit = async (data: StaffFormValues) => {
    try {
      setLoading(true);
      
      // Format the data
      const staffData = {
        ...data
      };
      
      let result;
      if (isNew) {
        // Create new staff member
        result = await staffService.create(staffData);
        toast({
          title: "Success",
          description: "Staff member created successfully.",
        });
      } else {
        // Update existing staff member
        result = await staffService.update(id!, staffData);
        toast({
          title: "Success", 
          description: "Staff member updated successfully."
        });
      }
      
      setLoading(false);
      navigate("/staff");
    } catch (error) {
      console.error("Error saving staff:", error);
      setLoading(false);
      toast({
        title: "Error",
        description: `Failed to ${isNew ? "create" : "update"} staff member.`,
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="page-container">
      <PageHeader 
        title={isNew ? "Add Staff Member" : "Edit Staff Member"} 
        description={isNew ? "Add a new staff member to your team" : "Update staff member information"}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/staff")}>
              Cancel
            </Button>
          </div>
        }
      />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Personal Information */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Basic information about the staff member
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="join_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Join Date*</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Project Manager" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Operations" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="employment_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employment Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select employment type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Full-Time">Full-Time</SelectItem>
                            <SelectItem value="Part-Time">Part-Time</SelectItem>
                            <SelectItem value="Contract">Contract</SelectItem>
                            <SelectItem value="Freelance">Freelance</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="passport"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passport #</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter passport number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter username for login" {...field} />
                        </FormControl>
                        <FormDescription>
                          Will be used for staff login
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Status & Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Status & Contact</CardTitle>
                <CardDescription>
                  Current status and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="On Leave">On Leave</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. +60123456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            {/* Address Information */}
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Address</CardTitle>
                <CardDescription>
                  Residential address information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter street address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter city" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter state/province" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter postal code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Emergency Contact */}
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
                <CardDescription>
                  Person to contact in case of emergency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emergency_contact_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="emergency_contact_relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Spouse, Parent, Sibling" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="emergency_contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Contact phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="emergency_contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Contact email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 border-t px-6 py-4">
                <Button variant="outline" type="button" onClick={() => navigate("/staff")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : (isNew ? "Add Staff Member" : "Update Staff Member")}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}
