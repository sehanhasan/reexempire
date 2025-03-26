
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Calendar, User, Check, Image, X, Phone, Share } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { appointmentService, staffService, customerService } from "@/services";
import { CustomerSelector } from "@/components/appointments/CustomerSelector";
import { Customer, Staff } from "@/types/database";

export default function AddAppointment() {
  const navigate = useNavigate();
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const isEditMode = !!id;

  // Form state
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Confirmed");
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [staffNotes, setStaffNotes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Image attachment state
  const [attachedImages, setAttachedImages] = useState<File[]>([]);
  const [imageURLs, setImageURLs] = useState<string[]>([]);

  // Customer selection
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerSelectorOpen, setIsCustomerSelectorOpen] = useState(false);

  // WhatsApp sharing
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // Fetch staff members
  const {
    data: staffMembers = [],
    isLoading: isLoadingStaff
  } = useQuery({
    queryKey: ['staff'],
    queryFn: staffService.getAll
  });

  // Fetch appointment data when in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchAppointmentData = async () => {
        try {
          setIsLoading(true);
          const appointment = await appointmentService.getById(id);
          if (appointment) {
            // Set basic appointment data
            setTitle(appointment.title || "");
            setDate(appointment.appointment_date || new Date().toISOString().split("T")[0]);
            setStartTime(appointment.start_time || "09:00");
            setEndTime(appointment.end_time || "10:00");
            setNotes(appointment.notes || "");
            setStatus(appointment.status || "Confirmed");

            // Set staff data
            if (appointment.staff_id) {
              setSelectedStaff([appointment.staff_id]);
            }

            // Extract image URLs from notes if present
            if (appointment.notes && appointment.notes.includes("image_url:")) {
              const regex = /image_url:([^\s]+)/g;
              let match;
              const foundImages = [];
              while ((match = regex.exec(appointment.notes)) !== null) {
                foundImages.push(match[1]);
              }
              setImageURLs(foundImages);
              
              // Clean notes by removing the image URLs
              setNotes(appointment.notes.replace(/image_url:[^\s]+/g, '').trim());
            }

            // Fetch customer data
            if (appointment.customer_id) {
              const customer = await customerService.getById(appointment.customer_id);
              setSelectedCustomer(customer);
            }
          }
          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching appointment data:", error);
          toast({
            title: "Error",
            description: "Failed to load appointment data. Please try again.",
            variant: "destructive"
          });
          setIsLoading(false);
        }
      };
      fetchAppointmentData();
    }
  }, [id, isEditMode]);

  const toggleStaffSelection = (staffId: string) => {
    if (selectedStaff.includes(staffId)) {
      setSelectedStaff(selectedStaff.filter(id => id !== staffId));

      // Create a new object without the removed staff's notes
      const newStaffNotes = {
        ...staffNotes
      };
      delete newStaffNotes[staffId];
      setStaffNotes(newStaffNotes);
    } else {
      setSelectedStaff([...selectedStaff, staffId]);
    }
  };

  const handleStaffNoteChange = (staffId: string, note: string) => {
    setStaffNotes(prev => ({
      ...prev,
      [staffId]: note
    }));
  };

  // Handle image attachment
  const handleImageAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setAttachedImages(prev => [...prev, ...newFiles]);
      
      // Create temporary URLs for preview
      const newURLs = newFiles.map(file => URL.createObjectURL(file));
      setImageURLs(prev => [...prev, ...newURLs]);
    }
  };

  // Remove attached image
  const removeImage = (index: number) => {
    setAttachedImages(prev => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
    
    setImageURLs(prev => {
      const updated = [...prev];
      // If it's a temporary URL, revoke it to avoid memory leaks
      if (updated[index].startsWith('blob:')) {
        URL.revokeObjectURL(updated[index]);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  // Convert images to base64 for storage
  const convertImagesToBase64 = async () => {
    return Promise.all(
      attachedImages.map(
        file => new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
      )
    );
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  // Create WhatsApp message
  const createWhatsAppMessage = (appointmentData) => {
    const formattedDate = formatDate(appointmentData.appointment_date);
    const formattedStartTime = formatTime(appointmentData.start_time);
    const formattedEndTime = formatTime(appointmentData.end_time);
    
    // Get assigned staff names
    const assignedStaffNames = selectedStaff
      .map(staffId => {
        const staff = staffMembers.find((s: Staff) => s.id === staffId);
        return staff ? staff.name : 'Unknown staff';
      })
      .join(', ');
    
    // Customer info
    const customerInfo = selectedCustomer 
      ? `${selectedCustomer.name}${selectedCustomer.phone ? ` - ${selectedCustomer.phone}` : ''}`
      : 'No customer selected';
    
    // Location info  
    const locationInfo = selectedCustomer && selectedCustomer.address
      ? selectedCustomer.address
      : 'No location specified';
    
    // Staff notes
    const staffNotesText = Object.entries(staffNotes)
      .map(([staffId, note]) => {
        const staff = staffMembers.find((s: Staff) => s.id === staffId);
        return `${staff ? staff.name : 'Staff'}: ${note}`;
      })
      .join('\n');
    
    // Create the message
    let message = `🗓️ *NEW APPOINTMENT*\n\n`;
    message += `📝 *${appointmentData.title}*\n`;
    message += `📅 ${formattedDate}\n`;
    message += `🕒 ${formattedStartTime} - ${formattedEndTime}\n\n`;
    message += `👤 *Customer:* ${customerInfo}\n`;
    message += `📍 *Location:* ${locationInfo}\n`;
    message += `👷 *Assigned Staff:* ${assignedStaffNames || 'None'}\n\n`;
    
    if (notes) {
      message += `📋 *Notes:*\n${notes}\n\n`;
    }
    
    if (staffNotesText) {
      message += `🔧 *Staff Notes:*\n${staffNotesText}\n\n`;
    }
    
    message += `*Status:* ${appointmentData.status}`;
    
    return encodeURIComponent(message);
  };

  // Handle WhatsApp sharing
  const handleWhatsAppShare = (appointmentData) => {
    if (!whatsappNumber) {
      toast({
        title: "WhatsApp Number Required",
        description: "Please enter a WhatsApp number to share with.",
        variant: "destructive"
      });
      return;
    }
    
    // Format phone number: remove any non-digit characters
    const formattedNumber = whatsappNumber.replace(/\D/g, '');
    
    // Create the message
    const message = createWhatsAppMessage(appointmentData);
    
    // Open WhatsApp with the message
    window.open(`https://wa.me/${formattedNumber}?text=${message}`, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      toast({
        title: "Customer Required",
        description: "Please select a customer for this appointment.",
        variant: "destructive"
      });
      return;
    }
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for this appointment.",
        variant: "destructive"
      });
      return;
    }
    try {
      setIsLoading(true);
      
      // Process new images into base64
      let base64Images: string[] = [];
      if (attachedImages.length > 0) {
        base64Images = await convertImagesToBase64();
      }
      
      // Combine existing image URLs and new base64 images
      const allImageURLs = [...imageURLs.filter(url => !url.startsWith('blob:')), ...base64Images];
      
      // Add image URLs to notes
      let notesWithImages = notes.trim();
      if (allImageURLs.length > 0) {
        allImageURLs.forEach(url => {
          notesWithImages = `${notesWithImages}\nimage_url:${url}`;
        });
      }
      
      // Prepare the appointment data
      const appointmentData = {
        title,
        customer_id: selectedCustomer.id,
        staff_id: selectedStaff.length > 0 ? selectedStaff[0] : null,
        // Taking first staff if multiple selected
        appointment_date: date,
        start_time: startTime,
        end_time: endTime,
        status,
        notes: notesWithImages || null,
        location: selectedCustomer.address || null,
        description: null // Adding the missing description field
      };

      // Save staff notes in the appointment notes if any
      if (Object.keys(staffNotes).length > 0) {
        const staffNotesText = Object.entries(staffNotes).map(([staffId, note]) => {
          const staffMember = staffMembers.find((staff: Staff) => staff.id === staffId);
          return `${staffMember?.name || 'Staff'}: ${note}`;
        }).join('\n\n');
        appointmentData.notes = appointmentData.notes ? `${appointmentData.notes}\n\n--- Staff Notes ---\n${staffNotesText}` : `--- Staff Notes ---\n${staffNotesText}`;
      }

      // Save the appointment - create or update
      let savedAppointment;
      if (isEditMode) {
        savedAppointment = await appointmentService.update(id, appointmentData);
        toast({
          title: "Appointment Updated",
          description: "The appointment has been updated successfully."
        });
      } else {
        savedAppointment = await appointmentService.create(appointmentData);
        toast({
          title: "Appointment Added",
          description: "The appointment has been scheduled successfully."
        });
      }
      
      setIsLoading(false);
      
      // Show WhatsApp sharing option after saving
      const userWantsToShare = window.confirm("Appointment saved successfully. Would you like to share this appointment via WhatsApp?");
      if (userWantsToShare) {
        const defaultNumber = window.prompt("Enter WhatsApp number to share with (include country code):", "60");
        if (defaultNumber) {
          setWhatsappNumber(defaultNumber);
          setTimeout(() => handleWhatsAppShare(savedAppointment || appointmentData), 500);
        }
      }
      
      navigate("/schedule");
    } catch (error) {
      console.error("Error saving appointment:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'save'} the appointment. Please try again.`,
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <PageHeader 
        title={isEditMode ? "Edit Appointment" : "Add Appointment"} 
        description={isEditMode ? "Update an existing appointment or service visit." : "Schedule a new appointment or service visit."} 
        actions={
          <Button variant="outline" onClick={() => navigate("/schedule")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Schedule
          </Button>
        } 
      />
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-cyan-600">Appointment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title/Service</Label>
                <Input id="title" placeholder="e.g. Kitchen Consultation" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer</Label>
                  <div className="flex space-x-2">
                    <Button type="button" variant="outline" className="w-full justify-between" onClick={() => setIsCustomerSelectorOpen(true)}>
                      {selectedCustomer ? (
                        <span className="flex items-center">
                          <Check className="mr-2 h-4 w-4 text-green-500" />
                          {selectedCustomer.unit_number ? `#${selectedCustomer.unit_number} - ` : ""}
                          {selectedCustomer.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          Select a customer
                        </span>
                      )}
                    </Button>
                  </div>
                  {selectedCustomer && (
                    <div className="text-sm text-muted-foreground">
                      {selectedCustomer.phone || selectedCustomer.email || "No contact info"}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input id="startTime" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input id="endTime" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-cyan-600">Assigned Staff</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingStaff ? (
                <div className="text-center py-4">Loading staff members...</div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {staffMembers.map((staff: Staff) => (
                    <div key={staff.id} className="border rounded-md p-4">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          name="staff[]" 
                          value={staff.id} 
                          checked={selectedStaff.includes(staff.id)} 
                          onChange={() => toggleStaffSelection(staff.id)} 
                          className="h-4 w-4 accent-blue-600" 
                          id={`staff-${staff.id}`} 
                        />
                        <label htmlFor={`staff-${staff.id}`} className="flex-1 flex items-center space-x-2 cursor-pointer">
                          <div>
                            <p className="text-sm font-medium">{staff.name}</p>
                            <p className="text-xs text-muted-foreground">{staff.position || "Staff"}</p>
                          </div>
                        </label>
                      </div>
                      
                      {selectedStaff.includes(staff.id) && (
                        <div className="mt-3 pl-6">
                          <Label htmlFor={`staff-notes-${staff.id}`} className="text-xs">
                            Notes for {staff.name}
                          </Label>
                          <Textarea 
                            id={`staff-notes-${staff.id}`} 
                            placeholder={`Instructions or notes for ${staff.name}...`} 
                            rows={2} 
                            className="mt-1 text-sm" 
                            value={staffNotes[staff.id] || ''} 
                            onChange={e => handleStaffNoteChange(staff.id, e.target.value)} 
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-cyan-600">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Enter any additional details about this appointment..." 
                  rows={4} 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <Label className="block mb-2">Attach Images</Label>
                <div className="flex items-center gap-2">
                  <Label 
                    htmlFor="image-upload" 
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md cursor-pointer hover:bg-gray-200 transition-colors"
                  >
                    <Image className="h-4 w-4" />
                    <span>Add Images</span>
                  </Label>
                  <Input 
                    id="image-upload" 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={handleImageAttachment} 
                    className="hidden" 
                  />
                </div>
                
                {/* Image preview */}
                {imageURLs.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {imageURLs.map((url, idx) => (
                      <div key={idx} className="relative">
                        <img 
                          src={url} 
                          alt={`Attachment ${idx + 1}`} 
                          className="rounded-md w-full h-24 md:h-32 object-cover border border-gray-200" 
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6 rounded-full"
                          onClick={() => removeImage(idx)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* WhatsApp Sharing Option */}
              <div className="space-y-2 border-t pt-4 mt-4">
                <Label htmlFor="whatsapp">WhatsApp Sharing</Label>
                <div className="flex gap-2">
                  <Input
                    id="whatsapp"
                    placeholder="WhatsApp number with country code (e.g., 601234567890)"
                    type="text"
                    value={whatsappNumber}
                    onChange={e => setWhatsappNumber(e.target.value)}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-shrink-0 bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700"
                    onClick={() => handleWhatsAppShare({
                      title,
                      appointment_date: date,
                      start_time: startTime,
                      end_time: endTime,
                      status
                    })}
                    disabled={!whatsappNumber}
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  After saving, you can share appointment details via WhatsApp to staff or the customer.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-4">
              <Button variant="outline" type="button" onClick={() => navigate("/schedule")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isEditMode ? "Update Appointment" : "Save Appointment"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}
      
      <CustomerSelector 
        open={isCustomerSelectorOpen} 
        onClose={() => setIsCustomerSelectorOpen(false)} 
        onSelectCustomer={customer => {
          setSelectedCustomer(customer);
          setIsCustomerSelectorOpen(false);
        }} 
        selectedCustomerId={selectedCustomer?.id} 
      />
    </div>
  );
}
