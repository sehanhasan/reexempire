
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { CustomerInfoCard } from "@/components/quotations/CustomerInfoCard";
import { AppointmentInfoForm } from "@/components/appointments/AppointmentInfoForm";
import { appointmentService, customerService } from "@/services";
import { Customer } from "@/types/database";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AddAppointment() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split("T")[0]);
  const [appointmentTime, setAppointmentTime] = useState("09:00");
  const [status, setStatus] = useState("Scheduled");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!customerId) return;

    const fetchCustomerData = async () => {
      try {
        setIsLoading(true);
        const customerData = await customerService.getById(customerId);
        setCustomer(customerData);
      } catch (error) {
        console.error("Error fetching customer:", error);
        toast({
          title: "Error",
          description: "Failed to fetch customer data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerData();
  }, [customerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId) {
      toast({
        title: "Missing Information",
        description: "Please select a customer before creating the appointment.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Convert appointmentTime to start_time and calculate end_time (1 hour later)
      const [hours, minutes] = appointmentTime.split(':');
      const startHour = parseInt(hours, 10);
      const endHour = startHour + 1;
      const endTime = `${endHour.toString().padStart(2, '0')}:${minutes}`;

      const appointment = {
        customer_id: customerId,
        staff_id: null,
        title: title,
        description: description,
        appointment_date: appointmentDate,
        start_time: appointmentTime,
        end_time: endTime,
        status: status,
        location: customer?.unit_number || null,
        notes: null
      };

      const newAppointment = await appointmentService.create(appointment);

      toast({
        title: "Appointment Created",
        description: `Appointment for ${customer?.name} has been created successfully.`
      });

      navigate("/appointments");
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast({
        title: "Error",
        description: "There was an error creating the appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string, appointmentId: string) => {
    try {
      await appointmentService.update(appointmentId, {
        status: newStatus
      });
      setStatus(newStatus);
      toast({
        title: "Status Updated",
        description: `Appointment status has been updated to "${newStatus}".`
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update appointment status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSendWhatsapp = (appointmentId: string) => {
    if (!customerId || !customer) {
      toast({
        title: "Missing Information",
        description: "Customer information not found.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create a mock appointment object for WhatsApp sharing
      const mockAppointment = {
        id: appointmentId,
        customer_id: customerId,
        staff_id: null,
        title: title,
        description: description,
        appointment_date: appointmentDate,
        start_time: appointmentTime,
        end_time: `${(parseInt(appointmentTime.split(':')[0]) + 1).toString().padStart(2, '0')}:${appointmentTime.split(':')[1]}`,
        status: status,
        location: customer.unit_number || null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const whatsAppUrl = appointmentService.generateWhatsAppShareUrl(
        mockAppointment,
        customer.name,
        []
      );
      window.location.href = whatsAppUrl;
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      toast({
        title: "Error",
        description: "Failed to open WhatsApp. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Add Appointment"
        actions={
          <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
            <Button variant="outline" onClick={() => navigate("/appointments")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Appointments
            </Button>
          </div>
        }
      />

      <form className="mt-8 space-y-6">
        <CustomerInfoCard
          customerId={customerId}
          setCustomer={setCustomerId}
          documentType="appointment"
          documentNumber=""
          setDocumentNumber={() => {}}
          documentDate={appointmentDate}
          setDocumentDate={setAppointmentDate}
          expiryDate=""
          setExpiryDate={() => {}}
        />

        <AppointmentInfoForm
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          appointmentTime={appointmentTime}
          setAppointmentTime={setAppointmentTime}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/appointments")}
          isSubmitting={isSubmitting}
        />
      </form>
    </div>
  );
}
