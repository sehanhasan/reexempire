
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { staffService } from "@/services";
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatPhone } from "@/utils/formatters";

export default function Staff() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const data = await staffService.getAll();
        setStaff(data || []);
      } catch (error) {
        console.error("Error fetching staff:", error);
        toast({
          title: "Error",
          description: "Failed to fetch staff members. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaff();
  }, []);

  const handleEdit = (staffId: string) => {
    navigate(`/staff/edit/${staffId}`);
  };

  const handleDelete = async (staffId: string) => {
    try {
      await staffService.delete(staffId);
      setStaff(staff.filter(member => member.id !== staffId));
      toast({
        title: "Staff Member Deleted",
        description: "Staff member has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting staff member:", error);
      toast({
        title: "Error",
        description: "Failed to delete staff member. Please try again.",
        variant: "destructive",
      });
    }
  };

  const columns = [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Position",
      accessorKey: "position",
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Phone",
      accessorKey: "phone",
      cell: ({ row }) => formatPhone(row.getValue("phone")),
    },
    {
      header: "Hourly Rate",
      accessorKey: "hourly_rate",
      cell: ({ row }) => {
        const rate = row.getValue("hourly_rate");
        return rate ? `RM ${rate}/hr` : "-";
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="page-container">
        <PageHeader title="Staff" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Staff"
        actions={
          <Button onClick={() => navigate("/staff/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Staff Member
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>All Staff Members ({staff.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={staff}
            onEdit={handleEdit}
            onDelete={handleDelete}
            emptyMessage="No staff members found. Add your first staff member to get started."
          />
        </CardContent>
      </Card>
    </div>
  );
}
