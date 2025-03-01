
import { PageHeader } from "@/components/common/PageHeader";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

// Types for our events
interface ScheduleEvent {
  id: string;
  title: string;
  customer: string;
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("week");
  const [events, setEvents] = useState<DayEvents>({});

  // Load events from localStorage on component mount
  useEffect(() => {
    const storedEvents = localStorage.getItem('scheduleEvents');
    if (storedEvents) {
      setEvents(JSON.parse(storedEvents));
    } else {
      // If no events in localStorage, use mock data
      setEvents(mockEvents);
    }
  }, []);

  // Mock data - would come from API in real app
  const mockEvents: DayEvents = {
    "2023-09-11": [
      { id: "E001", title: "Bathroom Renovation", customer: "John Smith", staff: ["Mike Johnson", "Sarah Williams"], start: "09:00", end: "12:00", status: "Confirmed" },
      { id: "E002", title: "Electrical Inspection", customer: "Emma Brown", staff: ["Mike Johnson"], start: "14:00", end: "15:30", status: "Confirmed" },
    ],
    "2023-09-12": [
      { id: "E003", title: "Kitchen Cabinets", customer: "Robert Wilson", staff: ["Tom Brown", "Jane Smith"], start: "10:00", end: "16:00", status: "Pending" },
    ],
    "2023-09-13": [
      { id: "E004", title: "Flooring Installation", customer: "Michael Davis", staff: ["Tom Brown"], start: "09:00", end: "17:00", status: "Confirmed" },
    ],
    "2023-09-14": [
      { id: "E005", title: "Painting - Living Room", customer: "Lisa Jones", staff: ["Jane Smith"], start: "13:00", end: "18:00", status: "Confirmed" },
    ],
    "2023-09-15": [
      { id: "E006", title: "Final Inspection", customer: "John Smith", staff: ["John Doe"], start: "11:00", end: "12:00", status: "Pending" },
      { id: "E007", title: "Plumbing Repair", customer: "David Martin", staff: ["Sarah Williams"], start: "14:30", end: "16:30", status: "Confirmed" },
    ],
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
                      <div className="text-xs font-semibold">{event.title}</div>
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
          
          <h3 className="text-lg font-semibold">
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
        {view === "week" ? renderWeekView() : (
          <div className="bg-white rounded-lg border shadow p-4">
            <div className="text-center text-muted-foreground">Month view coming soon</div>
          </div>
        )}
      </div>

      <FloatingActionButton onClick={() => navigate("/schedule/add")} />
    </div>
  );
}
