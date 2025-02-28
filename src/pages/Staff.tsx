
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Edit,
  MoreHorizontal,
  Trash,
  Eye,
  Mail,
  Phone,
  UserCog,
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
  // Mock data - would come from API in real app
  const [staffMembers] = useState<StaffMember[]>([
    { id: "S001", name: "John Doe", position: "Project Manager", email: "john@renovateprox.com", phone: "(555) 111-2222", status: "Active", joinDate: "Jan 15, 2022" },
    { id: "S002", name: "Jane Smith", position: "Interior Designer", email: "jane@renovateprox.com", phone: "(555) 222-3333", status: "Active", joinDate: "Mar 10, 2022" },
    { id: "S003", name: "Mike Johnson", position: "Electrician", email: "mike@renovateprox.com", phone: "(555) 333-4444", status: "On Leave", joinDate: "Apr 5, 2022" },
    { id: "S004", name: "Sarah Williams", position: "Plumber", email: "sarah@renovateprox.com", phone: "(555) 444-5555", status: "Active", joinDate: "May 20, 2022" },
    { id: "S005", name: "Tom Brown", position: "Carpenter", email: "tom@renovateprox.com", phone: "(555) 555-6666", status: "Active", joinDate: "Jun 15, 2022" },
    { id: "S006", name: "Lisa Davis", position: "Administrative Assistant", email: "lisa@renovateprox.com", phone: "(555) 666-7777", status: "Inactive", joinDate: "Jul 1, 2022" },
  ]);

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
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600">
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
          <Button className="flex items-center">
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

      <FloatingActionButton />
    </div>
  );
}
