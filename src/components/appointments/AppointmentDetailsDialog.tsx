
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Edit, X, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Customer, Staff, Appointment } from "@/types/database";
import { closeDropdown } from "@/components/ui/dropdown-menu";
import { useState } from "react";

interface AppointmentDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  customer: Customer | null;
  assignedStaff: Staff | null;
  onMarkAsCompleted?: (appointment: Appointment) => void;
}

export function AppointmentDetailsDialog({ 
  open, 
  onClose, 
  appointment, 
  customer, 
  assignedStaff,
  onMarkAsCompleted
}: AppointmentDetailsDialogProps) {
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);

  if (!appointment) return null;

  // Format time from "HH:MM" format to "h:MM AM/PM"
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  // Handle dialog close safely
  const handleClose = () => {
    onClose();
  };

  // Handle edit navigation safely
  const handleEdit = () => {
    onClose();
    setTimeout(() => {
      navigate(`/schedule/edit/${appointment.id}`);
    }, 150);
  };

  const handleMarkCompleted = () => {
    if (onMarkAsCompleted && appointment) {
      onMarkAsCompleted(appointment);
      onClose();
    }
  };

  // Check for image URLs in the notes
  const checkForImagesInNotes = () => {
    if (appointment.notes && appointment.notes.includes("image_url:")) {
      const regex = /image_url:([^\s]+)/g;
      let match;
      const foundImages = [];
      while ((match = regex.exec(appointment.notes)) !== null) {
        foundImages.push(match[1]);
      }
      return foundImages;
    }
    return [];
  };

  // Extract images if they exist
  useState(() => {
    if (appointment?.notes) {
      setImages(checkForImagesInNotes());
    }
  });

  // Clean notes by removing the image URLs
  const cleanNotes = appointment.notes?.replace(/image_url:[^\s]+/g, '') || '';

  const isCompleted = appointment.status.toLowerCase() === "completed";

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        handleClose();
      }
    }}>
      <DialogContent 
        className="sm:max-w-md"
      >
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
            <Badge className={
              appointment.status.toLowerCase() === "confirmed" ? "bg-blue-500" : 
              appointment.status.toLowerCase() === "completed" ? "bg-green-500" : 
              appointment.status.toLowerCase() === "cancelled" ? "bg-red-500" : 
              "bg-yellow-500"
            }>
              {appointment.status}
            </Badge>
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

            {assignedStaff && (
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-1 text-gray-500" />
                <div>
                  <p className="font-medium">Assigned Staff</p>
                  <p className="text-sm">{assignedStaff.name}</p>
                  <p className="text-sm text-gray-600">{assignedStaff.position || "Staff"}</p>
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

            {/* Display attached images if any */}
            {images.length > 0 && (
              <div className="mt-4">
                <p className="font-medium">Attached Images</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={image} 
                        alt={`Attachment ${index + 1}`}
                        className="rounded-md w-full h-32 object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between gap-2">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <div className="flex gap-2">
            {!isCompleted && onMarkAsCompleted && (
              <Button onClick={handleMarkCompleted} variant="secondary" className="gap-2">
                <Check className="h-4 w-4" />
                Mark Completed
              </Button>
            )}
            <Button onClick={handleEdit} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
