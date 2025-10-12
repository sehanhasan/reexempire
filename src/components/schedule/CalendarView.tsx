import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { AppointmentDetailsDialog } from "@/components/appointments/AppointmentDetailsDialog";
import { supabase } from "@/integrations/supabase/client";

interface CalendarViewProps {
  appointments: any[];
  onEdit: (appointment: any) => void;
  onMarkAsCompleted: (appointment: any) => void;
  onMarkAsInProgress: (appointment: any) => void;
}

export function CalendarView({ appointments, onEdit, onMarkAsCompleted, onMarkAsInProgress }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [appointmentRatings, setAppointmentRatings] = useState<Record<string, any>>({});

  // Fetch ratings for all completed appointments
  useEffect(() => {
    const fetchRatings = async () => {
      const completedAppointments = appointments.filter(
        app => app.status?.toLowerCase() === 'completed'
      );
      
      if (completedAppointments.length === 0) return;
      
      const { data } = await supabase
        .from('appointment_ratings')
        .select('*')
        .in('appointment_id', completedAppointments.map(app => app.id));
      
      if (data) {
        const ratingsMap: Record<string, any> = {};
        data.forEach(rating => {
          ratingsMap[rating.appointment_id] = rating;
        });
        setAppointmentRatings(ratingsMap);
      }
    };
    
    fetchRatings();
  }, [appointments]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter(appointment => 
      isSameDay(new Date(appointment.appointment_date), day)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold text-gray-800">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dayAppointments = getAppointmentsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={idx}
                className={`min-h-[120px] border-b border-r p-2 ${
                  !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                } ${idx % 7 === 6 ? 'border-r-0' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-sm font-medium ${
                      isToday
                        ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center'
                        : isCurrentMonth
                        ? 'text-gray-900'
                        : 'text-gray-400'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayAppointments.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {dayAppointments.length}
                    </Badge>
                  )}
                </div>

                {/* Appointments for this day */}
                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map((appointment) => {
                    const rating = appointmentRatings[appointment.id];
                    return (
                      <div
                        key={appointment.id}
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setIsDialogOpen(true);
                        }}
                        className={`text-xs p-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity border ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        <div className="font-medium truncate">{appointment.title}</div>
                        <div className="flex items-center gap-1 text-[10px] mt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>{appointment.start_time?.slice(0, 5)}</span>
                        </div>
                        {appointment.customer?.name && (
                          <div className="truncate text-[10px] mt-0.5">
                            {appointment.customer.name}
                          </div>
                        )}
                        {rating && appointment.status?.toLowerCase() === 'completed' && (
                          <div className="flex items-center gap-0.5 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-2.5 w-2.5 ${
                                  star <= rating.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-gray-500 text-center py-1">
                      +{dayAppointments.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedAppointment && (
        <AppointmentDetailsDialog
          appointment={selectedAppointment}
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          customer={selectedAppointment.customer || null}
          assignedStaff={selectedAppointment.staff || null}
          rating={appointmentRatings[selectedAppointment.id] || null}
          onMarkAsCompleted={onMarkAsCompleted}
          onMarkAsInProgress={onMarkAsInProgress}
        />
      )}
    </div>
  );
}
