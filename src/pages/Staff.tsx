
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
  UserPlus,
  Shield,
  User,
  Clock
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

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      "Admin": { bg: "bg-purple-100", text: "text-purple-800", icon: Shield },
      "Manager": { bg: "bg-blue-100", text: "text-blue-800", icon: Users },
      "Staff": { bg: "bg-gray-100", text: "text-gray-800", icon: User }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.Staff;
    const IconComponent = config.icon;
    
    return (
      <Badge className={`${config.bg} ${config.text} hover:${config.bg}`}>
        <IconComponent className="mr-1 h-3 w-3" />
        {role}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "Active": { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
      "On Leave": { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200" },
      "Inactive": { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Inactive;
    
    return (
      <Badge className={`${config.bg} ${config.text} ${config.border} border hover:${config.bg}`}>
        {status}
      </Badge>
    );
  };

  const columns = [
    {
      header: "Name",
      accessorKey: "name" as keyof Staff,
      cell: ({ row }: { row: { original: Staff } }) => (
        <div 
          className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => handleView(row.original)}
        >
          {row.original.name}
        </div>
      ),
    },
    {
      header: "Role",
      accessorKey: "role" as keyof Staff,
      cell: ({ row }: { row: { original: Staff } }) => getRoleBadge(row.original.role),
    },
    {
      header: "Phone",
      accessorKey: "phone" as keyof Staff,
      cell: ({ row }: { row: { original: Staff } }) => (
        <div className="flex items-center">
          <Phone className="mr-2 h-4 w-4 text-green-500" />
          <a 
            href={`https://wa.me/${row.original.phone?.replace(/[^0-9]/g, '')}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:underline text-green-600 hover:text-green-700 transition-colors font-medium"
          >
            {row.original.phone}
          </a>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status" as keyof Staff,
      cell: ({ row }: { row: { original: Staff } }) => getStatusBadge(row.original.status),
    },
    {
      header: "Actions",
      accessorKey: "id" as keyof Staff,
      cell: ({ row }: { row: { original: Staff } }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-gray-100">
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

  // Count stats
  const activeStaff = staffMembers.filter(s => s.status === "Active").length;
  const onLeaveStaff = staffMembers.filter(s => s.status === "On Leave").length;

  return (
    <div className="page-container">
      <PageHeader 
        title="Staff Management" 
        description="Manage your team members and their information."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
              <Users className="mr-1 h-3 w-3" />
              {activeStaff} Active
            </Badge>
            {onLeaveStaff > 0 && (
              <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                <Clock className="mr-1 h-3 w-3" />
                {onLeaveStaff} On Leave
              </Badge>
            )}
          </div>
        }
      />
      
      <div className="mt-6">
        <Card className="shadow-sm border-0 bg-white">
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
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Staff Details
              </DialogTitle>
              <DialogDescription>
                Complete information about this team member.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-700 mb-1">Staff Member</p>
                <p className="text-xl font-bold text-blue-900">{selectedStaff.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Role</p>
                  {getRoleBadge(selectedStaff.role || "Staff")}
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Status</p>
                  {getStatusBadge(selectedStaff.status)}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Join Date</p>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Clock className="h-5 w-5 mr-3 text-gray-600" />
                  <span className="text-gray-700">
                    {selectedStaff.join_date ? format(new Date(selectedStaff.join_date), "MMMM dd, yyyy") : "N/A"}
                  </span>
                </div>
              </div>
              
              {selectedStaff.position && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Position</p>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-blue-800">{selectedStaff.position}</p>
                  </div>
                </div>
              )}
              
              {selectedStaff.passport && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Passport #</p>
                  <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm">
                    <p className="text-gray-700">{selectedStaff.passport}</p>
                  </div>
                </div>
              )}
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Contact Information</p>
                <div className="space-y-3">
                  {selectedStaff.phone && (
                    <div className="flex items-center p-3 bg-green-50 rounded-lg">
                      <Phone className="h-5 w-5 mr-3 text-green-600" />
                      <a 
                        href={`https://wa.me/${selectedStaff.phone.replace(/[^0-9]/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-green-700 hover:text-green-800 font-medium hover:underline"
                      >
                        {selectedStaff.phone}
                      </a>
                    </div>
                  )}
                  {selectedStaff.email && (
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="h-5 w-5 mr-3 text-gray-600 flex items-center justify-center text-sm font-bold">@</div>
                      <a 
                        href={`mailto:${selectedStaff.email}`} 
                        className="text-gray-700 hover:text-gray-800 font-medium hover:underline"
                      >
                        {selectedStaff.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter className="sm:justify-end pt-6">
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
                  className="bg-blue-600 hover:bg-blue-700"
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

      <FloatingActionButton 
        onClick={() => navigate("/staff/add")}
        className="bg-blue-600 hover:bg-blue-700 shadow-lg"
      >
        <UserPlus className="h-6 w-6" />
      </FloatingActionButton>
    </div>
  );
}
