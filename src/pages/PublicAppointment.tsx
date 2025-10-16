import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, User, FileText, Play, CheckCircle, AlertCircle, Upload, FileImage, X, Star } from "lucide-react";
import { appointmentService, customerService, staffService } from "@/services";
import { formatDate, formatTime } from "@/utils/formatters";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RatingDialog } from "@/components/appointments/RatingDialog";

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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string>('');
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [rating, setRating] = useState<any>(null);
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);

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

        // Fetch appointment_staff records for multi-staff support
        const { data: appointmentStaffData, error: staffError } = await supabase
          .from('appointment_staff')
          .select('*')
          .eq('appointment_id', id);

        if (staffError) {
          console.error("Error fetching appointment staff:", staffError);
        }

        // Fetch all staff to get names
        const allStaff = await staffService.getAll();
        
        const assignedStaff: StaffMember[] = [];
        
        if (appointmentStaffData && appointmentStaffData.length > 0) {
          // Multi-staff support: use appointment_staff table
          appointmentStaffData.forEach((as: any) => {
            const staff = allStaff.find((s: any) => s.id === as.staff_id);
            if (staff) {
              assignedStaff.push({
                id: staff.id,
                name: staff.name,
                hasStarted: as.has_started,
                hasCompleted: as.has_completed,
              });
            }
          });
        } else if (appointmentData.staff_id) {
          // Fallback to single staff_id for backward compatibility
          const staff = allStaff.find((s: any) => s.id === appointmentData.staff_id);
          if (staff) {
            assignedStaff.push({
              id: staff.id,
              name: staff.name,
              hasStarted: appointmentData.status === 'In Progress' || appointmentData.status === 'Pending Review' || appointmentData.status === 'Completed',
              hasCompleted: appointmentData.status === 'Pending Review' || appointmentData.status === 'Completed',
            });
          }
        }
        
        setStaffMembers(assignedStaff);
        
        // Determine overall status based on staff members
        let calculatedStatus = appointmentData.status || 'Confirmed';
        if (assignedStaff.length > 0) {
          const allCompleted = assignedStaff.every(s => s.hasCompleted);
          const anyStarted = assignedStaff.some(s => s.hasStarted);
          
          if (allCompleted && calculatedStatus !== 'Completed') {
            calculatedStatus = 'Pending Review';
          } else if (anyStarted && calculatedStatus === 'Confirmed') {
            calculatedStatus = 'In Progress';
          }
        }
        
        setOverallStatus(calculatedStatus);
        
        // Check for work photos in notes
        if (appointmentData.notes) {
          const foundPhotos = checkForWorkPhotos(appointmentData.notes);
          setWorkPhotos(foundPhotos);
        }
        
        // Fetch rating if appointment is completed
        const { data: ratingData } = await supabase
          .from('appointment_ratings')
          .select('*')
          .eq('appointment_id', id)
          .maybeSingle();
        
        setRating(ratingData);
        
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

    // Set up realtime subscriptions
    const appointmentChannel = supabase
      .channel(`appointment-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `id=eq.${id}`
        },
        async (payload) => {
          console.log('Appointment updated:', payload);
          fetchAppointmentData();
        }
      )
      .subscribe();

    const staffChannel = supabase
      .channel(`appointment-staff-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointment_staff',
          filter: `appointment_id=eq.${id}`
        },
        async (payload) => {
          console.log('Appointment staff updated:', payload);
          fetchAppointmentData();
        }
      )
      .subscribe();

    const ratingChannel = supabase
      .channel(`appointment-rating-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointment_ratings',
          filter: `appointment_id=eq.${id}`
        },
        async (payload) => {
          console.log('Rating updated:', payload);
          fetchAppointmentData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(appointmentChannel);
      supabase.removeChannel(staffChannel);
      supabase.removeChannel(ratingChannel);
    };
  }, [id]);

  const handleStartWork = async (staffId: string) => {
    try {
      // Update appointment_staff record
      const { error } = await supabase
        .from('appointment_staff')
        .update({ 
          has_started: true, 
          started_at: new Date().toISOString() 
        })
        .eq('appointment_id', id!)
        .eq('staff_id', staffId);

      if (error) throw error;

      // Update appointment status to "In Progress"
      await appointmentService.update(id!, { status: 'In Progress' });
      
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

      // Add to pending photos (not yet saved to appointment)
      setPendingPhotos(prev => [...prev, ...uploadedUrls]);

      toast({
        title: "Photos Added",
        description: `${uploadedUrls.length} photo(s) added. Click Submit for Review to save.`,
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

  const handleRemovePhoto = (index: number) => {
    setPendingPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitForReview = async (staffId: string) => {
    // Store the staffId for later use in proceedWithReview
    const staffMember = staffMembers.find(s => s.id === staffId);
    if (staffMember) {
      // Pass staffId through the dialog
      setShowUploadDialog(true);
    }
  };

  const proceedWithReview = async () => {
    // Find the staff member who triggered the submit
    const staffToSubmit = staffMembers.find(s => s.hasStarted && !s.hasCompleted);
    if (!staffToSubmit) return;
    
    const staffId = staffToSubmit.id;
    try {
      // Save pending photos to appointment notes
      if (pendingPhotos.length > 0) {
        const photoTags = pendingPhotos.map(url => `work_photo:${url}`).join(' ');
        const updatedNotes = appointment.notes 
          ? `${appointment.notes} ${photoTags}` 
          : photoTags;

        await appointmentService.update(id!, { notes: updatedNotes });
        setAppointment({ ...appointment, notes: updatedNotes });
        setWorkPhotos(prev => [...prev, ...pendingPhotos]);
        setPendingPhotos([]);
      }

      // Update appointment_staff record
      const { error: staffError } = await supabase
        .from('appointment_staff')
        .update({ 
          has_completed: true, 
          completed_at: new Date().toISOString() 
        })
        .eq('appointment_id', id!)
        .eq('staff_id', staffId);

      if (staffError) throw staffError;

      // Check if all staff have completed
      const { data: allStaffData } = await supabase
        .from('appointment_staff')
        .select('has_completed')
        .eq('appointment_id', id!);

      const allCompleted = allStaffData?.every(s => s.has_completed) || false;

      // Update appointment status
      const newStatus = allCompleted ? 'Pending Review' : 'In Progress';
      await appointmentService.update(id!, { status: newStatus });
      
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
                    {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
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
                  <div 
                    key={index} 
                    className="relative cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      setLightboxImage(photo);
                      setLightboxOpen(true);
                    }}
                  >
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

        {/* Rate the Work - Only for Completed Status and if not already rated */}
        {overallStatus.toLowerCase() === 'completed' && !rating && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <Button
                onClick={() => setRatingDialogOpen(true)}
                className="w-full flex items-center justify-center gap-2"
                variant="default"
              >
                <Star className="h-5 w-5" />
                Rate the Work
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Lightbox Dialog */}
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-4xl w-full p-0">
            <div className="relative">
              <img
                src={lightboxImage}
                alt="Work photo"
                className="w-full h-auto"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setLightboxOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>


        {/* Rating Section - Show if completed and rated */}
        {overallStatus.toLowerCase() === 'completed' && rating && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-cyan-600">Customer Rating</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 ${
                      star <= rating.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 text-lg font-semibold">{rating.rating}/5</span>
              </div>
              {rating.comment && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700">{rating.comment}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Rating Dialog */}
        <RatingDialog
          open={ratingDialogOpen}
          onOpenChange={setRatingDialogOpen}
          appointmentId={id!}
          appointmentTitle={appointment?.title || ""}
          onRatingSubmitted={(ratingData) => {
            // Immediately update the rating state to hide the button
            setRating({
              appointment_id: id!,
              rating: ratingData.rating,
              comment: ratingData.comment,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              id: 'temp-id', // Temporary ID, will be replaced by realtime subscription
            });
          }}
        />

        {/* Upload Work Photos Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Work Photos</DialogTitle>
              <DialogDescription>
                Add at least one photo of your completed work before submitting for review.
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

              {pendingPhotos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploaded Photos ({pendingPhotos.length})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {pendingPhotos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={photo} 
                          alt={`Preview ${index + 1}`} 
                          className="rounded w-full h-20 object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => handleRemovePhoto(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                onClick={proceedWithReview}
                disabled={uploading || pendingPhotos.length === 0}
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