
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { appointmentService, customerService, staffService } from "@/services";
import { ListView } from "@/components/schedule/ListView";
import { PlusCircle } from "lucide-react";
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

  // Filter appointments based on active tab
  const filteredAppointments = appointments.filter(appointment => {
    const status = appointment.status?.toLowerCase();
    
    if (activeTab === "upcoming") {
      return ["confirmed", "scheduled", "pending", "in progress"].includes(status) && status !== "cancelled";
    } else if (activeTab === "completed") {
      return status === "completed" || status === "cancelled";
    }
    return true;
  });

  return (
    <div className="page-container">
      <PageHeader 
        title="Schedule" 
        description="" 
        actions={
          <Button className="flex items-center" onClick={() => navigate("/schedule/add")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        } 
      />
      
      <div className="mt-0">
        <div className="flex border-b border-gray-200 rounded-t-lg">
          <button 
            onClick={() => setActiveTab("upcoming")} 
            className={`flex-1 py-3 px-6 text-center font-medium transition-colors duration-200 ${
              activeTab === "upcoming" 
                ? "text-cyan-600 border-b-2 border-cyan-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Upcoming
          </button>
          <button 
            onClick={() => setActiveTab("completed")} 
            className={`flex-1 py-3 px-6 text-center font-medium transition-colors duration-200 ${
              activeTab === "completed" 
                ? "text-cyan-600 border-b-2 border-cyan-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Completed
          </button>
        </div>
        
        <div className="mt-4">
          <ListView 
            appointments={filteredAppointments} 
            onEdit={handleEdit} 
            onMarkAsCompleted={handleMarkAsCompleted} 
            onMarkAsInProgress={handleMarkAsInProgress} 
          />
        </div>
      </div>
      
      <FloatingActionButton onClick={() => navigate("/schedule/add")} />
    </div>
  );
}
