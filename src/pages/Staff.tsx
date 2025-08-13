
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { 
  Edit,
  MoreHorizontal,
  Trash,
  Eye,
  Phone,
  Plus,
  Users,
  UserCheck,
  Clock,
  Shield,
  Mail
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { staffService } from "@/services";
import { format } from "date-fns";
import type { Staff } from "@/types/database";

export default function StaffPage() {
  const navigate = useNavigate();
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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
    navigate(`/staff/add?id=${staff.id}`);
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
      setShowDeleteConfirm(false); // Close dialog on error to prevent UI freeze
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin':
        return <Shield className="h-4 w-4" />;
      case 'Manager':
        return <UserCheck className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <UserCheck className="h-3 w-3" />;
      case 'On Leave':
        return <Clock className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };

  const columns = [
    {
      header: "Staff Member",
      accessorKey: "name" as keyof Staff,
      cell: ({ row }: { row: { original: Staff } }) => (
        <div 
          className="flex items-center cursor-pointer hover:text-blue-600 transition-colors group"
          onClick={() => handleView(row.original)}
        >
          <div className="p-2 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors mr-3">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 group-hover:text-blue-600">
              {row.original.name}
            </div>
            {row.original.position && (
              <div className="text-sm text-gray-500 mt-1">
                {row.original.position}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Role",
      accessorKey: "role" as keyof Staff,
      cell: ({ row }: { row: { original: Staff } }) => {
        const roleColors = {
          Admin: "bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border-purple-200",
          Manager: "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200",
          Staff: "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200"
        };
        
        return (
          <Badge className={roleColors[row.original.role as keyof typeof roleColors] || roleColors.Staff}>
            {getRoleIcon(row.original.role)}
            <span className="ml-1">{row.original.role}</span>
          </Badge>
        );
      },
    },
    {
      header: "Contact",
      accessorKey: "phone" as keyof Staff,
      cell: ({ row }: { row: { original: Staff } }) => (
        <div className="flex items-center space-y-1">
          {row.original.phone && (
            <div className="flex items-center text-sm">
              <Phone className="mr-2 h-3 w-3 text-green-600" />
              <a 
                href={`https://wa.me/${row.original.phone?.replace(/[^0-9]/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:underline text-green-600 font-medium"
              >
                WhatsApp
              </a>
            </div>
          )}
          {row.original.email && (
            <div className="flex items-center text-sm mt-1">
              <Mail className="mr-2 h-3 w-3 text-blue-600" />
              <a 
                href={`mailto:${row.original.email}`} 
                className="hover:underline text-blue-600"
              >
                Email
              </a>
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status" as keyof Staff,
      cell: ({ row }: { row: { original: Staff } }) => {
        const statusColors = {
          Active: "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200",
          "On Leave": "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-200",
          Inactive: "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200"
        };
        
        return (
          <Badge className={statusColors[row.original.status as keyof typeof statusColors] || statusColors.Inactive}>
            {getStatusIcon(row.original.status)}
            <span className="ml-1">{row.original.status}</span>
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
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
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

  // Set up mobile search
  useEffect(() => {
    const mobileSearchEvent = new CustomEvent('setup-mobile-search', {
      detail: {
        searchTerm,
        onSearchChange: setSearchTerm,
        placeholder: "Search staff..."
      }
    });
    window.dispatchEvent(mobileSearchEvent);

    return () => {
      window.dispatchEvent(new CustomEvent('clear-mobile-search'));
    };
  }, [searchTerm]);

  // Calculate stats
  const activeStaff = staffMembers.filter(s => s.status === 'Active').length;
  const onLeaveStaff = staffMembers.filter(s => s.status === 'On Leave').length;

  return (
    <div className="page-container">
      <PageHeader 
        title="Team Management" 
        description="Manage your team members and their roles efficiently."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200 font-medium">
              <UserCheck className="mr-1 h-3 w-3" />
              {activeStaff} Active
            </Badge>
            {onLeaveStaff > 0 && (
              <Badge variant="secondary" className="bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-200 font-medium">
                <Clock className="mr-1 h-3 w-3" />
                {onLeaveStaff} On Leave
              </Badge>
            )}
          </div>
        }
      />
      
      <div className="mt-6">
        <Card className="shadow-sm border-0 bg-white overflow-hidden">
          <CardContent className="p-0">
            <DataTable 
              columns={columns} 
              data={staffMembers} 
              searchKey="name" 
              isLoading={isLoading}
              externalSearchTerm={searchTerm}
              onExternalSearchChange={setSearchTerm}
              emptyMessage="No staff members found. Add your first team member to get started."
            />
          </CardContent>
        </Card>
      </div>

      {selectedStaff && (
        <Dialog open={showDetails} onOpenChange={(open) => {
          setShowDetails(open);
          if (!open) setSelectedStaff(null);
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold">Staff Details</DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Complete information about this team member
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Name</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedStaff.name}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Role</p>
                  <Badge className={
                    selectedStaff.role === "Admin" ? "bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700" :
                    selectedStaff.role === "Manager" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700" :
                    "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700"
                  }>
                    {getRoleIcon(selectedStaff.role)}
                    <span className="ml-1">{selectedStaff.role || "Staff"}</span>
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                  <Badge className={
                    selectedStaff.status === "Active" ? "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700" :
                    selectedStaff.status === "On Leave" ? "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700" :
                    "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700"
                  }>
                    {getStatusIcon(selectedStaff.status)}
                    <span className="ml-1">{selectedStaff.status}</span>
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Join Date</p>
                  <p className="text-sm text-gray-900">
                    {selectedStaff.join_date ? format(new Date(selectedStaff.join_date), "MMM dd, yyyy") : "N/A"}
                  </p>
                </div>
              </div>
              
              {selectedStaff.position && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Position</p>
                  <p className="text-sm text-gray-900">{selectedStaff.position}</p>
                </div>
              )}
              
              {selectedStaff.passport && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Passport #</p>
                  <p className="text-sm text-gray-900 font-mono">{selectedStaff.passport}</p>
                </div>
              )}
              
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-500 mb-3">Contact Information</p>
                <div className="space-y-2">
                  {selectedStaff.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-3 text-green-600" />
                      <a 
                        href={`https://wa.me/${selectedStaff.phone.replace(/[^0-9]/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-green-600 hover:underline font-medium"
                      >
                        {selectedStaff.phone}
                      </a>
                    </div>
                  )}
                  {selectedStaff.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-3 text-blue-600" />
                      <a 
                        href={`mailto:${selectedStaff.email}`} 
                        className="text-blue-600 hover:underline"
                      >
                        {selectedStaff.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter className="sm:justify-end mt-6">
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
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
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
            <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
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
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FloatingActionButton 
        onClick={() => navigate("/staff/add")}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
      >
        <Plus className="h-6 w-6" />
      </FloatingActionButton>
    </div>
  );
}
