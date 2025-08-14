
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin,
  Edit,
  Trash,
  Phone,
  Mail,
  MoreHorizontal,
  Plus
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appointmentService, customerService } from "@/services";
import { Appointment, Customer } from "@/types/database";
import { AppointmentDetailsDialog } from "@/components/appointments/AppointmentDetailsDialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppointmentWithCustomer extends Appointment {
  customer?: Customer;
}

export default function Schedule() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [appointments, setAppointments] = useState<AppointmentWithCustomer[]>([]);
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithCustomer | null>(null);
  const [isAppointmentDetailOpen, setIsAppointmentDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appointmentData, customerData] = await Promise.all([
        appointmentService.getAll(),
        customerService.getAll()
      ]);

      const customerMap: Record<string, Customer> = {};
      customerData.forEach(customer => {
        customerMap[customer.id] = customer;
      });
      setCustomers(customerMap);

      const enhancedAppointments: AppointmentWithCustomer[] = appointmentData.map(appointment => ({
        ...appointment,
        customer: customerMap[appointment.customer_id]
      }));

      // Sort by appointment date and time
      enhancedAppointments.sort((a, b) => {
        const dateA = new Date(`${a.appointment_date} ${a.start_time}`);
        const dateB = new Date(`${b.appointment_date} ${b.start_time}`);
        return dateA.getTime() - dateB.getTime();
      });

      setAppointments(enhancedAppointments);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to load appointments. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Set up mobile search
  useEffect(() => {
    const mobileSearchEvent = new CustomEvent('setup-mobile-search', {
      detail: {
        searchTerm,
        onSearchChange: setSearchTerm,
        placeholder: "Search appointments..."
      }
    });
    window.dispatchEvent(mobileSearchEvent);

    return () => {
      window.dispatchEvent(new CustomEvent('clear-mobile-search'));
    };
  }, [searchTerm]);

  const handleDelete = async () => {
    if (!appointmentToDelete) return;
    
    try {
      await appointmentService.delete(appointmentToDelete.id);
      setAppointments(appointments.filter(appointment => appointment.id !== appointmentToDelete.id));
      setDeleteDialogOpen(false);
      setAppointmentToDelete(null);
      
      toast({
        title: "Appointment Deleted",
        description: "The appointment has been deleted successfully.",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast({
        title: "Error",
        description: "Failed to delete the appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const showAppointmentDetails = (appointment: AppointmentWithCustomer) => {
    setSelectedAppointment(appointment);
    setIsAppointmentDetailOpen(true);
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'confirmed':
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'in progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Filter appointments based on search term
  const filteredAppointments = appointments.filter(appointment => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      appointment.title.toLowerCase().includes(search) ||
      appointment.customer?.name.toLowerCase().includes(search) ||
      appointment.customer?.unit_number?.toLowerCase().includes(search) ||
      appointment.status.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="p-2">
          <div className="flex items-center justify-center h-[70vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-lg">Loading appointments...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-2">
        <PageHeader title="Schedule" />
        
        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-8 text-center">
                <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600">No appointments found</p>
              </CardContent>
            </Card>
          ) : (
            filteredAppointments.map(appointment => (
              <Card key={appointment.id} className="border-0 shadow-sm border-l-4 border-l-blue-500 hover:shadow-md transition-shadow cursor-pointer" onClick={() => showAppointmentDetails(appointment)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-slate-900">
                          {appointment.customer?.unit_number ? (
                            <span className="text-blue-700">#{appointment.customer.unit_number}</span>
                          ) : ""}{appointment.customer?.unit_number ? " - " : ""}
                          <span className="text-slate-800">{appointment.title}</span>
                        </h3>
                        <Badge className={getStatusColor(appointment.status)} variant="secondary">
                          {appointment.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span className="font-medium">
                            {new Date(appointment.appointment_date).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <span className="text-emerald-600 font-medium">
                            {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                          </span>
                        </div>
                        
                        {appointment.customer && (
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            <span>{appointment.customer.name}</span>
                          </div>
                        )}
                        
                        {appointment.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>{appointment.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={e => {
                          e.stopPropagation();
                          navigate(`/schedule/edit/${appointment.id}`);
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {appointment.customer?.phone && (
                          <DropdownMenuItem onClick={e => {
                            e.stopPropagation();
                            window.open(`https://wa.me/${appointment.customer?.phone?.replace(/^\+/, '')}`);
                          }}>
                            <Phone className="mr-2 h-4 w-4" />
                            WhatsApp
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={e => {
                          e.stopPropagation();
                          setAppointmentToDelete(appointment);
                          setDeleteDialogOpen(true);
                        }}>
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <FloatingActionButton onClick={() => navigate("/schedule/add")} />

        <AppointmentDetailsDialog 
          open={isAppointmentDetailOpen} 
          onClose={() => setIsAppointmentDetailOpen(false)} 
          appointment={selectedAppointment} 
          customer={selectedAppointment ? customers[selectedAppointment.customer_id] : null} 
          assignedStaff={null} 
          onMarkAsCompleted={async (appointment) => {
            try {
              await appointmentService.update(appointment.id, {
                ...appointment,
                status: 'Completed'
              });
              setAppointments(prev => prev.map(app => 
                app.id === appointment.id ? { ...app, status: 'Completed' } : app
              ));
              setIsAppointmentDetailOpen(false);
            } catch (error) {
              console.error("Error marking appointment as completed:", error);
            }
          }} 
          onMarkAsInProgress={async (appointment) => {
            try {
              await appointmentService.update(appointment.id, {
                ...appointment,
                status: 'In Progress'
              });
              setAppointments(prev => prev.map(app => 
                app.id === appointment.id ? { ...app, status: 'In Progress' } : app
              ));
              setIsAppointmentDetailOpen(false);
            } catch (error) {
              console.error("Error marking appointment as in progress:", error);
            }
          }} 
        />

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Appointment</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this appointment? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash className="mr-2 h-4 w-4" />
                Delete Appointment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
