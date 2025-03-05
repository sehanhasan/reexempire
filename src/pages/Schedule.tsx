import { PageHeader } from "@/components/common/PageHeader";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { appointmentService } from "@/services/appointmentService";
import { customerService } from "@/services";

// Types for our events
interface ScheduleEvent {
  id: string;
  title: string;
  customer: string;
  unit?: string;
  staff: string[];
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  status: "Confirmed" | "Pending" | "Completed" | "Cancelled";
}

// Mock data for days with events
interface DayEvents {
  [key: string]: ScheduleEvent[]; // "YYYY-MM-DD" -> events[]
}

export default function Schedule() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("week");
  const [events, setEvents] = useState<DayEvents>({});
  const [customers, setCustomers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Load events from API and localStorage on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Fetch customers to get unit numbers
        const customerData = await customerService.getAll();
        const customerMap: Record<string, any> = {};
        customerData.forEach((customer: any) => {
          customerMap[customer.id] = customer;
        });
        setCustomers(customerMap);
        
        // Try to get appointments from API
        const appointments = await appointmentService.getAll();
        
        // Convert appointments to events format
        const eventMap: DayEvents = {};
        
        // Process appointments
        appointments.forEach((appointment: any) => {
          const dateKey = appointment.appointment_date;
          
          if (!eventMap[dateKey]) {
            eventMap[dateKey] = [];
          }
          
          const customer = customerMap[appointment.customer_id];
          
          eventMap[dateKey].push({
            id: appointment.id,
            title: appointment.title,
            customer: customer?.name || "Unknown",
            unit: customer?.unit_number,
            staff: appointment.staff_id ? [appointment.staff_id] : [],
            start: appointment.start_time,
            end: appointment.end_time,
            status: appointment.status
          });
        });
        
        // Fallback to localStorage if no appointments
        if (Object.keys(eventMap).length === 0) {
          const storedEvents = localStorage.getItem('scheduleEvents');
          if (storedEvents) {
            setEvents(JSON.parse(storedEvents));
          } else {
            // If nothing in localStorage either, use mock data for demo
            setEvents(mockEvents);
          }
        } else {
          setEvents(eventMap);
        }
      } catch (error) {
        console.error("Error fetching schedule data:", error);
        // Fallback to localStorage
        const storedEvents = localStorage.getItem('scheduleEvents');
        if (storedEvents) {
          setEvents(JSON.parse(storedEvents));
        } else {
          setEvents(mockEvents);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Mock data - would come from API in real app
  const mockEvents: DayEvents = {
    "2023-09-11": [
      { id: "E001", title: "Bathroom Renovation", customer: "John Smith", unit: "A-12-3", staff: ["Mike Johnson", "Sarah Williams"], start: "09:00", end: "12:00", status: "Confirmed" },
      { id: "E002", title: "Electrical Inspection", customer: "Emma Brown", unit: "B-09-7", staff: ["Mike Johnson"], start: "14:00", end: "15:30", status: "Confirmed" },
    ],
    // ... keep existing code for other mock events
  };

  // Helper functions for calendar
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getWeekDates = () => {
    const dates = [];
    const curr = new Date(currentDate);
    const first = curr.getDate() - curr.getDay();
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(curr.setDate(first + i));
      dates.push(day);
    }
    
    return dates;
  };

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

  // Render week view
  const renderWeekView = () => {
    const weekDates = getWeekDates();
    const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7 AM to 6 PM
    
    return (
      <div className="bg-white rounded-lg border shadow">
        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-8'} border-b`}>
          {!isMobile && (
            <div className="py-4 px-2 text-center font-semibold text-muted-foreground border-r">
              Time
            </div>
          )}
          
          {weekDates.slice(0, isMobile ? 1 : 7).map((date, i) => (
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
        
        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-8'} divide-x`}>
          {!isMobile && (
            <div className="divide-y">
              {hours.map((hour) => (
                <div key={hour} className="h-24 p-1 text-xs text-muted-foreground">
                  {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
                </div>
              ))}
            </div>
          )}
          
          {weekDates.slice(0, isMobile ? 1 : 7).map((date, dateIndex) => {
            const dateKey = formatDateKey(date);
            const dateEvents = events[dateKey] || [];
            
            return (
              <div key={dateIndex} className="divide-y relative">
                {hours.map((hour) => (
                  <div key={hour} className="h-24 p-1 relative">
                    {isMobile && (
                      <div className="absolute left-0 top-0 text-xs text-muted-foreground">
                        {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
                      </div>
                    )}
                  </div>
                ))}
                
                {dateEvents.map((event, eventIndex) => {
                  const startHour = parseInt(event.start.split(':')[0], 10);
                  const startMinute = parseInt(event.start.split(':')[1], 10);
                  const endHour = parseInt(event.end.split(':')[0], 10);
                  const endMinute = parseInt(event.end.split(':')[1], 10);
                  
                  const startPosition = ((startHour - 7) * 60 + startMinute) * (24 / 60);
                  const duration = ((endHour - startHour) * 60 + (endMinute - startMinute)) * (24 / 60);
                  
                  const displayTitle = event.unit 
                    ? `${event.unit} - ${event.title}`
                    : event.title;
                  
                  return (
                    <div
                      key={eventIndex}
                      className={`absolute rounded-md p-2 overflow-hidden shadow border-l-4 w-[calc(100%-8px)] ${
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
                    >
                      <div className="text-xs font-semibold">{displayTitle}</div>
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

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
    if (isMobile) {
      // For mobile, when changing date, automatically switch to that day's view
      setView("week");
    }
  };

  return (
    <div className="page-container">
      <PageHeader 
        title="Schedule" 
        description="Manage your team's appointments and service schedule."
        actions={
          <Button className="flex items-center" onClick={() => navigate("/schedule/add")}>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Add Appointment
          </Button>
        }
      />
      
      <div className="flex items-center justify-between mt-8 mb-4">
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
        
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={view === "week" ? prevWeek : prevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h3 className="text-lg font-semibold hidden md:block">
            {view === "week" 
              ? `${getWeekDates()[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${getWeekDates()[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
              : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            }
          </h3>
          
          <h3 className="text-sm font-semibold md:hidden">
            {view === "week" 
              ? getWeekDates()[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
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
        {loading ? (
          <div className="bg-white rounded-lg border shadow p-8 text-center">
            <div className="text-muted-foreground">Loading schedule...</div>
          </div>
        ) : view === "week" ? renderWeekView() : (
          <div className="bg-white rounded-lg border shadow p-4">
            <div className="text-center text-muted-foreground">Month view coming soon</div>
          </div>
        )}
      </div>

      <FloatingActionButton onClick={() => navigate("/schedule/add")} />
    </div>
  );
}
