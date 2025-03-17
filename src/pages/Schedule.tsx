
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { appointmentService, customerService } from "@/services";
import { ListView } from "@/components/schedule/ListView";
import { PlusCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

export default function Schedule() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [appointmentsData, customersData] = await Promise.all([
          appointmentService.getAll(),
          customerService.getAll()
        ]);
        
        // Create a customer lookup map for quick access
        const customersMap = {};
        customersData.forEach(customer => {
          customersMap[customer.id] = customer;
        });
        
        // Enhance appointments with customer data
        const enhancedAppointments = appointmentsData.map(appointment => {
          const customer = customersMap[appointment.customer_id] || null;
          return {
            ...appointment,
            customer
          };
        });
        
        setAppointments(enhancedAppointments);
        setCustomers(customersMap);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching schedule data:", error);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleEdit = (appointment) => {
    navigate(`/schedule/edit/${appointment.id}`);
  };
  
  const handleMarkAsCompleted = async (appointment) => {
    try {
      await appointmentService.update(appointment.id, {
        ...appointment,
        status: 'Completed'
      });
      
      // Update local state
      setAppointments(prev => 
        prev.map(app => app.id === appointment.id 
          ? { ...app, status: 'Completed' } 
          : app
        )
      );
    } catch (error) {
      console.error("Error marking appointment as completed:", error);
      toast({
        title: "Error",
        description: "Could not mark appointment as completed",
        variant: "destructive"
      });
    }
  };

  const handleMarkAsInProgress = async (appointment) => {
    try {
      await appointmentService.update(appointment.id, {
        ...appointment,
        status: 'In Progress'
      });
      
      // Update local state
      setAppointments(prev => 
        prev.map(app => app.id === appointment.id 
          ? { ...app, status: 'In Progress' } 
          : app
        )
      );
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
      return ["Confirmed", "Scheduled", "Pending", "In Progress"].includes(appointment.status);
    } else if (activeTab === "completed") {
      return appointment.status === "Completed";
    }
    return true;
  });

  return (
    <div className="page-container">
      <PageHeader 
        title="Schedule" 
        description=""
        actions={
          <Button 
            className="flex items-center" 
            onClick={() => navigate("/schedule/add")}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        }
      />
      
      <div className="mt-6 px-3">
        <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-4">
            <ListView 
              appointments={filteredAppointments} 
              onEdit={handleEdit}
              onMarkAsCompleted={handleMarkAsCompleted}
              onMarkAsInProgress={handleMarkAsInProgress}
            />
          </TabsContent>
          <TabsContent value="completed" className="mt-4">
            <ListView 
              appointments={filteredAppointments} 
              onEdit={handleEdit}
              onMarkAsCompleted={handleMarkAsCompleted}
              onMarkAsInProgress={handleMarkAsInProgress}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      <FloatingActionButton onClick={() => navigate("/schedule/add")} />
    </div>
  );
}
