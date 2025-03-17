
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, MapPin, Check, Edit, Play } from "lucide-react";
import { format, isToday, isTomorrow, isYesterday, isThisWeek, parseISO, compareDesc } from "date-fns";
import { AppointmentDetailsDialog } from "../appointments/AppointmentDetailsDialog";
import { Appointment, Customer } from "@/types/database";

// Define a local interface for services since it's not in database.ts
interface Service {
  id: string;
  name: string;
  description?: string;
  price?: number;
}
interface AppointmentWithRelations extends Appointment {
  service?: Service;
  customer?: Customer;
}
interface ListViewProps {
  appointments: AppointmentWithRelations[];
  onEdit: (appointment: AppointmentWithRelations) => void;
  onMarkAsCompleted: (appointment: AppointmentWithRelations) => void;
  onMarkAsInProgress: (appointment: AppointmentWithRelations) => void;
}
export function ListView({
  appointments,
  onEdit,
  onMarkAsCompleted,
  onMarkAsInProgress
}: ListViewProps) {
  const [groupedAppointments, setGroupedAppointments] = useState<Record<string, AppointmentWithRelations[]>>({});
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Process and group appointments by date
  useEffect(() => {
    if (!appointments.length) return;
    const grouped: Record<string, AppointmentWithRelations[]> = {};
    appointments.forEach(appointment => {
      const date = appointment.appointment_date.split('T')[0]; // Using appointment_date instead of date
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(appointment);
    });

    // Sort appointments within each group by time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        return a.start_time.localeCompare(b.start_time);
      });
    });
    setGroupedAppointments(grouped);
  }, [appointments]);

  // Format date header
  const formatDateHeader = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return "Today";
    } else if (isTomorrow(date)) {
      return "Tomorrow";
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else if (isThisWeek(date)) {
      return format(date, "EEEE"); // Day name
    }
    return format(date, "EEEE, MMMM d"); // Full date
  };

  // Format time without seconds
  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  // Get time range display
  const getTimeDisplay = (startTime: string, endTime: string) => {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  // Format status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500 text-white">Completed</Badge>;
      case 'in progress':
        return <Badge className="bg-yellow-500 text-white">In Progress</Badge>;  
      case 'scheduled':
      case 'confirmed':
        return <Badge className="bg-blue-500 text-white">Scheduled</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500 text-white">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  // Handle appointment click
  const handleAppointmentClick = (appointment: AppointmentWithRelations) => {
    setSelectedAppointment(appointment);
    setDetailsDialogOpen(true);
  };

  // Sort dates in chronological order - with future dates first
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  const sortedDates = Object.keys(groupedAppointments).sort((a, b) => {
    // First compare if dates are in the future or past
    const aInFuture = a >= today;
    const bInFuture = b >= today;
    
    if (aInFuture && !bInFuture) return -1;
    if (!aInFuture && bInFuture) return 1;
    
    // If both are in the future or both are in the past, sort normally
    return a.localeCompare(b);
  });

  return <div className="space-y-6">
      {sortedDates.length === 0 ? <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No appointments found</p>
          </CardContent>
        </Card> : sortedDates.map(date => <div key={date} className="space-y-3">
            <h2 className="font-semibold flex items-center text-base">
              <Calendar className="mr-2 h-5 w-5 text-blue-600" />
              {formatDateHeader(date)}
            </h2>
            
            <div className="space-y-2">
              {groupedAppointments[date].map(appointment => <Card key={appointment.id} className="border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleAppointmentClick(appointment)}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">
                            {getTimeDisplay(appointment.start_time, appointment.end_time)}
                          </span>
                        </div>
                        
                        <h3 className="font-medium">
                          {appointment.customer?.unit_number && `#${appointment.customer.unit_number} - `}
                          {appointment.title || "Unnamed Service"}
                        </h3>
                      </div>
                      
                      <div>
                        {getStatusBadge(appointment.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>)}
            </div>
          </div>)}
      
      <AppointmentDetailsDialog 
        open={detailsDialogOpen} 
        onClose={() => setDetailsDialogOpen(false)} 
        appointment={selectedAppointment} 
        customer={selectedAppointment?.customer || null} 
        assignedStaff={null} 
        onMarkAsCompleted={onMarkAsCompleted}
        onMarkAsInProgress={onMarkAsInProgress}
      />
    </div>;
}
