import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, User, FileText, Play, CheckCircle, AlertCircle, Upload, FileImage } from "lucide-react";
import { appointmentService, customerService, staffService } from "@/services";
import { formatDate } from "@/utils/formatters";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  const [workPhotos, setWorkPhotos] = useState<string[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);

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
        
        // Check for work photos in notes
        if (appointmentData.notes) {
          const foundPhotos = checkForWorkPhotos(appointmentData.notes);
          setWorkPhotos(foundPhotos);
        }
        
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

  const checkForWorkPhotos = (notes: string): string[] => {
    if (notes && notes.includes("work_photo:")) {
      const regex = /work_photo:([^\s]+)/g;
      let match;
      const foundPhotos = [];
      while ((match = regex.exec(notes)) !== null) {
        foundPhotos.push(match[1]);
      }
      return foundPhotos;
    }
    return [];
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `appointment-work-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('pdfs')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('pdfs')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      // Update work photos state
      setWorkPhotos(prev => [...prev, ...uploadedUrls]);

      // Update appointment notes with work photo URLs
      const photoTags = uploadedUrls.map(url => `work_photo:${url}`).join(' ');
      const updatedNotes = appointment.notes 
        ? `${appointment.notes} ${photoTags}` 
        : photoTags;

      await appointmentService.update(id!, { notes: updatedNotes });
      setAppointment({ ...appointment, notes: updatedNotes });

      toast({
        title: "Success",
        description: `${uploadedUrls.length} photo(s) uploaded successfully`,
      });
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast({
        title: "Error",
        description: "Failed to upload photos",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitForReview = async (staffId: string) => {
    setShowUploadDialog(true);
  };

  const proceedWithReview = async (staffId: string) => {
    try {
      await appointmentService.update(id!, { status: 'Pending Review' });
      
      setStaffMembers(prev => 
        prev.map(staff => 
          staff.id === staffId 
            ? { ...staff, hasCompleted: true }
            : staff
        )
      );
      
      setOverallStatus('Pending Review');
      setShowUploadDialog(false);
      
      toast({
        title: "Submitted for Review",
        description: "Your work has been submitted for admin review",
      });
    } catch (error) {
      console.error("Error submitting for review:", error);
      toast({
        title: "Error",
        description: "Failed to submit for review",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'default';
      case 'in progress':
        return 'secondary';
      case 'pending review':
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
      case 'pending review':
        return 'text-purple-600';
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
                variant={
                  overallStatus.toLowerCase() === 'confirmed' ? 'default' : 
                  overallStatus.toLowerCase() === 'completed' ? 'default' : 
                  'secondary'
                } 
                className={
                  overallStatus.toLowerCase() === 'confirmed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                  overallStatus.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                  overallStatus.toLowerCase() === 'pending review' ? 'bg-purple-100 text-purple-800 border-purple-200' :
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

        {/* Assigned Staff - Hidden when Completed */}
        {overallStatus.toLowerCase() !== 'completed' && (
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
                               {staff.hasStarted && overallStatus.toLowerCase() !== 'pending review' && (
                                 <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                                   In Progress
                                 </Badge>
                               )}
                               {overallStatus.toLowerCase() === 'pending review' && (
                                 <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                                   In Review
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
                            {!staff.hasStarted && overallStatus.toLowerCase() !== 'pending review' && (
                              <Button
                                onClick={() => handleStartWork(staff.id)}
                                variant="outline"
                                size="sm"
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Start
                              </Button>
                            )}
                            {staff.hasStarted && !staff.hasCompleted && overallStatus.toLowerCase() !== 'pending review' && (
                              <Button
                                onClick={() => handleSubmitForReview(staff.id)}
                                variant="default"
                                size="sm"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Submit for Review
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
        )}

        {/* Work Photos */}
        {workPhotos.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-cyan-600">Work Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {workPhotos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={photo} 
                      alt={`Work photo ${index + 1}`} 
                      className="rounded-lg w-full h-40 object-cover border-2 border-gray-200"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Upload Work Photos Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Work Photos (Optional)</DialogTitle>
              <DialogDescription>
                Add photos of your completed work before submitting for review.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileImage className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                <label className="cursor-pointer">
                  <span className="text-sm text-muted-foreground">
                    Click to upload photos
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>

              {workPhotos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploaded Photos ({workPhotos.length})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {workPhotos.slice(-3).map((photo, index) => (
                      <img 
                        key={index}
                        src={photo} 
                        alt={`Preview ${index + 1}`} 
                        className="rounded w-full h-20 object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (staffMembers[0]) {
                    proceedWithReview(staffMembers[0].id);
                  }
                }}
                disabled={uploading}
                className="w-full sm:w-auto"
              >
                Skip & Submit
              </Button>
              <Button
                onClick={() => {
                  if (staffMembers[0]) {
                    proceedWithReview(staffMembers[0].id);
                  }
                }}
                disabled={uploading}
                className="w-full sm:w-auto"
              >
                {uploading ? "Uploading..." : "Submit for Review"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}