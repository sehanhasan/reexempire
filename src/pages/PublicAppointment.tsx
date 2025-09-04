import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, MapPin, User, FileText, Play, CheckCircle, AlertCircle } from "lucide-react";
import { appointmentService, customerService, staffService } from "@/services";
import { formatDate } from "@/utils/formatters";
import { toast } from "@/hooks/use-toast";

interface StaffMember {
  id: string;
  name: string;
  hasStarted: boolean;
  hasCompleted: boolean;
}

export default function PublicAppointment() {
  const { id } = useParams<{ id: string }>();
  const [appointment, setAppointment] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [overallStatus, setOverallStatus] = useState<string>('Confirmed');

  useEffect(() => {
    const fetchAppointmentData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const appointmentData = await appointmentService.getById(id);
        
        if (!appointmentData) {
          toast({
            title: "Not Found",
            description: "Appointment not found",
            variant: "destructive",
          });
          return;
        }

        setAppointment(appointmentData);

        // Fetch customer data
        if (appointmentData.customer_id) {
          const customerData = await customerService.getById(appointmentData.customer_id);
          setCustomer(customerData);
        }

        // Fetch all staff and determine assigned ones
        const allStaff = await staffService.getAll();
        
        // For now, we'll work with the single staff_id field
        // In the future, this could be extended to support multiple staff
        const assignedStaff: StaffMember[] = [];
        if (appointmentData.staff_id) {
          const staff = allStaff.find((s: any) => s.id === appointmentData.staff_id);
          if (staff) {
            assignedStaff.push({
              id: staff.id,
              name: staff.name,
              hasStarted: false,
              hasCompleted: false,
            });
          }
        }
        
        setStaffMembers(assignedStaff);
        setOverallStatus(appointmentData.status || 'Confirmed');
        
      } catch (error) {
        console.error("Error fetching appointment:", error);
        toast({
          title: "Error",
          description: "Failed to load appointment details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointmentData();
  }, [id]);

  const handleStartWork = async (staffId: string) => {
    try {
      // Update appointment status in database
      await appointmentService.update(id!, { status: 'In Progress' });
      
      setStaffMembers(prev => 
        prev.map(staff => 
          staff.id === staffId 
            ? { ...staff, hasStarted: true }
            : staff
        )
      );
      
      // If any staff member starts, set overall status to "In Progress"
      setOverallStatus('In Progress');
      
      toast({
        title: "Work Started",
        description: "You have started working on this appointment",
      });
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive",
      });
    }
  };

  const handleCompleteWork = (staffId: string) => {
    setStaffMembers(prev => 
      prev.map(staff => 
        staff.id === staffId 
          ? { ...staff, hasCompleted: true }
          : staff
      )
    );
    
    toast({
      title: "Work Completed",
      description: "You have marked your work as completed",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'default';
      case 'in progress':
        return 'secondary';
      case 'completed':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'text-blue-600';
      case 'in progress':
        return 'text-amber-600';
      case 'completed':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Appointment Not Found</h2>
            <p className="text-muted-foreground">
              The appointment you're looking for could not be found.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <img 
                src="https://i.ibb.co/Ltyts5K/reex-empire-logo.png" 
                alt="Reex Empire Logo" 
                className="h-10" 
              />
            </div>
            <CardTitle className="text-xl">
              #{customer.unit_number} - {appointment.title}
            </CardTitle>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge 
                variant={overallStatus.toLowerCase() === 'confirmed' ? 'default' : overallStatus.toLowerCase() === 'completed' ? 'default' : 'secondary'} 
                className={
                  overallStatus.toLowerCase() === 'confirmed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                  overallStatus.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                  'bg-amber-100 text-amber-800 border-amber-200'
                }
              >
                {overallStatus}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Appointment Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-cyan-600">Service Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(appointment.appointment_date)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">
                    {appointment.start_time} - {appointment.end_time}
                  </p>
                </div>
              </div>

            </div>

            {appointment.description && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-sm">{appointment.description}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Assigned Staff */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-cyan-600">Assigned Staff</CardTitle>
          </CardHeader>
          <CardContent>
            {staffMembers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No staff assigned to this appointment
              </p>
            ) : (
              <div className="space-y-4">
                {staffMembers.map((staff) => (
                  <Card key={staff.id} className="border-2">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{staff.name}</h3>
                           <div className="flex gap-2 mt-1">
                             {staff.hasStarted && (
                               <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                                 In Progress
                               </Badge>
                             )}
                             {staff.hasCompleted && (
                               <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                                 Completed
                               </Badge>
                             )}
                           </div>
                            {appointment.notes && appointment.notes.includes("--- Staff Notes ---") && (
                              <div className="mt-2 text-sm text-muted-foreground">
                                <p className="font-medium">Notes:</p>
                                <div className="whitespace-pre-wrap">
                                  {(() => {
                                    const staffNotesSection = appointment.notes.split("--- Staff Notes ---")[1];
                                    if (staffNotesSection) {
                                      const staffNotesLines = staffNotesSection.trim().split('\n\n');
                                      const staffNote = staffNotesLines.find((line: string) => line.startsWith(`${staff.name}:`));
                                      if (staffNote) {
                                        const noteContent = staffNote.replace(`${staff.name}:`, '').trim();
                                        return <p className="mb-1">{noteContent}</p>;
                                      }
                                    }
                                    return null;
                                  })()}
                                </div>
                              </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                          {!staff.hasStarted && (
                            <Button
                              onClick={() => handleStartWork(staff.id)}
                              variant="outline"
                              size="sm"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Start
                            </Button>
                          )}
                          {staff.hasStarted && !staff.hasCompleted && (
                            <Button
                              onClick={() => handleCompleteWork(staff.id)}
                              variant="default"
                              size="sm"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Complete
                            </Button>
                          )}
                          {staff.hasCompleted && (
                            <Button variant="ghost" size="sm" disabled>
                              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                              Done
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* General Notes */}
        {appointment.notes && (() => {
          const generalNotes = appointment.notes.includes("--- Staff Notes ---") 
            ? appointment.notes.split("--- Staff Notes ---")[0].trim() 
            : appointment.notes;
          
          return generalNotes && generalNotes.split('\n').some((line: string) => !line.startsWith('image_url:') && line.trim() !== '');
        })() && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-cyan-600">General Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm">
                {(() => {
                  const generalNotes = appointment.notes.includes("--- Staff Notes ---") 
                    ? appointment.notes.split("--- Staff Notes ---")[0].trim() 
                    : appointment.notes;
                  
                  return generalNotes.split('\n').map((line: string, index: number) => {
                    // Skip image URLs
                    if (line.startsWith('image_url:')) return null;
                    if (line.trim() === '') return null;
                    return (
                      <p key={index} className="mb-2">
                        {line}
                      </p>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}