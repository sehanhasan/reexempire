
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, MapPin, MoreHorizontal, Check, Edit } from "lucide-react";
import { format, isToday, isTomorrow, isYesterday, isThisWeek, parseISO } from "date-fns";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
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
}

export function ListView({ appointments, onEdit, onMarkAsCompleted }: ListViewProps) {
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

  // Get time range display
  const getTimeDisplay = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`;
  };

  // Format status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case 'scheduled':
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-700">Scheduled</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">{status}</Badge>;
    }
  };

  // Handle appointment click
  const handleAppointmentClick = (appointment: AppointmentWithRelations) => {
    setSelectedAppointment(appointment);
    setDetailsDialogOpen(true);
  };

  // Sort dates in chronological order
  const sortedDates = Object.keys(groupedAppointments).sort();

  return (
    <div className="space-y-6">
      {sortedDates.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No appointments found</p>
          </CardContent>
        </Card>
      ) : (
        sortedDates.map(date => (
          <div key={date} className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-blue-600" />
              {formatDateHeader(date)}
            </h2>
            
            <div className="space-y-2">
              {groupedAppointments[date].map(appointment => (
                <Card 
                  key={appointment.id} 
                  className="border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleAppointmentClick(appointment)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">
                            {getTimeDisplay(appointment.start_time, appointment.end_time)}
                          </span>
                        </div>
                        
                        <h3 className="font-medium">{appointment.title || "Unnamed Service"}</h3>
                        
                        {appointment.customer?.unit_number && (
                          <div className="flex items-center space-x-1 text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm">Unit #{appointment.customer.unit_number}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end">
                        {getStatusBadge(appointment.status)}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              onEdit(appointment);
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {appointment.status.toLowerCase() !== 'completed' && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                onMarkAsCompleted(appointment);
                              }}>
                                <Check className="mr-2 h-4 w-4" />
                                Mark as Completed
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
      
      <AppointmentDetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        appointment={selectedAppointment}
        customer={selectedAppointment?.customer || null}
        assignedStaff={null}
        onMarkAsCompleted={onMarkAsCompleted}
      />
    </div>
  );
}
