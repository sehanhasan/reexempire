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
  Trash,
  Loader2,
  Mail,
  Phone,
  User
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { staffService } from "@/services";
import { Staff } from "@/types/database";

export default function Staff() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const fetchStaff = async () => {
    try {
      const data = await staffService.getAll();
      // Sort by most recent first (created_at in descending order)
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setStaff(data);
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

  const handleView = (staffMember: Staff) => {
    setSelectedStaff(null);
    setTimeout(() => {
      setSelectedStaff(staffMember);
      setShowDetails(true);
    }, 10);
  };

  const handleEdit = (staffMember: Staff) => {
    navigate(`/staff/edit/${staffMember.id}`);
  };

  const handleDelete = async (staffMember: Staff) => {
    try {
      await staffService.delete(staffMember.id);
      setStaff(staff.filter(s => s.id !== staffMember.id));
      setShowDetails(false);
      setSelectedStaff(null);
      setShowDeleteConfirm(false);
      setStaffToDelete(null);
      
      toast({
        title: "Staff Member Deleted",
        description: `${staffMember.name} has been deleted successfully.`,
        variant: "destructive",
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
      cell: ({ row }: { row: { original: Staff } }) => (
        <div className="font-medium">{row.original.position || 'N/A'}</div>
      ),
    },
    {
      header: "Phone",
      accessorKey: "phone" as keyof Staff,
      cell: ({ row }: { row: { original: Staff } }) => (
        <div className="flex items-center">
          <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
          {row.original.phone ? (
            <a 
              href={`tel:${row.original.phone}`} 
              className="text-blue-600 hover:underline"
            >
              {row.original.phone}
            </a>
          ) : (
            <span className="text-muted-foreground">Not provided</span>
          )}
        </div>
      ),
    },
    {
      header: "Email",
      accessorKey: "email" as keyof Staff,
      cell: ({ row }: { row: { original: Staff } }) => (
        <div className="flex items-center">
          <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
          {row.original.email ? (
            <a 
              href={`mailto:${row.original.email}`} 
              className="text-blue-600 hover:underline"
            >
              {row.original.email}
            </a>
          ) : (
            <span className="text-muted-foreground">Not provided</span>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="p-2">
          <div className="flex items-center justify-center h-[70vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading staff...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-2">
        <PageHeader 
          title="Staff" 
          description="Manage your staff members."
        />
        
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <DataTable 
            columns={columns} 
            data={staff} 
            searchKey="name" 
            externalSearchTerm={searchTerm}
            onExternalSearchChange={setSearchTerm}
          />
        </div>

        {selectedStaff && (
          <Dialog open={showDetails} onOpenChange={(open) => {
            setShowDetails(open);
            if (!open) setSelectedStaff(null);
          }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Staff Member Details</DialogTitle>
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
                  <p className="text-lg font-medium">{selectedStaff.position || 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contact Information</p>
                  <div className="flex items-center mt-1">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    {selectedStaff.phone ? (
                      <a 
                        href={`tel:${selectedStaff.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {selectedStaff.phone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">Not provided</span>
                    )}
                  </div>
                  {selectedStaff.email && (
                    <div className="flex items-center mt-1">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a 
                        href={`mailto:${selectedStaff.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {selectedStaff.email}
                      </a>
                    </div>
                  )}
                </div>
                
                {selectedStaff.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notes</p>
                    <p className="text-sm mt-1">{selectedStaff.notes}</p>
                  </div>
                )}
              </div>
              
              <DialogFooter className="sm:justify-end">
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDetails(false)}
                  >
                    Close
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowDetails(false);
                      if (selectedStaff) handleEdit(selectedStaff);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      if (selectedStaff) {
                        setStaffToDelete(selectedStaff);
                        setShowDeleteConfirm(true);
                      }
                    }}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Staff Member</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-medium">{staffToDelete?.name}</span>
                ? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => {
                if (staffToDelete) handleDelete(staffToDelete);
              }}>
                <Trash className="mr-2 h-4 w-4" />
                Delete Staff Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <FloatingActionButton onClick={() => navigate("/staff/add")} />
      </div>
    </div>
  );
}
