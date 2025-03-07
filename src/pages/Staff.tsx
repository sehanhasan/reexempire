
import { useState, useEffect } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { staffService } from "@/services";
import { format } from "date-fns";
import { Staff } from "@/types/database";

export default function StaffPage() {
  const navigate = useNavigate();
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  
  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const data = await staffService.getAll();
      setStaffMembers(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast({
        title: "Error",
        description: "Failed to load staff members. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);
  
  // Action handlers
  const handleView = (staff: Staff) => {
    // First clear the previous staff to avoid state issues
    setSelectedStaff(null);
    // Use setTimeout to ensure the state is updated before showing dialog
    setTimeout(() => {
      setSelectedStaff(staff);
      setShowDetails(true);
    }, 10);
  };

  const handleEdit = (staff: Staff) => {
    navigate(`/staff/edit/${staff.id}`);
  };

  const handleDelete = (staff: Staff) => {
    setStaffToDelete(staff);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!staffToDelete) return;
    
    try {
      await staffService.delete(staffToDelete.id);
      setStaffMembers(staffMembers.filter(s => s.id !== staffToDelete.id));
      setShowDeleteConfirm(false);
      setStaffToDelete(null);
      
      toast({
        title: "Staff Removed",
        description: `${staffToDelete.name} has been removed from staff records`,
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast({
        title: "Error",
        description: "Failed to delete staff member. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = (staff: Staff, newStatus: "Active" | "On Leave" | "Inactive") => {
    // Update the staff status
    const updateStaff = async () => {
      try {
        await staffService.update(staff.id, { status: newStatus });
        fetchStaff(); // Refresh the list
        
        toast({
          title: "Status Updated",
          description: `${staff.name}'s status changed to ${newStatus}`,
        });
      } catch (error) {
        console.error("Error updating staff status:", error);
        toast({
          title: "Error",
          description: "Failed to update staff status. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    updateStaff();
  };

  const columns = [
    {
      header: "Name",
      accessorKey: "name" as keyof Staff,
      cell: ({ row }: { row: { original: Staff } }) => (
        <div 
          className="font-medium text-blue-600 cursor-pointer"
          onClick={() => handleView(row.original)}
        >
          {row.original.name}
        </div>
      ),
    },
    {
      header: "Position",
      accessorKey: "position" as keyof Staff,
    },
    {
      header: "Username",
      accessorKey: "username" as keyof Staff,
      cell: ({ row }: { row: { original: Staff } }) => (
        <div className="text-slate-600">
          {row.original.username || "Not Set"}
        </div>
      ),
    },
    {
      header: "Phone",
      accessorKey: "phone" as keyof Staff,
      cell: ({ row }: { row: { original: Staff } }) => (
        <div className="flex items-center">
          <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
          <a href={`tel:${row.original.phone}`} className="hover:underline text-blue-600">
            {row.original.phone}
          </a>
        </div>
      ),
    },
    {
      header: "Join Date",
      accessorKey: "join_date" as keyof Staff,
      cell: ({ row }: { row: { original: Staff } }) => {
        return row.original.join_date ? format(new Date(row.original.join_date), "MMM dd, yyyy") : "N/A";
      },
    },
    {
      header: "Status",
      accessorKey: "status" as keyof Staff,
      cell: ({ row }: { row: { original: Staff } }) => {
        return (
          <Badge className={
            row.original.status === "Active" ? "bg-green-100 text-green-800 hover:bg-green-200" :
            row.original.status === "On Leave" ? "bg-amber-100 text-amber-800 hover:bg-amber-200" :
            "bg-gray-100 text-gray-800 hover:bg-gray-200"
          }>
            {row.original.status}
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      accessorKey: "id" as keyof Staff,
      cell: ({ row }: { row: { original: Staff } }) => {
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
                onClick={() => handleView(row.original)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => handleEdit(row.original)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {row.original.status !== "Active" && (
                <DropdownMenuItem 
                  className="cursor-pointer text-green-600"
                  onClick={() => handleStatusChange(row.original, "Active")}
                >
                  Set as Active
                </DropdownMenuItem>
              )}
              {row.original.status !== "On Leave" && (
                <DropdownMenuItem 
                  className="cursor-pointer text-amber-600"
                  onClick={() => handleStatusChange(row.original, "On Leave")}
                >
                  Set as On Leave
                </DropdownMenuItem>
              )}
              {row.original.status !== "Inactive" && (
                <DropdownMenuItem 
                  className="cursor-pointer text-gray-600"
                  onClick={() => handleStatusChange(row.original, "Inactive")}
                >
                  Set as Inactive
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600"
                onClick={() => handleDelete(row.original)}
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
          isLoading={isLoading}
        />
      </div>

      {selectedStaff && (
        <Dialog open={showDetails} onOpenChange={(open) => {
          setShowDetails(open);
          if (!open) setSelectedStaff(null);
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Staff Details</DialogTitle>
              <DialogDescription>
                Complete information about this staff member.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-lg font-medium">{selectedStaff.name}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Position</p>
                <p>{selectedStaff.position}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Username</p>
                <p>{selectedStaff.username || "Not set"}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Passport #</p>
                <p>{selectedStaff.passport || "Not provided"}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge className={
                  selectedStaff.status === "Active" ? "bg-green-100 text-green-800" :
                  selectedStaff.status === "On Leave" ? "bg-amber-100 text-amber-800" :
                  "bg-gray-100 text-gray-800"
                }>
                  {selectedStaff.status}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Join Date</p>
                <p>{selectedStaff.join_date ? format(new Date(selectedStaff.join_date), "MMMM dd, yyyy") : "N/A"}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact Information</p>
                {selectedStaff.phone && (
                  <div className="flex items-center mt-1">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <a href={`tel:${selectedStaff.phone}`} className="text-blue-600 hover:underline">
                      {selectedStaff.phone}
                    </a>
                  </div>
                )}
                {selectedStaff.email && (
                  <div className="flex items-center mt-1">
                    <div className="h-4 w-4 mr-2 text-muted-foreground">@</div>
                    <a href={`mailto:${selectedStaff.email}`} className="text-blue-600 hover:underline">
                      {selectedStaff.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter className="sm:justify-end">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDetails(false)}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setShowDetails(false);
                    if (selectedStaff) handleEdit(selectedStaff);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {staffToDelete?.name} from your staff records.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FloatingActionButton onClick={() => navigate("/staff/add")} />
    </div>
  );
}
