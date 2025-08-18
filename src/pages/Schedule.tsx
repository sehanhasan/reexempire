
// ... keep existing code (imports and component start)

export default function Schedule() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState({});
  const [staffMembers, setStaffMembers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("upcoming");

  // ... keep existing code (useEffect and handler functions)

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
