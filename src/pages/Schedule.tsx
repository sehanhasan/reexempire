import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { appointmentService, customerService, staffService } from "@/services";
import { supabase } from "@/integrations/supabase/client";
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
        const [appointmentsData, customersData, staffData] = await Promise.all([appointmentService.getAll(), customerService.getAll(), staffService.getAll()]);

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

    // Set up realtime subscription for appointments
    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        async (payload) => {
          console.log('Appointment change received:', payload);
          // Refetch data when any appointment changes
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      setAppointments(prev => prev.map(app => app.id === appointment.id ? {
        ...app,
        status: 'Completed'
      } : app));
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
      setAppointments(prev => prev.map(app => app.id === appointment.id ? {
        ...app,
        status: 'In Progress'
      } : app));
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

  // Filter appointments based on active tab
  const filteredAppointments = appointments.filter(appointment => {
    if (activeTab === "upcoming") {
      return ["Confirmed", "Scheduled", "Pending"].includes(appointment.status);
    } else if (activeTab === "in_progress") {
      return appointment.status === "In Progress";
    } else if (activeTab === "in_review") {
      return appointment.status === "Pending Review";
    } else if (activeTab === "cancelled") {
      return appointment.status === "Cancelled";
    } else if (activeTab === "completed") {
      return appointment.status === "Completed";
    }
    return true;
  });

  // Counts for tabs
  const counts = {
    upcoming: appointments.filter(a => ["Confirmed", "Scheduled", "Pending"].includes(a.status)).length,
    inProgress: appointments.filter(a => a.status === "In Progress").length,
    inReview: appointments.filter(a => a.status === "Pending Review").length,
    cancelled: appointments.filter(a => a.status === "Cancelled").length,
    completed: appointments.filter(a => a.status === "Completed").length
  };
  return <div className={`${isMobile ? 'page-container' : 'mt-6'}`}>
      {!isMobile && <PageHeader title="Schedule" actions={<Button onClick={() => navigate("/schedule/add")} className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Appointment
            </Button>} />}
      
      <div className="mt-0">
        <div className="bg-white border-b border-gray-200 rounded-t-lg">
          <div className="flex overflow-x-auto">
            <button onClick={() => setActiveTab("upcoming")} className={`flex-1 py-3 px-4 text-medium font-small transition-colors duration-200 whitespace-nowrap ${activeTab === "upcoming" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
              Upcoming ({counts.upcoming})
            </button>
          <button onClick={() => setActiveTab("in_progress")} className={`flex-1 py-3 px-4 text-medium font-small transition-colors duration-200 whitespace-nowrap ${activeTab === "in_progress" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
            In Progress ({counts.inProgress})
          </button>
          <button onClick={() => setActiveTab("in_review")} className={`flex-1 py-3 px-4 text-medium font-small transition-colors duration-200 whitespace-nowrap ${activeTab === "in_review" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
            In Review ({counts.inReview})
          </button>
          <button onClick={() => setActiveTab("cancelled")} className={`flex-1 py-3 px-4 text-medium font-small transition-colors duration-200 whitespace-nowrap ${activeTab === "cancelled" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
            Cancelled ({counts.cancelled})
          </button>
            <button onClick={() => setActiveTab("completed")} className={`flex-1 py-3 px-4 text-medium font-small transition-colors duration-200 whitespace-nowrap ${activeTab === "completed" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
              Completed ({counts.completed})
            </button>
          </div>
        </div>
        
        {/* View Toggle Button - Desktop Only */}
        {!isMobile && (
          <div className="absolute bottom-0 left-0 right-0 mb-4">
            <Button 
              onClick={() => setViewMode(viewMode === "list" ? "calendar" : "list")} 
              size="sm" 
              variant="outline"
              className="whitespace-nowrap"
            >
              {viewMode === "list" ? (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Calendar View
                </>
              ) : (
                <>
                  <List className="mr-2 h-4 w-4" />
                  List View
                </>
              )}
            </Button>
          </div>
        )}
        
        <div className="mt-4">
          {viewMode === "list" ? <ListView appointments={filteredAppointments} onEdit={handleEdit} onMarkAsCompleted={handleMarkAsCompleted} onMarkAsInProgress={handleMarkAsInProgress} /> : <CalendarView appointments={filteredAppointments} onEdit={handleEdit} onMarkAsCompleted={handleMarkAsCompleted} onMarkAsInProgress={handleMarkAsInProgress} />}
        </div>
      </div>

      {/* View Toggle Button - Mobile Only */}
      {isMobile && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Button onClick={() => setViewMode(viewMode === "list" ? "calendar" : "list")} size="lg" className="shadow-lg bg-blue-600 hover:bg-blue-500">
            {viewMode === "list" ? <>
                <Calendar className="mr-2 h-5 w-5" />
                Calendar View
              </> : <>
                <List className="mr-2 h-5 w-5" />
                List View
              </>}
          </Button>
        </div>
      )}
      
      <FloatingActionButton onClick={() => navigate("/schedule/add")} />
    </div>;
}