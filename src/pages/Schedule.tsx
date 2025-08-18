import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, TrendingUp, Users, CheckCircle2, Eye, Edit, Trash2, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { appointmentService, customerService } from "@/services";
import { useIsMobile } from "@/hooks/use-mobile";
import { ListView } from "@/components/schedule/ListView";

export default function Schedule() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    upcoming: 0,
    completed: 0
  });

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const [appointmentsData, customersData] = await Promise.all([
          appointmentService.getAll(),
          customerService.getAll()
        ]);

        setAppointments(appointmentsData);
        setCustomers(customersData);

        // Calculate stats
        const today = new Date().toLocaleDateString();
        const todayAppointments = appointmentsData.filter(appt => new Date(appt.appointment_date).toLocaleDateString() === today);
        const upcomingAppointments = appointmentsData.filter(appt => new Date(appt.appointment_date) >= new Date());
        const completedAppointments = appointmentsData.filter(appt => appt.status === 'Completed');

        setStats({
          total: appointmentsData.length,
          today: todayAppointments.length,
          upcoming: upcomingAppointments.length,
          completed: completedAppointments.length
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Confirmed': "bg-blue-100 text-blue-700 hover:bg-blue-100",
      'Scheduled': "bg-blue-100 text-blue-700 hover:bg-blue-100",
      'Completed': "bg-green-100 text-green-700 hover:bg-green-100",
      'In Progress': "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
      'Cancelled': "bg-red-100 text-red-700 hover:bg-red-100"
    };
    
    return (
      <Badge className={statusClasses[status] || "bg-slate-100 text-slate-700 hover:bg-slate-100"} variant="secondary">
        {status}
      </Badge>
    );
  };

  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const handleEdit = (appointment) => {
    navigate(`/schedule/edit/${appointment.id}`);
  };

  const handleView = (appointment) => {
    // Open appointment details dialog or navigate to view page
    console.log('View appointment:', appointment);
  };

  const handleDelete = async (appointment) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await appointmentService.delete(appointment.id);
        fetchAppointments();
      } catch (error) {
        console.error('Error deleting appointment:', error);
      }
    }
  };

  const renderAppointmentCard = (appointment) => {
    const customer = customers.find(c => c.id === appointment.customer_id);
    
    return (
      <Card key={appointment.id} className="overflow-hidden border-l-4 border-l-blue-500 shadow-sm">
        <CardContent className="p-0">
          <div 
            className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-all"
            onClick={() => handleView(appointment)}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-blue-700 text-sm">
                  {customer?.unit_number ? `#${customer.unit_number}` : 'No Unit'}
                  {customer?.unit_number ? " - " : ""}
                  <span className="text-slate-800">{appointment.title}</span>
                </h3>
                <p className="text-xs text-slate-600 mt-1">{customer?.name || 'Unknown Customer'}</p>
              </div>
              {getStatusBadge(appointment.status)}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Date:</span>
                <span className="font-medium text-slate-900">
                  {new Date(appointment.appointment_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Time:</span>
                <span className="text-emerald-600 font-medium">
                  {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                </span>
              </div>
              {appointment.notes && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Notes:</span>
                  <span className="text-slate-700 text-right max-w-[200px] truncate">
                    {appointment.notes}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t p-3 bg-slate-50 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(appointment);
              }}
              className="text-slate-600 hover:text-slate-700"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(appointment);
              }}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="page-container min-h-screen bg-slate-50">
      <div className="p-4 space-y-6">
        <PageHeader
          title="Schedule"
          actions={
            <Button onClick={() => navigate("/schedule/add")} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Appointment
            </Button>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Total Appointments</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{stats.total}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-600 font-medium">Scheduled</span>
                  </div>
                </div>
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Today</p>
                  <p className="text-2xl font-bold text-emerald-900 mt-1">{stats.today}</p>
                  <div className="flex items-center mt-2">
                    <Clock className="h-3 w-3 text-emerald-500 mr-1" />
                    <span className="text-xs text-emerald-600 font-medium">Active</span>
                  </div>
                </div>
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <CalendarDays className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Upcoming</p>
                  <p className="text-2xl font-bold text-amber-900 mt-1">{stats.upcoming}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-xs text-amber-600 font-medium">This Week</span>
                  </div>
                </div>
                <div className="p-2 bg-amber-500 rounded-lg">
                  <Clock className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Completed</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">{stats.completed}</p>
                  <div className="flex items-center mt-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-600 font-medium">Done</span>
                  </div>
                </div>
                <div className="p-2 bg-green-500 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appointments List */}
        {isMobile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Appointments</h3>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-slate-600 mt-2">Loading appointments...</p>
                </div>
              ) : appointments.length === 0 ? (
                <div className="py-8 text-center">
                  <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">No appointments scheduled</p>
                </div>
              ) : (
                appointments.map(renderAppointmentCard)
              )}
            </div>
          </div>
        ) : (
          <ListView
            appointments={appointments}
            customers={customers}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
