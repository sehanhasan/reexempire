
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { customerService } from "@/services";
import { DataTable } from "@/components/common/DataTable";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Customers() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getAll,
  });

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Phone",
      accessorKey: "phone",
    },
    {
      header: "Address",
      accessorKey: "address",
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Customers"
        actions={
          <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
            <Button onClick={() => navigate("/customers/add")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </div>
        }
      />

      <DataTable
        data={filteredCustomers}
        columns={columns}
        searchKey="name"
        externalSearchTerm={searchTerm}
        onExternalSearchChange={setSearchTerm}
        isLoading={isLoading}
      />
    </div>
  );
}
