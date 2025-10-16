
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Save, Calendar, User, Check, Image, X, Share2, Clock, FileText, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { appointmentService, staffService, customerService } from "@/services";
import { CustomerSelector } from "@/components/appointments/CustomerSelector";
import { Customer, Staff } from "@/types/database";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

export default function AddAppointment() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string; }>();
  const isEditMode = !!id;

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    const nextHour = now.getHours() + 1;
    return `${String(nextHour).padStart(2, '0')}:00`;
  });
  const [endTime, setEndTime] = useState(() => {
    const now = new Date();
    const nextHour = now.getHours() + 1;
    const endHour = nextHour + 1;
    return `${String(endHour).padStart(2, '0')}:00`;
  });
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Confirmed");
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [staffNotes, setStaffNotes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [shareViaWhatsApp, setShareViaWhatsApp] = useState(true);
  
  // Image attachment state
  const [attachedImages, setAttachedImages] = useState<File[]>([]);
  const [imageURLs, setImageURLs] = useState<string[]>([]);

  // Customer selection
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerSelectorOpen, setIsCustomerSelectorOpen] = useState(false);

  // Staff search
  const [staffSearchTerm, setStaffSearchTerm] = useState("");

  // Fetch staff members
  const { data: staffMembers = [], isLoading: isLoadingStaff } = useQuery({
    queryKey: ['staff'],
    queryFn: staffService.getAll
  });

  // Fetch appointment data when in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const fetchAppointmentData = async () => {
        try {
          setIsLoading(true);
          const appointment = await appointmentService.getById(id);
          
          if (appointment) {
            // Set basic appointment data
            setTitle(appointment.title || "");
            setDescription(appointment.description || "");
            setDate(appointment.appointment_date || new Date().toISOString().split("T")[0]);
            setStartTime(appointment.start_time || "09:00");
            setEndTime(appointment.end_time || "10:00");
            setStatus(appointment.status || "Confirmed");

            // Fetch appointment_staff for multi-staff support
            const { data: appointmentStaffData } = await supabase
              .from('appointment_staff')
              .select('staff_id')
              .eq('appointment_id', id);

            if (appointmentStaffData && appointmentStaffData.length > 0) {
              setSelectedStaff(appointmentStaffData.map(as => as.staff_id));
            } else if (appointment.staff_id) {
              // Fallback to single staff_id for backward compatibility
              setSelectedStaff([appointment.staff_id]);
            }

            // Parse staff notes properly
            if (appointment.notes) {
              let generalNotes = appointment.notes;
              let staffNotesObj: Record<string, string> = {};

              // Check if there are staff notes in the appointment notes
              if (appointment.notes.includes("--- Staff Notes ---")) {
                const [generalPart, staffNotesPart] = appointment.notes.split("--- Staff Notes ---");
                generalNotes = generalPart.trim();
                
                if (staffNotesPart && staffMembers.length > 0) {
                  const staffNotesLines = staffNotesPart.trim().split('\n\n');
                  staffNotesLines.forEach(line => {
                    const colonIndex = line.indexOf(': ');
                    if (colonIndex > -1) {
                      const staffName = line.substring(0, colonIndex).trim();
                      const note = line.substring(colonIndex + 2).trim();
                      
                      // Find staff ID by name
                      const staffMember = staffMembers.find((s: Staff) => s.name === staffName);
                      if (staffMember && note) {
                        staffNotesObj[staffMember.id] = note;
                      }
                    }
                  });
                }
              }

              // Clean general notes by removing image URLs if present
              if (generalNotes.includes("image_url:")) {
                const regex = /image_url:([^\s]+)/g;
                let match;
                const foundImages = [];
                while ((match = regex.exec(generalNotes)) !== null) {
                  foundImages.push(match[1]);
                }
                setImageURLs(foundImages);
                generalNotes = generalNotes.replace(/image_url:[^\s]+/g, '').trim();
              }

              setNotes(generalNotes);
              setStaffNotes(staffNotesObj);
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
      const newStaffNotes = { ...staffNotes };
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

  // Delete appointment function - this fixes issue #2
  const handleDeleteAppointment = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      await appointmentService.delete(id);
      toast({
        title: "Appointment Deleted",
        description: "The appointment has been deleted successfully."
      });
      navigate("/schedule");
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast({
        title: "Error",
        description: "Failed to delete the appointment. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
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
      const locationValue = selectedCustomer.unit_number ? `#${selectedCustomer.unit_number}` : selectedCustomer.address;
      
      const appointmentData = {
        title,
        description: description || null,
        customer_id: selectedCustomer.id,
        staff_id: selectedStaff.length > 0 ? selectedStaff[0] : null,
        appointment_date: date,
        start_time: startTime,
        end_time: endTime,
        status,
        notes: notesWithImages || null,
        location: locationValue || null
      };

      // Save staff notes in the appointment notes if any
      if (Object.keys(staffNotes).length > 0) {
        const staffNotesText = Object.entries(staffNotes).map(([staffId, note]) => {
          const staffMember = staffMembers.find((staff: Staff) => staff.id === staffId);
          return `${staffMember?.name || 'Staff'}: ${note}`;
        }).join('\n\n');
        appointmentData.notes = appointmentData.notes ? 
          `${appointmentData.notes}\n\n--- Staff Notes ---\n${staffNotesText}` : 
          `--- Staff Notes ---\n${staffNotesText}`;
      }

      // Save the appointment
      let savedAppointment;
      if (isEditMode) {
        savedAppointment = await appointmentService.update(id, appointmentData);
        
        // Update appointment_staff records for multi-staff support
        if (selectedStaff.length > 0) {
          // Delete existing appointment_staff records
          await supabase
            .from('appointment_staff')
            .delete()
            .eq('appointment_id', id);
          
          // Create new appointment_staff records
          const appointmentStaffData = selectedStaff.map(staffId => ({
            appointment_id: id,
            staff_id: staffId,
            has_started: false,
            has_completed: false,
          }));
          
          await supabase
            .from('appointment_staff')
            .insert(appointmentStaffData);
        }
        
        toast({
          title: "Appointment Updated",
          description: "The appointment has been updated successfully."
        });
      } else {
        savedAppointment = await appointmentService.create(appointmentData);
        
        // Create appointment_staff records for multi-staff support
        if (selectedStaff.length > 0 && savedAppointment) {
          const appointmentStaffData = selectedStaff.map(staffId => ({
            appointment_id: savedAppointment.id,
            staff_id: staffId,
            has_started: false,
            has_completed: false,
          }));
          
          await supabase
            .from('appointment_staff')
            .insert(appointmentStaffData);
        }
        
        toast({
          title: "Appointment Added",
          description: "The appointment has been scheduled successfully."
        });
      }
      
      // WhatsApp sharing logic
      if (shareViaWhatsApp && savedAppointment) {
        const selectedStaffMembers = selectedStaff.map(staffId => {
          const staff = staffMembers.find((s: Staff) => s.id === staffId);
          return {
            id: staffId, 
            name: staff?.name || "Unknown Staff",
            phone: staff?.phone || null
          };
        });
        
        const whatsAppUrl = appointmentService.generateWhatsAppShareUrl(
          savedAppointment,
          selectedCustomer.name,
          selectedStaffMembers
        );
        
        // Open WhatsApp URL in a new tab
        window.open(whatsAppUrl, '_blank');
      }
      
      setIsLoading(false);
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

  const isMobile = useIsMobile();

  return (
    <div className={`${isMobile ? 'page-container' : 'mt-6'}`}>
      <PageHeader 
        title={isEditMode ? "Edit Appointment" : "Add New Appointment"}
        description={isEditMode ? "Update appointment details" : "Schedule a new appointment with a customer"}
      />
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-cyan-600">
                {isEditMode ? "Update Appointment Details" : "Appointment Details"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title/Service</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g. Kitchen Consultation" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer</Label>
                  <div className="flex space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full justify-between" 
                      onClick={() => setIsCustomerSelectorOpen(true)}
                    >
                      {selectedCustomer ? (
                        <span className="flex items-center">
                          <User className="mr-2 h-4 w-4 text-green-500" />
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
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Enter appointment description..." 
                  rows={3} 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input 
                    id="startTime" 
                    type="time" 
                    value={startTime} 
                    onChange={e => setStartTime(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input 
                    id="endTime" 
                    type="time" 
                    value={endTime} 
                    onChange={e => setEndTime(e.target.value)} 
                    required 
                  />
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
                <>
                  <div className="relative">
                    <Input
                      type="search"
                      placeholder="Search staff..."
                      value={staffSearchTerm}
                      onChange={(e) => setStaffSearchTerm(e.target.value)}
                      className="pl-3"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {staffMembers
                      .filter((staff: Staff) => 
                        staff.name.toLowerCase().includes(staffSearchTerm.toLowerCase())
                      )
                      .map((staff: Staff) => (
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
                        <label 
                          htmlFor={`staff-${staff.id}`} 
                          className="flex-1 flex items-center space-x-2 cursor-pointer"
                        >
                          <div>
                            <p className="text-sm font-medium">{staff.name}</p>
                            {/* <p className="text-xs text-muted-foreground">
                              {staff.position || "Staff"}
                            </p> */}
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
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-cyan-600">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Confirmed">Scheduled</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Pending Review">Pending Review</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch 
                  id="share-whatsapp" 
                  checked={shareViaWhatsApp}
                  onCheckedChange={setShareViaWhatsApp}
                />
                <Label htmlFor="share-whatsapp" className="cursor-pointer flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-green-600" />
                  Share appointment details via WhatsApp after saving
                </Label>
              </div>
              
            </CardContent>
            <CardFooter className="flex justify-between space-x-4">
              <div className="flex space-x-2">
                <Button variant="outline" type="button" onClick={() => navigate("/schedule")}>
                  Cancel
                </Button>
                {isEditMode && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" type="button">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this appointment? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAppointment();
                          }} 
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
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
