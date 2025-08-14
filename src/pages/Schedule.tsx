import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { appointmentService, customerService, staffService } from "@/services";
import { ListView } from "@/components/schedule/ListView";
import { PlusCircle, Calendar, Clock, CheckCircle2, Activity } from "lucide-react";
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
      return ["Confirmed", "Scheduled", "Pending", "In Progress"].includes(appointment.status) && appointment.status !== "Cancelled";
    } else if (activeTab === "completed") {
      return appointment.status === "Completed" || appointment.status === "Cancelled";
    }
    return true;
  });
  return <div className="page-container">
      <PageHeader title="Schedule" description="" actions={<Button className="flex items-center bg-blue-600 hover:bg-blue-700" onClick={() => navigate("/schedule/add")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Appointment
          </Button>} />

      {/* Modern header with stats */}
      <div className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Total</p>
                <p className="text-xl font-bold text-blue-900 mt-1">{appointments.length}</p>
              </div>
              <div className="p-2 bg-blue-500 rounded-lg">
                <Calendar className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Upcoming</p>
                <p className="text-xl font-bold text-amber-900 mt-1">{appointments.filter(a => ["Confirmed", "Scheduled", "Pending", "In Progress"].includes(a.status) && a.status !== "Cancelled").length}</p>
              </div>
              <div className="p-2 bg-amber-500 rounded-lg">
                <Clock className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Completed</p>
                <p className="text-xl font-bold text-green-900 mt-1">{appointments.filter(a => a.status === "Completed").length}</p>
              </div>
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">In Progress</p>
                <p className="text-xl font-bold text-purple-900 mt-1">{appointments.filter(a => a.status === "In Progress").length}</p>
              </div>
              <div className="p-2 bg-purple-500 rounded-lg">
                <Activity className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button onClick={() => setActiveTab("upcoming")} className={`flex-1 py-4 px-6 text-center font-semibold transition-all duration-200 ${activeTab === "upcoming" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
            Upcoming
          </button>
          <button onClick={() => setActiveTab("completed")} className={`flex-1 py-4 px-6 text-center font-semibold transition-all duration-200 ${activeTab === "completed" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
            Completed
          </button>
        </div>
        
        <div className="p-4">
          <ListView appointments={filteredAppointments} onEdit={handleEdit} onMarkAsCompleted={handleMarkAsCompleted} onMarkAsInProgress={handleMarkAsInProgress} />
        </div>
      </div>
      
      <FloatingActionButton onClick={() => navigate("/schedule/add")} />
    </div>;
}