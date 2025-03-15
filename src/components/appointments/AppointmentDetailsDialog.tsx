
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, closeDialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, MapPin, Edit, CheckCircle } from "lucide-react";
import { Customer, Staff, Appointment } from "@/types/database";
import { closeDropdown } from "@/components/ui/dropdown-menu";

interface AppointmentDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  customer: Customer | null;
  assignedStaff: Staff | null;
  onMarkComplete?: (appointment: Appointment) => void;
  onEdit?: (appointmentId: string) => void;
}

export function AppointmentDetailsDialog({ 
  open, 
  onClose, 
  appointment, 
  customer, 
  assignedStaff, 
  onMarkComplete,
  onEdit
}: AppointmentDetailsDialogProps) {
  if (!appointment) return null;

  // Format time from "HH:MM" format to "h:MM AM/PM"
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  // Handle dialog close safely
  const handleClose = () => {
    // Use the closeDialog helper to properly close the dialog
    closeDialog();
    
    // Set a larger timeout to prevent UI freeze
    setTimeout(() => {
      // After dialog is safely closed, close dropdown if open
      closeDropdown();
      
      // Finally call the onClose handler
      onClose();
    }, 100);
  };

  // Handle edit navigation safely
  const handleEdit = () => {
    // Close dialog first
    closeDialog();
    
    // Then close dropdown
    closeDropdown();
    
    // Wait until UI is updated before navigation
    setTimeout(() => {
      onClose();
      if (onEdit) onEdit(appointment.id);
    }, 150);
  };

  // Handle mark as completed
  const handleMarkComplete = () => {
    if (onMarkComplete) {
      onMarkComplete(appointment);
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        handleClose();
      }
    }}>
      <DialogContent 
        className="sm:max-w-md"
        onInteractOutside={(e) => {
          e.preventDefault();
          handleClose();
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          handleClose();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">{appointment.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Badge className={
              appointment.status === "Confirmed" ? "bg-blue-500" : 
              appointment.status === "Completed" ? "bg-green-500" : 
              appointment.status === "Cancelled" ? "bg-red-500" : 
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

            {customer && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 mt-1 text-gray-500" />
                <div>
                  <p className="font-medium">Customer</p>
                  <p className="text-sm">
                    {customer.unit_number && `#${customer.unit_number} - `}
                    {customer.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {customer.phone || customer.email || "No contact info"}
                  </p>
                </div>
              </div>
            )}

            {assignedStaff && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 mt-1 text-gray-500" />
                <div>
                  <p className="font-medium">Assigned Staff</p>
                  <p className="text-sm">{assignedStaff.name}</p>
                  <p className="text-sm text-gray-600">{assignedStaff.position || "Staff"}</p>
                </div>
              </div>
            )}

            {appointment.location && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 text-gray-500" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-gray-600">{appointment.location}</p>
                </div>
              </div>
            )}

            {appointment.notes && (
              <div className="mt-4">
                <p className="font-medium">Notes</p>
                <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                  {appointment.notes}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          
          <div className="flex gap-2">
            {appointment.status !== "Completed" && onMarkComplete && (
              <Button onClick={handleMarkComplete} variant="secondary" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Mark as Completed
              </Button>
            )}
            
            {onEdit && (
              <Button onClick={handleEdit} className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
