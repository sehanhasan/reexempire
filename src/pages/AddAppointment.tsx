import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
import { ArrowLeft, Save, Calendar, User, Check } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { appointmentService, staffService, customerService } from "@/services";
import { CustomerSelector } from "@/components/appointments/CustomerSelector";
import { Customer, Staff } from "@/types/database";

const AddAppointment = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  // Form state
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Confirmed");
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [staffNotes, setStaffNotes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Customer selection
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerSelectorOpen, setIsCustomerSelectorOpen] = useState(false);
  
  // Fetch staff members
  const {
    data: staffData,
    isLoading: isStaffLoading,
    error: staffError,
  } = useQuery({
    queryKey: ["staff"],
    queryFn: staffService.getAll,
  });

  // Fetch customer members
  const {
    data: customersData,
    isLoading: isCustomersLoading,
    error: customersError,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: customerService.getAll,
  });

  // Fetch appointment data when in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchAppointmentData = async () => {
        try {
          setIsLoading(true);
          const appointment = await appointmentService.getById(id);
          
          if (appointment) {
            // Set basic appointment data
            setTitle(appointment.title || "");
            setDate(appointment.appointment_date || new Date().toISOString().split("T")[0]);
            setStartTime(appointment.start_time || "09:00");
            setEndTime(appointment.end_time || "10:00");
            setNotes(appointment.notes || "");
            setStatus(appointment.status || "Confirmed");
            
            // Set staff data
            if (appointment.staff_id) {
              setSelectedStaff([appointment.staff_id]);
            }
            
            // Fetch customer data
            if (appointment.customer_id) {
              const customer = await customerService.getById(appointment.customer_id);
              setSelectedCustomer(customer);
            }
          }
          
          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching appointment data:", error);
          toast({
            title: "Error",
            description: "Failed to load appointment data. Please try again.",
            variant: "destructive"
          });
          setIsLoading(false);
        }
      };
      
      fetchAppointmentData();
    }
  }, [id, isEditMode]);
  
  const toggleStaffSelection = (staffId: string) => {
    if (selectedStaff.includes(staffId)) {
      setSelectedStaff(selectedStaff.filter(id => id !== staffId));
      
      // Create a new object without the removed staff's notes
      const newStaffNotes = { ...staffNotes };
      delete newStaffNotes[staffId];
      setStaffNotes(newStaffNotes);
    } else {
      setSelectedStaff([...selectedStaff, staffId]);
    }
  };
  
  const handleStaffNoteChange = (staffId: string, note: string) => {
    setStaffNotes(prev => ({
      ...prev,
      [staffId]: note
    }));
  };
  
  const handleCustomerChange = (customerId: string) => {
    const customer = customersData?.find((c) => c.id === customerId);
    setSelectedCustomer(customer);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      toast({
        title: "Customer Required",
        description: "Please select a customer for this appointment.",
        variant: "destructive"
      });
      return;
    }
    
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for this appointment.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Prepare the appointment data
      const appointmentData = {
        title,
        customer_id: selectedCustomer.id,
        staff_id: selectedStaff.length > 0 ? selectedStaff[0] : null, // Taking first staff if multiple selected
        appointment_date: date,
        start_time: startTime,
        end_time: endTime,
        status,
        notes: notes || null,
        location: selectedCustomer.address || null,
        description: null, // Adding the missing description field
      };
      
      // Save staff notes in the appointment notes if any
      if (Object.keys(staffNotes).length > 0) {
        const staffNotesText = Object.entries(staffNotes)
          .map(([staffId, note]) => {
            const staffMember = staffData.find((staff: Staff) => staff.id === staffId);
            return `${staffMember?.name || 'Staff'}: ${note}`;
          })
          .join('\n\n');
        
        appointmentData.notes = appointmentData.notes 
          ? `${appointmentData.notes}\n\n--- Staff Notes ---\n${staffNotesText}` 
          : `--- Staff Notes ---\n${staffNotesText}`;
      }
      
      // Save the appointment - create or update
      if (isEditMode) {
        await appointmentService.update(id, appointmentData);
        toast({
          title: "Appointment Updated",
          description: "The appointment has been updated successfully."
        });
      } else {
        await appointmentService.create(appointmentData);
        toast({
          title: "Appointment Added",
          description: "The appointment has been scheduled successfully."
        });
      }
      
      navigate("/schedule");
    } catch (error) {
      console.error("Error saving appointment:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'save'} the appointment. Please try again.`,
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="page-container">
      <PageHeader
        title={isEditMode ? "Edit Appointment" : "Add Appointment"}
        description={isEditMode ? "Update an existing appointment or service visit." : "Schedule a new appointment or service visit."}
        actions={
          <Button variant="outline" onClick={() => navigate("/schedule")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Schedule
          </Button>
        }
      />
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appointment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title/Service</Label>
                <Input 
                  id="title" 
                  placeholder="e.g. Kitchen Consultation" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required 
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer</Label>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => setIsCustomerSelectorOpen(true)}
                    >
                      {selectedCustomer ? (
                        <span className="flex items-center">
                          <Check className="mr-2 h-4 w-4 text-green-500" />
                          {selectedCustomer.unit_number ? `#${selectedCustomer.unit_number} - ` : ""}
                          {selectedCustomer.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          Select a customer
                        </span>
                      )}
                    </Button>
                  </div>
                  {selectedCustomer && (
                    <div className="text-sm text-muted-foreground">
                      {selectedCustomer.phone || selectedCustomer.email || "No contact info"}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Assigned Staff</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingStaff ? (
                <div className="text-center py-4">Loading staff members...</div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {staffData && staffData.map((staff: Staff) => (
                    <div key={staff.id} className="border rounded-md p-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="staff[]"
                          value={staff.id}
                          checked={selectedStaff.includes(staff.id)}
                          onChange={() => toggleStaffSelection(staff.id)}
                          className="h-4 w-4 accent-blue-600"
                          id={`staff-${staff.id}`}
                        />
                        <label 
                          htmlFor={`staff-${staff.id}`}
                          className="flex-1 flex items-center space-x-2 cursor-pointer"
                        >
                          <div>
                            <p className="text-sm font-medium">{staff.name}</p>
                            <p className="text-xs text-muted-foreground">{staff.position || "Staff"}</p>
                          </div>
                        </label>
                      </div>
                      
                      {selectedStaff.includes(staff.id) && (
                        <div className="mt-3 pl-6">
                          <Label htmlFor={`staff-notes-${staff.id}`} className="text-xs">
                            Notes for {staff.name}
                          </Label>
                          <Textarea
                            id={`staff-notes-${staff.id}`}
                            placeholder={`Instructions or notes for ${staff.name}...`}
                            rows={2}
                            className="mt-1 text-sm"
                            value={staffNotes[staff.id] || ''}
                            onChange={(e) => handleStaffNoteChange(staff.id, e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
                  placeholder="Enter any additional details about this appointment..."
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-4">
              <Button variant="outline" type="button" onClick={() => navigate("/schedule")}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                {isEditMode ? "Update Appointment" : "Save Appointment"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}
      
      <CustomerSelector
        customers={customersData || []}
        selectedCustomer={selectedCustomer}
        onSelectCustomer={handleCustomerChange}
        isLoading={isCustomersLoading}
      />
    </div>
  );
};

export default AddAppointment;
