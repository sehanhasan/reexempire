
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { 
  Edit,
  MoreHorizontal,
  Trash,
  Eye,
  Mail,
  Phone,
  UserPlus
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StaffMember {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  status: "Active" | "On Leave" | "Inactive";
  joinDate: string;
}

export default function Staff() {
  const navigate = useNavigate();
  
  // Mock data - would come from API in real app
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([
    { id: "S001", name: "John Doe", position: "Project Manager", email: "john@renovateprox.com", phone: "012-1112222", status: "Active", joinDate: "Jan 15, 2022" },
    { id: "S002", name: "Jane Smith", position: "Interior Designer", email: "jane@renovateprox.com", phone: "016-2223333", status: "Active", joinDate: "Mar 10, 2022" },
    { id: "S003", name: "Mike Johnson", position: "Electrician", email: "mike@renovateprox.com", phone: "011-3334444", status: "On Leave", joinDate: "Apr 5, 2022" },
    { id: "S004", name: "Sarah Williams", position: "Plumber", email: "sarah@renovateprox.com", phone: "018-4445555", status: "Active", joinDate: "May 20, 2022" },
    { id: "S005", name: "Tom Brown", position: "Carpenter", email: "tom@renovateprox.com", phone: "019-5556666", status: "Active", joinDate: "Jun 15, 2022" },
    { id: "S006", name: "Lisa Davis", position: "Administrative Assistant", email: "lisa@renovateprox.com", phone: "013-6667777", status: "Inactive", joinDate: "Jul 1, 2022" },
  ]);

  // Action handlers
  const handleView = (staff: StaffMember) => {
    toast({
      title: "Viewing Staff Details",
      description: `Viewing details for ${staff.name} - ${staff.position}`,
    });
  };

  const handleEdit = (staff: StaffMember) => {
    navigate(`/staff/add?id=${staff.id}`);
  };

  const handleDelete = (staff: StaffMember) => {
    // Remove the staff member from the list
    setStaffMembers(staffMembers.filter(s => s.id !== staff.id));
    
    toast({
      title: "Staff Removed",
      description: `${staff.name} has been removed from staff records`,
      variant: "destructive",
    });
  };

  const handleStatusChange = (staff: StaffMember, newStatus: "Active" | "On Leave" | "Inactive") => {
    // Update the staff status
    const updatedStaff = staffMembers.map(s => 
      s.id === staff.id ? { ...s, status: newStatus } : s
    );
    setStaffMembers(updatedStaff);
    
    toast({
      title: "Status Updated",
      description: `${staff.name}'s status changed to ${newStatus}`,
    });
  };

  const columns = [
    {
      header: "ID",
      accessorKey: "id" as keyof StaffMember,
    },
    {
      header: "Name",
      accessorKey: "name" as keyof StaffMember,
    },
    {
      header: "Position",
      accessorKey: "position" as keyof StaffMember,
    },
    {
      header: "Email",
      accessorKey: "email" as keyof StaffMember,
      cell: (staff: StaffMember) => (
        <div className="flex items-center">
          <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{staff.email}</span>
        </div>
      ),
    },
    {
      header: "Phone",
      accessorKey: "phone" as keyof StaffMember,
      cell: (staff: StaffMember) => (
        <div className="flex items-center">
          <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{staff.phone}</span>
        </div>
      ),
    },
    {
      header: "Join Date",
      accessorKey: "joinDate" as keyof StaffMember,
    },
    {
      header: "Status",
      accessorKey: "status" as keyof StaffMember,
      cell: (staff: StaffMember) => {
        return (
          <Badge className={
            staff.status === "Active" ? "bg-green-100 text-green-800 hover:bg-green-200" :
            staff.status === "On Leave" ? "bg-amber-100 text-amber-800 hover:bg-amber-200" :
            "bg-gray-100 text-gray-800 hover:bg-gray-200"
          }>
            {staff.status}
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      accessorKey: "id" as keyof StaffMember,
      cell: (staff: StaffMember) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => handleView(staff)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => handleEdit(staff)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {staff.status !== "Active" && (
                <DropdownMenuItem 
                  className="cursor-pointer text-green-600"
                  onClick={() => handleStatusChange(staff, "Active")}
                >
                  Set as Active
                </DropdownMenuItem>
              )}
              {staff.status !== "On Leave" && (
                <DropdownMenuItem 
                  className="cursor-pointer text-amber-600"
                  onClick={() => handleStatusChange(staff, "On Leave")}
                >
                  Set as On Leave
                </DropdownMenuItem>
              )}
              {staff.status !== "Inactive" && (
                <DropdownMenuItem 
                  className="cursor-pointer text-gray-600"
                  onClick={() => handleStatusChange(staff, "Inactive")}
                >
                  Set as Inactive
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600"
                onClick={() => handleDelete(staff)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="page-container">
      <PageHeader 
        title="Staff" 
        description="Manage your team members."
        actions={
          <Button className="flex items-center" onClick={() => navigate("/staff/add")}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Staff Member
          </Button>
        }
      />
      
      <div className="mt-8">
        <DataTable 
          columns={columns} 
          data={staffMembers} 
          searchKey="name" 
        />
      </div>

      <FloatingActionButton onClick={() => navigate("/staff/add")} />
    </div>
  );
}
