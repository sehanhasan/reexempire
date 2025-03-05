
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { ArrowLeft, Save, Calendar } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { appointmentService } from "@/services/appointmentService";
import { customerService } from "@/services";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AddAppointment() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [title, setTitle] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Confirmed");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  
  // Fetch customers and staff
  useEffect(() => {
    const fetchData = async () => {
      try {
        const customerData = await customerService.getAll();
        setCustomers(customerData);
        
        const staffData = await fetch('/api/staff').then(res => res.json());
        setStaffMembers(staffData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load required data.",
          variant: "destructive"
        });
      }
    };
    
    fetchData();
  }, []);
  
  const handleStaffSelect = (staffId: string) => {
    if (selectedStaff.includes(staffId)) {
      setSelectedStaff(selectedStaff.filter(id => id !== staffId));
    } else {
      setSelectedStaff([...selectedStaff, staffId]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !customerId || !date || !startTime || !endTime) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create appointment object
      const appointmentData = {
        title,
        customer_id: customerId,
        appointment_date: date,
        start_time: startTime,
        end_time: endTime,
        notes,
        status,
        staff_id: selectedStaff[0] // For now, just use the first selected staff member
      };
      
      // Save to database
      await appointmentService.create(appointmentData);
      
      toast({
        title: "Appointment Added",
        description: "The appointment has been scheduled successfully."
      });
      
      // Update localStorage for demo purpose (will be replaced by database in production)
      const storedEvents = localStorage.getItem('scheduleEvents');
      let events = storedEvents ? JSON.parse(storedEvents) : {};
      
      if (!events[date]) {
        events[date] = [];
      }
      
      // Add the new event
      const newEvent = {
        id: Math.random().toString(36).substring(2, 9),
        title,
        customer: customers.find(c => c.id === customerId)?.name || "Unknown",
        staff: selectedStaff.map(staffId => {
          const staff = staffMembers.find(s => s.id === staffId);
          return staff ? staff.name : "Unknown";
        }),
        start: startTime,
        end: endTime,
        status
      };
      
      events[date].push(newEvent);
      
      // Save back to localStorage
      localStorage.setItem('scheduleEvents', JSON.stringify(events));
      
      navigate("/schedule");
    } catch (error) {
      console.error("Error saving appointment:", error);
      toast({
        title: "Error",
        description: "Failed to save the appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="page-container">
      <PageHeader
        title="Add Appointment"
        description="Schedule a new appointment or service visit."
        actions={
          <Button variant="outline" onClick={() => navigate("/schedule")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Schedule
          </Button>
        }
      />
      
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <Card>
          <CardHeader className={isMobile ? "hidden" : ""}>
            <CardTitle>Appointment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title/Service</Label>
              <Input 
                id="title" 
                placeholder="e.g. Kitchen Consultation" 
                required 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <Select required value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{c.unit_number || "No Unit"}</span>
                          <span className="text-xs text-muted-foreground">{c.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          <CardHeader className={isMobile ? "hidden" : ""}>
            <CardTitle>Assigned Staff</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {staffMembers.map(staff => (
                <label key={staff.id} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-muted">
                  <input 
                    type="checkbox" 
                    checked={selectedStaff.includes(staff.id)}
                    onChange={() => handleStaffSelect(staff.id)}
                    className="h-4 w-4 accent-blue-600" 
                  />
                  <div>
                    <p className="text-sm font-medium">{staff.name}</p>
                    <p className="text-xs text-muted-foreground">{staff.position}</p>
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className={isMobile ? "hidden" : ""}>
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
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Saving..." : "Save Appointment"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
