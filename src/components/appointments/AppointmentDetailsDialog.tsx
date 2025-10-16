
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Eye, MapPin, Edit, X, File, Check, Play, Share2, User, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Customer, Staff, Appointment } from "@/types/database";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { appointmentService, staffService } from "@/services";
import { supabase } from "@/integrations/supabase/client";

interface AppointmentDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  customer: Customer | null;
  assignedStaff: Staff | null;
  rating?: any;
  onMarkAsCompleted?: (appointment: Appointment) => void;
  onMarkAsInProgress?: (appointment: Appointment) => void;
}

export function AppointmentDetailsDialog({
  open,
  onClose,
  appointment,
  customer,
  assignedStaff,
  rating,
  onMarkAsCompleted,
  onMarkAsInProgress
}: AppointmentDetailsDialogProps) {
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);
  const [allAssignedStaff, setAllAssignedStaff] = useState<Staff[]>([]);
  
  useEffect(() => {
    if (appointment?.notes) {
      const foundImages = checkForImagesInNotes(appointment.notes);
      setImages(foundImages);
    } else {
      setImages([]);
    }
  }, [appointment]);

  // Fetch all assigned staff from appointment_staff table
  useEffect(() => {
    const fetchAssignedStaff = async () => {
      if (!appointment?.id) {
        setAllAssignedStaff([]);
        return;
      }

      try {
        // Fetch appointment_staff records
        const { data: appointmentStaffData, error } = await supabase
          .from('appointment_staff')
          .select('staff_id')
          .eq('appointment_id', appointment.id);

        if (error) {
          console.error('Error fetching appointment staff:', error);
          return;
        }

        if (appointmentStaffData && appointmentStaffData.length > 0) {
          // Fetch all staff details
          const allStaff = await staffService.getAll();
          const staffIds = appointmentStaffData.map(as => as.staff_id);
          const assignedStaffMembers = allStaff.filter(s => staffIds.includes(s.id));
          setAllAssignedStaff(assignedStaffMembers);
        } else if (appointment.staff_id) {
          // Fallback to single staff_id for backward compatibility
          const staff = await staffService.getById(appointment.staff_id);
          setAllAssignedStaff(staff ? [staff] : []);
        } else {
          setAllAssignedStaff([]);
        }
      } catch (error) {
        console.error('Error fetching assigned staff:', error);
        setAllAssignedStaff([]);
      }
    };

    fetchAssignedStaff();
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
    // Parse staff notes from appointment notes
    const staffNotesMap: Record<string, string> = {};
    if (appointment.notes) {
      const staffNoteRegex = /staff_note:([^:]+):([^\n]+)/g;
      let match;
      while ((match = staffNoteRegex.exec(appointment.notes)) !== null) {
        staffNotesMap[match[1]] = match[2];
      }
    }

    const staffInfo = allAssignedStaff.map(staff => ({ 
      id: staff.id, 
      name: staff.name,
      phone: staff.phone,
      notes: staffNotesMap[staff.id] || undefined
    }));
    
    const customerName = customer?.name || null;
    const whatsAppUrl = appointmentService.generateWhatsAppShareUrl(appointment, customerName, staffInfo);
    
    // Open WhatsApp URL in a new tab
    window.open(whatsAppUrl, '_blank');
  };

  const handleShareToCustomer = () => {
    if (!appointment || !customer) return;
    
    const publicUrl = `${window.location.origin}/appointments/view/${appointment.id}`;
    const formattedDate = new Date(appointment.appointment_date).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });
    
    const message = `Thank you for choosing Reex Empire!\n\n` + `Your appointment for ${appointment.title} has been completed.\n\n` + `Unit #${customer.unit_number}\n` + `Date: ${formattedDate}.\n${publicUrl}\n\nWe appreciate your business!`;
    
    const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
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
  
  const isCompleted = appointment.status.toLowerCase() === "completed";
  const isInProgress = appointment.status.toLowerCase() === "in progress";
  const isCancelled = appointment.status.toLowerCase() === "cancelled";
  const isPendingReview = appointment.status.toLowerCase() === "pending review";
  
  // Remove image_url and work_photo links from notes for all statuses
  let cleanNotes = appointment.notes?.replace(/image_url:[^\s]+/g, '').replace(/work_photo:[^\s]+/g, '') || '';
  cleanNotes = cleanNotes.trim();
  
  const getStatusBadge = () => {
    const status = appointment.status.toLowerCase().replace(/\s+/g, '');
    
    switch(status) {
      case "completed":
        return <Badge variant="completed">Completed</Badge>;
      case "inprogress":
        return <Badge variant="inprogress">In Progress</Badge>;
      case "pendingreview":
        return <Badge className="bg-purple-500 hover:bg-purple-600">In Review</Badge>;
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

            {allAssignedStaff.length > 0 && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 mt-1 text-gray-500" />
                <div>
                  <p className="font-medium">Assigned Staff</p>
                  {allAssignedStaff.map((staff, index) => (
                    <p key={staff.id} className="text-sm">
                      {staff.name}
                    </p>
                  ))}
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

            {/* Rating Section */}
            {rating && isCompleted && (
              <div className="mt-4">
                <p className="font-medium mb-2">Customer Rating</p>
                <div className="p-3 bg-gray-50 rounded-md space-y-2">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= rating.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-1 font-semibold">{rating.rating}/5</span>
                  </div>
                  {rating.comment && (
                    <p className="text-sm text-gray-700">{rating.comment}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mt-4">
          {!isCompleted && !isPendingReview && (
            <Button 
              onClick={handleShareWhatsApp} 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 text-green-600 border-green-600 hover:bg-green-50"
            >
              <Share2 className="h-4 w-4" />
              Share via WhatsApp
            </Button>
          )}
          
          {isCompleted && (
          <>
            <Button 
              onClick={handleShareToCustomer} 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 text-green-600 border-green-600 hover:bg-green-50"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>

            {/* View Appointment Button */}
            <Button 
              onClick={() => window.open(`/appointments/view/${appointment.id}`, '_blank')} 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <Eye className="h-4 w-4" />
                View
              </Button>
            </>
          )}
          
          {isPendingReview && (
            <Button 
              onClick={() => window.open(`/appointments/view/${appointment.id}`, '_blank')} 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <File className="h-4 w-4" />
              Review Job
            </Button>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {!isCompleted && !isCancelled && (
              <>
                {!isInProgress && !isPendingReview && (
                  <Button 
                    onClick={handleMarkInProgress} 
                    className="w-full sm:w-auto flex items-center justify-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Start
                  </Button>
                )}
                {isPendingReview && (
                  <Button 
                    onClick={handleMarkCompleted} 
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600"
                  >
                    <Check className="h-4 w-4" />
                    Mark Completed
                  </Button>
                )}
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
    </Dialog>
  );
}
