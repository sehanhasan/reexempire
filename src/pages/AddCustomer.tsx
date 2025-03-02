
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AddCustomerForm from "@/components/customers/AddCustomerForm";

export default function AddCustomer() {
  const navigate = useNavigate();
  
  return (
    <div className="page-container">
      <PageHeader
        title="Add Customer"
        description="Add a new customer to the system."
        actions={
          <Button variant="outline" onClick={() => navigate("/customers")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Button>
        }
      />
      
      <div className="mt-8">
        <AddCustomerForm />
      </div>
    </div>
  );
}
