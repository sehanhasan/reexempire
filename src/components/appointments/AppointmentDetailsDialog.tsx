
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Edit, X, Check, Play, Share2, User, Upload, FileImage } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Customer, Staff, Appointment } from "@/types/database";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { appointmentService } from "@/services";
import { supabase } from "@/integrations/supabase/client";

interface AppointmentDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  customer: Customer | null;
  assignedStaff: Staff | null;
  onMarkAsCompleted?: (appointment: Appointment) => void;
  onMarkAsInProgress?: (appointment: Appointment) => void;
  onSubmitForReview?: (appointment: Appointment) => void;
}

export function AppointmentDetailsDialog({
  open,
  onClose,
  appointment,
  customer,
  assignedStaff,
  onMarkAsCompleted,
  onMarkAsInProgress,
  onSubmitForReview
}: AppointmentDetailsDialogProps) {
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);
  const [workPhotos, setWorkPhotos] = useState<string[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  useEffect(() => {
    if (appointment?.notes) {
      const foundImages = checkForImagesInNotes(appointment.notes);
      const foundWorkPhotos = checkForWorkPhotos(appointment.notes);
      setImages(foundImages);
      setWorkPhotos(foundWorkPhotos);
    } else {
      setImages([]);
      setWorkPhotos([]);
    }
  }, [appointment]);
  
  if (!appointment) return null;
  
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };
  
  const handleClose = () => {
    onClose();
  };
  
  const handleEdit = () => {
    onClose();
    setTimeout(() => {
      navigate(`/schedule/edit/${appointment.id}`);
    }, 150);
  };
  
  const handleMarkCompleted = () => {
    try {
      if (onMarkAsCompleted && appointment) {
        onMarkAsCompleted(appointment);
        onClose();
      }
    } catch (error) {
      console.error("Error marking as completed:", error);
      toast({
        title: "Error",
        description: "Could not mark appointment as completed",
        variant: "destructive"
      });
    }
  };
  
  const handleMarkInProgress = () => {
    try {
      if (onMarkAsInProgress && appointment) {
        onMarkAsInProgress(appointment);
        onClose();
      }
    } catch (error) {
      console.error("Error marking as in progress:", error);
      toast({
        title: "Error",
        description: "Could not mark appointment as in progress",
        variant: "destructive"
      });
    }
  };

  const handleShareWhatsApp = () => {
    const staffInfo = assignedStaff ? [{ 
      id: assignedStaff.id, 
      name: assignedStaff.name,
      phone: assignedStaff.phone 
    }] : [];
    
    const customerName = customer?.name || null;
    const whatsAppUrl = appointmentService.generateWhatsAppShareUrl(appointment, customerName, staffInfo);
    
    // Open WhatsApp URL in a new tab
    window.open(whatsAppUrl, '_blank');
  };
  
  const checkForImagesInNotes = (notes: string) => {
    if (notes && notes.includes("image_url:")) {
      const regex = /image_url:([^\s]+)/g;
      let match;
      const foundImages = [];
      while ((match = regex.exec(notes)) !== null) {
        foundImages.push(match[1]);
      }
      return foundImages;
    }
    return [];
  };

  const checkForWorkPhotos = (notes: string) => {
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
    if (!files || !appointment) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${appointment.id}-${Date.now()}-${i}.${fileExt}`;
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

      // Add work photos to appointment notes
      const currentNotes = appointment.notes || '';
      const workPhotoTags = uploadedUrls.map(url => `work_photo:${url}`).join(' ');
      const updatedNotes = currentNotes ? `${currentNotes} ${workPhotoTags}` : workPhotoTags;

      await appointmentService.update(appointment.id, { notes: updatedNotes });
      
      setWorkPhotos([...workPhotos, ...uploadedUrls]);
      toast({
        title: "Success",
        description: "Work photos uploaded successfully"
      });
      setShowUploadDialog(false);
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast({
        title: "Error",
        description: "Failed to upload work photos",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitForReview = () => {
    if (workPhotos.length === 0) {
      setShowUploadDialog(true);
    } else {
      proceedWithReview();
    }
  };

  const proceedWithReview = () => {
    if (onSubmitForReview && appointment) {
      onSubmitForReview(appointment);
      onClose();
    }
  };

  const skipUploadAndReview = () => {
    setShowUploadDialog(false);
    proceedWithReview();
  };
  
  const cleanNotes = appointment.notes?.replace(/image_url:[^\s]+/g, '').replace(/work_photo:[^\s]+/g, '').trim() || '';
  const isCompleted = appointment.status.toLowerCase() === "completed";
  const isInProgress = appointment.status.toLowerCase() === "in progress";
  const isPendingReview = appointment.status.toLowerCase() === "pending review";
  const isCancelled = appointment.status.toLowerCase() === "cancelled";
  
  const getStatusBadge = () => {
    const status = appointment.status.toLowerCase().replace(/\s+/g, '');
    
    switch(status) {
      case "completed":
        return <Badge variant="completed">Completed</Badge>;
      case "inprogress":
        return <Badge variant="inprogress">In Progress</Badge>;
      case "pendingreview":
        return <Badge variant="pending">In Review</Badge>;
      case "cancelled":
        return <Badge variant="cancelled">Cancelled</Badge>;
      case "confirmed":
      case "scheduled":
        return <Badge variant="scheduled">Scheduled</Badge>;
      case "pending":
        return <Badge variant="pending">Pending</Badge>;
      default:
        return <Badge>{appointment.status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl">{appointment.title}</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 mt-1 text-gray-500" />
              <div>
                <p className="font-medium">Date & Time</p>
                <p className="text-sm text-gray-600">
                  {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-sm text-gray-600">
                  {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                </p>
              </div>
            </div>

            {customer?.unit_number && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 text-gray-500" />
                <div>
                  <p className="font-medium">Unit Number</p>
                  <p className="text-sm">#{customer.unit_number}</p>
                </div>
              </div>
            )}

            {assignedStaff && !isCompleted && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 mt-1 text-gray-500" />
                <div>
                  <p className="font-medium">Assigned Staff</p>
                  <p className="text-sm">{assignedStaff.name}</p>
                  {assignedStaff.phone && (
                    <p className="text-sm text-gray-600">{assignedStaff.phone}</p>
                  )}
                </div>
              </div>
            )}

            {cleanNotes && (
              <div className="mt-4">
                <p className="font-medium">Notes</p>
                <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                  {cleanNotes}
                </div>
              </div>
            )}

            {images.length > 0 && (
              <div className="mt-4">
                <p className="font-medium">Attached Images</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img src={image} alt={`Attachment ${index + 1}`} className="rounded-md w-full h-32 object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {workPhotos.length > 0 && (
              <div className="mt-4">
                <p className="font-medium">Work Photos</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {workPhotos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img src={photo} alt={`Work Photo ${index + 1}`} className="rounded-md w-full h-32 object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mt-4">
          {!isCompleted && !isPendingReview && (
            <Button 
              onClick={() => {
                const publicUrl = `${window.location.origin}/appointments/view/${appointment.id}`;
                window.open(publicUrl, '_blank');
              }} 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <Share2 className="h-4 w-4" />
              Review Job
            </Button>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {!isCompleted && !isCancelled && (
              <>
                {!isInProgress && !isPendingReview ? (
                  <Button 
                    onClick={handleMarkInProgress} 
                    className="w-full sm:w-auto flex items-center justify-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Start
                  </Button>
                ) : isInProgress ? (
                  <Button 
                    onClick={handleSubmitForReview} 
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="h-4 w-4" />
                    Submit for Review
                  </Button>
                ) : isPendingReview ? (
                  <Button 
                    onClick={handleMarkCompleted} 
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600"
                  >
                    <Check className="h-4 w-4" />
                    Mark Completed
                  </Button>
                ) : null}
              </>
            )}
            <Button 
              onClick={handleEdit} 
              variant="secondary"
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Upload Work Photos Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Work Photos (Optional)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Would you like to upload photos of the completed work before submitting for review?
            </p>
            <div className="flex flex-col gap-2">
              <label htmlFor="work-photos" className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <FileImage className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-sm font-medium">Click to upload photos</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB each</p>
                </div>
                <input
                  id="work-photos"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={skipUploadAndReview}
              disabled={uploading}
              className="w-full sm:w-auto"
            >
              Skip
            </Button>
            <Button 
              onClick={() => document.getElementById('work-photos')?.click()}
              disabled={uploading}
              className="w-full sm:w-auto"
            >
              {uploading ? "Uploading..." : "Upload Photos"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
