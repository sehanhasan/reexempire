
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Appointment, Staff } from "@/types/database";
import { appointmentService, staffService } from "@/services";
import { AppointmentDetailsDialog } from "@/components/appointments/AppointmentDetailsDialog";
import { format, parseISO, isToday, isBefore, differenceInDays } from "date-fns";
import { Calendar as CalendarIcon, Clock, User, Check, X, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

export default function StaffSchedule() {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<"day" | "upcoming">("day");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const { profile } = useAuth();

  // Fetch appointments and staff data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // First fetch the staff member associated with this profile
        if (!profile || !profile.staff_id) {
          toast({
            title: "Error",
            description: "Your account is not linked to a staff member. Please contact an administrator.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        
        // Fetch appointments for this staff member only
        const appointmentsData = await appointmentService.getAppointmentsByStaffId(profile.staff_id);
        setAppointments(appointmentsData);
        
        // Fetch staff information
        const staffData = await staffService.getById(profile.staff_id);
        setStaffMembers(staffData ? [staffData] : []);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load schedule data. Please try again.",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [profile]);

  // Filter appointments based on selected date and view
  const filteredAppointments = appointments.filter(appointment => {
    if (view === "day") {
      return appointment.appointment_date === format(date, "yyyy-MM-dd");
    }
    
    // For "upcoming" view, show all future appointments
    const appointmentDate = parseISO(appointment.appointment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return !isBefore(appointmentDate, today) || isToday(appointmentDate);
  }).sort((a, b) => {
    // Sort by date first
    const dateA = a.appointment_date;
    const dateB = b.appointment_date;
    
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }
    
    // Then sort by start time
    return a.start_time.localeCompare(b.start_time);
  });

  const getStaffName = (staffId: string | null | undefined) => {
    if (!staffId) return "Unassigned";
    const staff = staffMembers.find(s => s.id === staffId);
    return staff ? staff.name : "Unknown";
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "rescheduled":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getDaysSinceOrUntil = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appointmentDate = parseISO(dateString);
    const days = differenceInDays(appointmentDate, today);
    
    if (days === 0) {
      return "Today";
    } else if (days === 1) {
      return "Tomorrow";
    } else if (days === -1) {
      return "Yesterday";
    } else if (days > 0) {
      return `In ${days} days`;
    } else {
      return `${Math.abs(days)} days ago`;
    }
  };

  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader 
        title="My Schedule" 
      />
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className={`${isMobile ? 'w-full' : 'w-80'} mb-4`}>
          <Card>
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
          
          <div className="mt-4">
            <Tabs defaultValue="day" onValueChange={(v) => setView(v as "day" | "upcoming")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="day">Daily View</TabsTrigger>
                <TabsTrigger value="upcoming">All Upcoming</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="text-xl font-bold mb-4">
            {view === "day" ? (
              <span className="flex items-center">
                <CalendarIcon className="mr-2 h-5 w-5" />
                {format(date, "MMMM d, yyyy")}
                {isToday(date) && <Badge className="ml-2 bg-blue-500">Today</Badge>}
              </span>
            ) : (
              <span className="flex items-center">
                <CalendarIcon className="mr-2 h-5 w-5" />
                All Upcoming Appointments
              </span>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-16 px-4 border rounded-lg bg-gray-50">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No appointments found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {view === "day" 
                  ? `You have no appointments scheduled for ${format(date, "MMMM d, yyyy")}.`
                  : "You have no upcoming appointments scheduled."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <Card key={appointment.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="p-4 md:p-5 flex-1">
                        <div className="mb-3">
                          <Badge className={`${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </Badge>
                          {view === "upcoming" && (
                            <Badge variant="outline" className="ml-2">
                              {getDaysSinceOrUntil(appointment.appointment_date)}
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-semibold truncate mb-1">{appointment.title}</h3>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{format(parseISO(`2000-01-01T${appointment.start_time}`), "h:mm a")} - {format(parseISO(`2000-01-01T${appointment.end_time}`), "h:mm a")}</span>
                          </div>
                          
                          {appointment.location && (
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{appointment.location}</span>
                            </div>
                          )}
                          
                          {view === "upcoming" && (
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{format(parseISO(appointment.appointment_date), "MMMM d, yyyy")}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4">
                          <Button 
                            onClick={() => handleViewAppointment(appointment)}
                            variant="outline" 
                            size="sm"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {selectedAppointment && (
        <AppointmentDetailsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          appointment={selectedAppointment}
          staffName={getStaffName(selectedAppointment.staff_id)}
          readOnly={true}
        />
      )}
    </>
  );
}
