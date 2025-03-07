
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppointmentForm from "@/components/appointments/AppointmentForm";

export default function AddAppointment() {
  const navigate = useNavigate();
  
  return (
    <div className="page-container">
      <PageHeader 
        title="Add New Appointment" 
        actions={
          <Button variant="outline" onClick={() => navigate("/schedule")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Schedule
          </Button>
        }
      />
      
      <div className="mt-8">
        <AppointmentForm />
      </div>
    </div>
  );
}
