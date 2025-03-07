import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths } from 'date-fns';

import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { AppointmentDetailsDialog } from '@/components/appointments/AppointmentDetailsDialog';
import { FloatingActionButton } from '@/components/common/FloatingActionButton';
import { appointmentService, staffService } from '@/services';
import { Appointment, Staff } from '@/types/database';

export default function Schedule() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("week");
  const [customersMap, setCustomersMap] = useState<Record<string, Customer>>({});
  const [staffMap, setStaffMap] = useState<Record<string, Staff>>({});
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isAppointmentDetailsOpen, setIsAppointmentDetailsOpen] = useState(false);

  const { data: appointments = [], isLoading, error, refetch } = useQuery({
    queryKey: ['appointments'],
    queryFn: appointmentService.getAll,
  });

  const getWeekDates = () => {
    const dates = [];
    const curr = new Date(currentDate);
    const first = curr.getDate() - curr.getDay();
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(curr);
      day.setDate(first + i);
      dates.push(day);
    }
    
    return dates;
  };

  const formatEventsForCalendar = () => {
    const events: Record<string, any[]> = {};
    
    appointments.forEach((appointment: Appointment) => {
      const dateKey = appointment.appointment_date;
      
      if (!events[dateKey]) {
        events[dateKey] = [];
      }
      
      const customerName = customersMap[appointment.customer_id]?.name || "Unknown Customer";
      const unitNumber = customersMap[appointment.customer_id]?.unit_number || "";
      
      events[dateKey].push({
        id: appointment.id,
        title: appointment.title,
        customer: customerName,
        unitNumber: unitNumber,
        staff: appointment.staff_id ? [staffMap[appointment.staff_id]?.name || "Unassigned"] : ["Unassigned"],
        start: appointment.start_time,
        end: appointment.end_time,
        status: appointment.status,
        original: appointment
      });
    });
    
    return events;
  };

  useEffect(() => {
    const fetchCustomersAndStaff = async () => {
      try {
        const customersData = await customerService.getAll();
        const customersMapData: Record<string, Customer> = {};
        customersData.forEach(customer => {
          customersMapData[customer.id] = customer;
        });
        setCustomersMap(customersMapData);

        const staffData = await staffService.getAll();
        const staffMapData: Record<string, Staff> = {};
        staffData.forEach(staff => {
          staffMapData[staff.id] = staff;
        });
        setStaffMap(staffMapData);
      } catch (error) {
        console.error("Error fetching reference data:", error);
        toast({
          title: "Error",
          description: "Could not load customer and staff data",
          variant: "destructive"
        });
      }
    };

    fetchCustomersAndStaff();
  }, []);

  useEffect(() => {
    refetch();
  }, [currentDate, refetch]);

  const prevMonth = () => {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() - 1);
    setCurrentDate(date);
  };

  const nextMonth = () => {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() + 1);
    setCurrentDate(date);
  };

  const prevWeek = () => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - 7);
    setCurrentDate(date);
  };

  const nextWeek = () => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + 7);
    setCurrentDate(date);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsAppointmentDetailsOpen(true);
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates();
    const hours = Array.from({ length: 12 }, (_, i) => i + 7);
    const events = formatEventsForCalendar();
    
    return (
      <div className="bg-white rounded-lg border shadow">
        <div className="grid grid-cols-8 border-b">
          <div className="py-4 px-2 text-center font-semibold text-muted-foreground border-r">
            Time
          </div>
          {weekDates.map((date, i) => (
            <div 
              key={i} 
              className={`py-4 px-2 text-center ${
                date.toDateString() === new Date().toDateString() 
                  ? "bg-blue-50 font-semibold text-blue-600" 
                  : "font-semibold"
              }`}
            >
              <div>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className="text-xl mt-1">{date.getDate()}</div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-8 divide-x">
          <div className="divide-y">
            {hours.map((hour) => (
              <div key={hour} className="h-24 p-1 text-xs text-muted-foreground">
                {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
              </div>
            ))}
          </div>
          
          {weekDates.map((date, dateIndex) => {
            const dateKey = formatDateKey(date);
            const dateEvents = events[dateKey] || [];
            
            return (
              <div key={dateIndex} className="divide-y relative">
                {hours.map((hour) => (
                  <div key={hour} className="h-24 p-1 relative"></div>
                ))}
                
                {dateEvents.map((event, eventIndex) => {
                  const startHour = parseInt(event.start.split(':')[0], 10);
                  const startMinute = parseInt(event.start.split(':')[1], 10);
                  const endHour = parseInt(event.end.split(':')[0], 10);
                  const endMinute = parseInt(event.end.split(':')[1], 10);
                  
                  const startPosition = ((startHour - 7) * 60 + startMinute) * (24 / 60);
                  const duration = ((endHour - startHour) * 60 + (endMinute - startMinute)) * (24 / 60);
                  
                  return (
                    <div
                      key={eventIndex}
                      className={`absolute rounded-md p-2 overflow-hidden shadow border-l-4 w-[calc(100%-8px)] cursor-pointer hover:opacity-90 ${
                        event.status === "Confirmed" ? "bg-blue-50 border-blue-500" :
                        event.status === "Pending" ? "bg-amber-50 border-amber-500" :
                        event.status === "Completed" ? "bg-green-50 border-green-500" :
                        "bg-gray-50 border-gray-500"
                      }`}
                      style={{
                        top: `${startPosition}px`,
                        height: `${duration}px`,
                        left: '4px',
                      }}
                      onClick={() => handleAppointmentClick(event.original)}
                    >
                      <div className="text-xs font-semibold">
                        {event.unitNumber ? `#${event.unitNumber} - ${event.title}` : event.title}
                      </div>
                      <div className="text-xs mt-1">{formatTime(event.start)} - {formatTime(event.end)}</div>
                      {duration > 50 && (
                        <>
                          <div className="text-xs mt-1 text-gray-600">{event.customer}</div>
                          {duration > 80 && (
                            <Badge className="mt-1 text-xs" variant="outline">
                              {event.status}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="page-container">
      <PageHeader 
        title="Schedule" 
        description="Manage your team's appointments and service schedule."
        actions={
          <Button className="flex items-center" onClick={() => navigate("/schedule/add")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            Add Appointment
          </Button>
        }
      />
      
      <div className="flex flex-wrap items-center justify-between mt-8 mb-4 gap-2">
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className={view === "week" ? "bg-blue-50 text-blue-700" : ""}
            onClick={() => setView("week")}
          >
            Week
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={view === "month" ? "bg-blue-50 text-blue-700" : ""}
            onClick={() => setView("month")}
          >
            Month
          </Button>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4 order-last md:order-none w-full md:w-auto justify-center my-2 md:my-0">
          <Button
            variant="outline"
            size="icon"
            onClick={view === "week" ? prevWeek : prevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h3 className="text-md md:text-lg font-semibold whitespace-nowrap">
            {view === "week" 
              ? `${getWeekDates()[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${getWeekDates()[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
              : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            }
          </h3>
          
          <Button
            variant="outline"
            size="icon"
            onClick={view === "week" ? nextWeek : nextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setCurrentDate(new Date())}
        >
          Today
        </Button>
      </div>
      
      <div className="mt-2 overflow-x-auto pb-6">
        {isLoading ? (
          <div className="bg-white rounded-lg border shadow p-8 text-center">
            Loading appointments...
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg border shadow p-8 text-center text-red-500">
            Error loading appointments. Please try again.
          </div>
        ) : view === "week" ? renderWeekView() : (
          <div className="bg-white rounded-lg border shadow p-4">
            <div className="text-center text-muted-foreground">Month view coming soon</div>
          </div>
        )}
      </div>

      <FloatingActionButton onClick={() => navigate("/schedule/add")} />

      <AppointmentDetailsDialog
        open={isAppointmentDetailsOpen}
        onClose={() => setIsAppointmentDetailsOpen(false)}
        appointment={selectedAppointment}
        customer={selectedAppointment ? customersMap[selectedAppointment.customer_id] : null}
        assignedStaff={selectedAppointment?.staff_id ? staffMap[selectedAppointment.staff_id] : null}
      />
    </div>
  );
}
