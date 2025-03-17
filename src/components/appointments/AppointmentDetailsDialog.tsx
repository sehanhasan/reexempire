import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Edit, X, Check, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Customer, Staff, Appointment } from "@/types/database";
import { useState, useEffect } from "react";
interface AppointmentDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  customer: Customer | null;
  assignedStaff: Staff | null;
  onMarkAsCompleted?: (appointment: Appointment) => void;
  onMarkAsInProgress?: (appointment: Appointment) => void;
}
export function AppointmentDetailsDialog({
  open,
  onClose,
  appointment,
  customer,
  assignedStaff,
  onMarkAsCompleted,
  onMarkAsInProgress
}: AppointmentDetailsDialogProps) {
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);
  useEffect(() => {
    if (appointment?.notes) {
      const foundImages = checkForImagesInNotes(appointment.notes);
      setImages(foundImages);
    } else {
      setImages([]);
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
    if (onMarkAsCompleted && appointment) {
      onMarkAsCompleted(appointment);
      onClose();
    }
  };
  const handleMarkInProgress = () => {
    if (onMarkAsInProgress && appointment) {
      onMarkAsInProgress(appointment);
      onClose();
    }
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
  const cleanNotes = appointment.notes?.replace(/image_url:[^\s]+/g, '') || '';
  const isCompleted = appointment.status.toLowerCase() === "completed";
  const isInProgress = appointment.status.toLowerCase() === "in progress";
  return <Dialog open={open} onOpenChange={open => {
    if (!open) {
      handleClose();
    }
  }}>
      <DialogContent className="sm:max-w-md">
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
            <Badge className={appointment.status.toLowerCase() === "confirmed" || appointment.status.toLowerCase() === "scheduled" ? "bg-blue-500" : appointment.status.toLowerCase() === "completed" ? "bg-green-500" : appointment.status.toLowerCase() === "in progress" ? "bg-yellow-500" : appointment.status.toLowerCase() === "cancelled" ? "bg-red-500" : "bg-gray-500"}>
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

            {customer?.unit_number && <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 text-gray-500" />
                <div>
                  <p className="font-medium">Unit Number</p>
                  <p className="text-sm">#{customer.unit_number}</p>
                </div>
              </div>}

            {cleanNotes && <div className="mt-4">
                <p className="font-medium">Notes</p>
                <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                  {cleanNotes}
                </div>
              </div>}

            {images.length > 0 && <div className="mt-4">
                <p className="font-medium">Attached Images</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {images.map((image, index) => <div key={index} className="relative">
                      <img src={image} alt={`Attachment ${index + 1}`} className="rounded-md w-full h-32 object-cover" />
                    </div>)}
                </div>
              </div>}
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between gap-2">
          
          <div className="flex gap-2">
            {!isCompleted && !isInProgress && onMarkAsInProgress && <Button onClick={handleMarkInProgress} variant="secondary" className="gap-2">
                <Play className="h-4 w-4" />
                Start
              </Button>}
            {!isCompleted && onMarkAsCompleted && <Button onClick={handleMarkCompleted} variant="secondary" className="gap-2 bg-green-500 hover:bg-green-600 text-white">
                <Check className="h-4 w-4" />
                Mark Completed
              </Button>}
            <Button onClick={handleEdit} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
}