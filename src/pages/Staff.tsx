
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";

import { staffService } from "@/services";
import type { Staff as StaffType } from "@/types/database";

const Staff = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const {
    data: staffData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["staff"],
    queryFn: staffService.getAll,
  });

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
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }: { row: { original: StaffType } }) => (
        <Badge variant={row.original.status === "Active" ? "default" : "destructive"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      header: "Join Date",
      accessorKey: "join_date",
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }: { row: { original: StaffType } }) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            onClick={() => navigate(`/staff/edit/${row.original.id}`)}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Staff"
        description="Manage your staff members"
        actions={
          <Button onClick={() => navigate("/staff/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={staffData || []}
        searchKey="name"
        isLoading={isLoading}
      />
    </div>
  );
};

export default Staff;
