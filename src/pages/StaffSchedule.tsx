
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/common/Spinner";
import { Card, CardContent } from "@/components/ui/card";
import { appointmentService, staffService } from "@/services";
import { Appointment, Staff } from "@/types/database";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { CalendarClock, User } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { AppointmentDetailsDialog } from "@/components/appointments/AppointmentDetailsDialog";

export default function StaffSchedule() {
  const { profile, isLoading: authLoading } = useAuth();
  const [staffData, setStaffData] = useState<Staff | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // Load staff data and appointments
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (profile?.staff_id) {
          setIsLoading(true);
          // Fetch staff data and appointments
          const staffInfo = await staffService.getById(profile.staff_id);
          setStaffData(staffInfo);
          
          // Fetch appointments for this staff member
          const appointments = await appointmentService.getAppointmentsByStaffId(profile.staff_id);
          setAppointments(appointments);
        } else {
          // Staff profile not linked to a staff record
          toast({
            title: "Profile not linked",
            description: "Your user profile is not linked to a staff record. Please contact an administrator.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error fetching staff schedule:", error);
        toast({
          title: "Error",
          description: "Failed to load your schedule. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!authLoading && profile) {
      fetchData();
    }
  }, [profile, authLoading]);
  
  // Group appointments by date
  const appointmentsByDate = appointments.reduce((acc, appointment) => {
    const date = appointment.appointment_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(appointment);
    return acc;
  }, {} as Record<string, Appointment[]>);
  
  // Sort the dates
  const sortedDates = Object.keys(appointmentsByDate).sort();
  
  const viewAppointmentDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetails(true);
  };
  
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (!profile?.staff_id) {
    return (
      <div className="page-container">
        <PageHeader title="My Schedule" />
        
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <User className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Profile Not Linked</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Your user account is not linked to a staff record.
                Please contact an administrator to link your account.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="page-container">
      <PageHeader title="My Schedule" />
      
      <div className="flex flex-col space-y-2 mt-6">
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-grow">
                <h3 className="text-lg font-semibold">{staffData?.name || profile.full_name}</h3>
                <p className="text-gray-500">{staffData?.position || "Staff Member"}</p>
              </div>
              <div className="flex items-center space-x-2">
                <CalendarClock className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">{appointments.length} Appointments</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {sortedDates.length > 0 ? (
          sortedDates.map(date => (
            <div key={date} className="space-y-2">
              <h3 className="font-medium text-gray-700 mb-2">
                {format(parseISO(date), "EEEE, MMMM d, yyyy")}
              </h3>
              
              {appointmentsByDate[date].map(appointment => (
                <Card key={appointment.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                      <div className="flex-grow">
                        <div className="font-medium">{appointment.title}</div>
                        <div className="text-sm text-gray-500">
                          {appointment.start_time.substring(0, 5)} - 
                          {appointment.end_time.substring(0, 5)}
                        </div>
                        {appointment.location && (
                          <div className="text-sm text-gray-500 mt-1">
                            {appointment.location}
                          </div>
                        )}
                      </div>
                      <div>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => viewAppointmentDetails(appointment)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <CalendarClock className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No Appointments</h3>
                <p className="text-gray-500">
                  You don't have any appointments scheduled.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {selectedAppointment && (
        <AppointmentDetailsDialog 
          open={showAppointmentDetails}
          onClose={() => setShowAppointmentDetails(false)}
          onOpenChange={setShowAppointmentDetails}
          appointment={selectedAppointment}
          staffName={staffData?.name || ""}
          readOnly={true}
        />
      )}
    </div>
  );
}
