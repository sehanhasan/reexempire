
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { appointmentService, customerService } from "@/services";
import { ListView } from "@/components/schedule/ListView";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PlusCircle, List, Calendar as CalendarIcon, LayoutGrid } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Schedule() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState("list");
  const isMobile = useIsMobile();

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
        status: 'completed'
      });
      
      // Update local state
      setAppointments(prev => 
        prev.map(app => app.id === appointment.id 
          ? { ...app, status: 'completed' } 
          : app
        )
      );
    } catch (error) {
      console.error("Error marking appointment as completed:", error);
    }
  };

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
      
      <div className="mt-6">
        <Tabs defaultValue="list" value={view} onValueChange={setView}>
          <TabsList className="mb-4">
            <TabsTrigger value="list">
              <List className="h-4 w-4 mr-2" />
              List
            </TabsTrigger>
            <TabsTrigger value="day">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Day
            </TabsTrigger>
            <TabsTrigger value="week">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Week
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="mt-2">
            <ListView 
              appointments={appointments} 
              onEdit={handleEdit}
              onMarkAsCompleted={handleMarkAsCompleted}
            />
          </TabsContent>
          
          <TabsContent value="day">
            <div className="bg-white p-6 rounded-lg border border-slate-200 text-center">
              <h3 className="text-lg font-medium mb-4">Day View</h3>
              <p className="text-muted-foreground">
                The day view calendar is currently in development.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="week">
            <div className="bg-white p-6 rounded-lg border border-slate-200 text-center">
              <h3 className="text-lg font-medium mb-4">Week View</h3>
              <p className="text-muted-foreground">
                The week view calendar is currently in development.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <FloatingActionButton onClick={() => navigate("/schedule/add")} />
    </div>
  );
}
