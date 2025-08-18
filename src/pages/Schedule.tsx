import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { ListView } from "@/components/schedule/ListView";

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
      setIsLoading(true);
      try {
        // Simulate fetching appointments, customers, and staff members
        const appointmentsData = [
          { id: "1", appointment_date: "2024-08-10T00:00:00.000Z", start_time: "09:00", end_time: "10:00", status: "confirmed", customer_id: "1", staff_id: "1", title: "Service 1" },
          { id: "2", appointment_date: "2024-08-11T00:00:00.000Z", start_time: "11:00", end_time: "12:00", status: "in progress", customer_id: "2", staff_id: "2", title: "Service 2" },
          { id: "3", appointment_date: "2024-08-10T00:00:00.000Z", start_time: "14:00", end_time: "15:00", status: "completed", customer_id: "1", staff_id: "1", title: "Service 3" },
          { id: "4", appointment_date: "2024-08-12T00:00:00.000Z", start_time: "16:00", end_time: "17:00", status: "scheduled", customer_id: "3", staff_id: "3", title: "Service 4" },
        ];
        const customersData = {
          "1": { id: "1", name: "Customer 1" },
          "2": { id: "2", name: "Customer 2" },
          "3": { id: "3", name: "Customer 3" },
        };
        const staffMembersData = {
          "1": { id: "1", name: "Staff 1" },
          "2": { id: "2", name: "Staff 2" },
          "3": { id: "3", name: "Staff 3" },
        };

        setAppointments(appointmentsData);
        setCustomers(customersData);
        setStaffMembers(staffMembersData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEdit = (appointment) => {
    navigate(`/schedule/edit/${appointment.id}`);
  };

  const handleMarkAsCompleted = (appointment) => {
    // Implement mark as completed logic here
    console.log("Mark as completed:", appointment);
  };

  const handleMarkAsInProgress = (appointment) => {
    // Implement mark as in progress logic here
    console.log("Mark as in progress:", appointment);
  };

  // Filter appointments based on active tab
  const filteredAppointments = appointments.filter(appointment => {
    const normalizedStatus = appointment.status?.toLowerCase().replace(/\s+/g, '');
    
    if (activeTab === "upcoming") {
      return ["confirmed", "scheduled", "pending"].includes(normalizedStatus) && normalizedStatus !== "cancelled";
    } else if (activeTab === "inprogress") {
      return normalizedStatus === "inprogress";
    } else if (activeTab === "completed") {
      return normalizedStatus === "completed" || normalizedStatus === "cancelled";
    }
    return true;
  });

  return <div className="page-container">
      <PageHeader title="Schedule" description="" actions={<Button className="flex items-center" onClick={() => navigate("/schedule/add")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Appointment
          </Button>} />
      
      <div className="mt-0">
        <div className="flex border-b border-gray-200 rounded-t-lg">
          <button onClick={() => setActiveTab("upcoming")} className={`flex-1 py-3 px-6 text-center font-medium transition-colors duration-200 ${activeTab === "upcoming" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
            Upcoming
          </button>
          <button onClick={() => setActiveTab("inprogress")} className={`flex-1 py-3 px-6 text-center font-medium transition-colors duration-200 ${activeTab === "inprogress" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
            In Progress
          </button>
          <button onClick={() => setActiveTab("completed")} className={`flex-1 py-3 px-6 text-center font-medium transition-colors duration-200 ${activeTab === "completed" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
            Completed
          </button>
        </div>
        
        <div className="mt-4">
          <ListView appointments={filteredAppointments} onEdit={handleEdit} onMarkAsCompleted={handleMarkAsCompleted} onMarkAsInProgress={handleMarkAsInProgress} />
        </div>
      </div>
      
      <FloatingActionButton onClick={() => navigate("/schedule/add")} />
    </div>;
}
