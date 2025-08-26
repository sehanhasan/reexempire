
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import AddCustomerForm from "@/components/customers/AddCustomerForm";
import { customerService } from "@/services";

export default function AddCustomer() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const customerId = queryParams.get('id');
  const isEditing = !!customerId;
  const [customerName, setCustomerName] = useState("");
  
  useEffect(() => {
    if (customerId) {
      const fetchCustomer = async () => {
        try {
          const customer = await customerService.getById(customerId);
          if (customer) {
            setCustomerName(customer.name);
          }
        } catch (error) {
          console.error("Error fetching customer:", error);
        }
      };
      
      fetchCustomer();
    }
  }, [customerId]);
  
  return (
    <div className="page-container">
      
      <div className="mt-2">
        <AddCustomerForm />
      </div>
    </div>
  );
}
