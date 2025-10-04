
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { appointmentService, customerService, staffService } from "@/services";
import { ListView } from "@/components/schedule/ListView";
import { CalendarView } from "@/components/schedule/CalendarView";
import { PlusCircle, Calendar, List } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import { Appointment, Staff } from "@/types/database";

export default function Schedule() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState({});
  const [staffMembers, setStaffMembers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [appointmentsData, customersData, staffData] = await Promise.all([
          appointmentService.getAll(), 
          customerService.getAll(), 
          staffService.getAll()
        ]);

        // Create a customer lookup map for quick access
        const customersMap = {};
        customersData.forEach(customer => {
          customersMap[customer.id] = customer;
        });

        // Create a staff lookup map for quick access
        const staffMap = {};
        staffData.forEach(staff => {
          staffMap[staff.id] = staff;
        });

        // Enhance appointments with customer data
        const enhancedAppointments = appointmentsData.map(appointment => {
          const customer = customersMap[appointment.customer_id] || null;
          const staff = appointment.staff_id ? staffMap[appointment.staff_id] : null;
          return {
            ...appointment,
            customer,
            staff
          };
        });
        
        setAppointments(enhancedAppointments);
        setCustomers(customersMap);
        setStaffMembers(staffMap);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching schedule data:", error);
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to load appointments",
          variant: "destructive"
        });
      }
    };
    fetchData();
  }, []);

  const handleEdit = appointment => {
    navigate(`/schedule/edit/${appointment.id}`);
  };

  const handleMarkAsCompleted = async (appointment: Appointment) => {
    try {
      await appointmentService.update(appointment.id, {
        status: 'Completed'
      });

      // Update local state
      setAppointments(prev => prev.map(app => 
        app.id === appointment.id ? { ...app, status: 'Completed' } : app
      ));
      
      toast({
        title: "Appointment Completed",
        description: "Appointment has been marked as completed."
      });
    } catch (error) {
      console.error("Error marking appointment as completed:", error);
      toast({
        title: "Error",
        description: "Could not mark appointment as completed",
        variant: "destructive"
      });
    }
  };

  const handleMarkAsInProgress = async (appointment: Appointment) => {
    try {
      await appointmentService.update(appointment.id, {
        status: 'In Progress'
      });

      // Update local state
      setAppointments(prev => prev.map(app => 
        app.id === appointment.id ? { ...app, status: 'In Progress' } : app
      ));
      
      toast({
        title: "Appointment In Progress",
        description: "Appointment has been marked as in progress."
      });
    } catch (error) {
      console.error("Error marking appointment as in progress:", error);
      toast({
        title: "Error",
        description: "Could not mark appointment as in progress",
        variant: "destructive"
      });
    }
  };

  // Filter appointments based on active tab - this is the key fix for issue #3
  const getFilteredAppointments = () => {
    if (activeTab === "upcoming") {
      return appointments.filter(appointment => 
        ["Confirmed", "Scheduled", "Pending"].includes(appointment.status) && 
        appointment.status !== "Cancelled"
      );
    } else if (activeTab === "in_progress") {
      return appointments.filter(appointment => appointment.status === "In Progress");
    } else if (activeTab === "completed") {
      return appointments.filter(appointment => 
        appointment.status === "Completed" || appointment.status === "Cancelled"
      );
    }
    return appointments;
  };

  // Get filtered appointments whenever activeTab or appointments change
  const filteredAppointments = getFilteredAppointments();

  // Counts for tabs
  const counts = {
    upcoming: appointments.filter(a => 
      ["Confirmed", "Scheduled", "Pending"].includes(a.status) && a.status !== "Cancelled"
    ).length,
    inProgress: appointments.filter(a => a.status === "In Progress").length,
    completed: appointments.filter(a => 
      a.status === "Completed" || a.status === "Cancelled"
    ).length,
  };

  return (
    <div className={`${isMobile ? 'page-container' : 'mt-6'}`}>
      {!isMobile && (
        <PageHeader 
          title="Schedule" 
          actions={
            <Button onClick={() => navigate("/schedule/add")} className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Appointment
            </Button>
          } 
        />
      )}
      
      <div className="mt-0">
        <div className="flex border-b bg-white border-gray-200 rounded-t-lg">
          <button 
            onClick={() => setActiveTab("upcoming")} 
            className={`flex-1 py-3 px-6 text-medium font-small transition-colors duration-200 ${
              activeTab === "upcoming" 
                ? "text-blue-600 border-b-2 border-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Upcoming ({counts.upcoming})
          </button>
          <button 
            onClick={() => setActiveTab("in_progress")} 
            className={`flex-1 py-3 px-6 text-medium font-small transition-colors duration-200 ${
              activeTab === "in_progress" 
                ? "text-blue-600 border-b-2 border-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            In Progress ({counts.inProgress})
          </button>
          <button 
            onClick={() => setActiveTab("completed")} 
            className={`flex-1 py-3 px-6 text-medium font-small transition-colors duration-200 ${
              activeTab === "completed" 
                ? "text-blue-600 border-b-2 border-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Completed ({counts.completed})
          </button>
        </div>
        
        <div className="mt-4">
          {viewMode === "list" ? (
            <ListView 
              appointments={filteredAppointments} 
              onEdit={handleEdit} 
              onMarkAsCompleted={handleMarkAsCompleted} 
              onMarkAsInProgress={handleMarkAsInProgress} 
            />
          ) : (
            <CalendarView
              appointments={filteredAppointments}
              onEdit={handleEdit}
              onMarkAsCompleted={handleMarkAsCompleted}
              onMarkAsInProgress={handleMarkAsInProgress}
            />
          )}
        </div>
      </div>

      {/* View Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setViewMode(viewMode === "list" ? "calendar" : "list")}
          className="shadow-lg"
          size="lg"
        >
          {viewMode === "list" ? (
            <>
              <Calendar className="mr-2 h-5 w-5" />
              Calendar View
            </>
          ) : (
            <>
              <List className="mr-2 h-5 w-5" />
              List View
            </>
          )}
        </Button>
      </div>
      
      <FloatingActionButton onClick={() => navigate("/schedule/add")} />
    </div>
  );
}
