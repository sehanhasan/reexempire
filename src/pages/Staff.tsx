import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Edit, Trash, Loader2, Mail, Phone, MapPin, Users, Calendar } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { staffService } from "@/services";
import { Staff } from "@/types/database";
export default function StaffPage() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const fetchStaff = async () => {
    try {
      const data = await staffService.getAll();
      setStaff(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast({
        title: "Error",
        description: "Failed to load staff members. Please try again.",
        variant: "destructive"
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
    setSelectedStaff(staffMember);
    setShowDetails(true);
  };
  const handleEdit = (staffMember: Staff) => {
    navigate(`/staff/add?id=${staffMember.id}`);
  };
  const handleDeleteClick = (staffMember: Staff) => {
    setStaffToDelete(staffMember);
    setShowDeleteConfirm(true);
  };
  const handleDeleteConfirm = async () => {
    if (!staffToDelete) return;
    try {
      await staffService.delete(staffToDelete.id);
      setStaff(staff.filter(s => s.id !== staffToDelete.id));
      setShowDetails(false);
      setSelectedStaff(null);
      setShowDeleteConfirm(false);
      setStaffToDelete(null);
      toast({
        title: "Staff Member Deleted",
        description: `${staffToDelete.name} has been deleted successfully.`,
        variant: "destructive"
      });
    } catch (error) {
      console.error("Error deleting staff member:", error);
      toast({
        title: "Error",
        description: "Failed to delete staff member. Please try again.",
        variant: "destructive"
      });
    }
  };
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setStaffToDelete(null);
  };
  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "active") {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100" variant="secondary">Active</Badge>;
    } else if (statusLower === "inactive") {
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100" variant="secondary">Inactive</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  // Filter staff based on search term
  const filteredStaff = staff.filter(staffMember => staffMember.name.toLowerCase().includes(searchTerm.toLowerCase()) || staffMember.position && staffMember.position.toLowerCase().includes(searchTerm.toLowerCase()) || staffMember.email && staffMember.email.toLowerCase().includes(searchTerm.toLowerCase()) || staffMember.phone && staffMember.phone.includes(searchTerm));
  if (isLoading) {
    return <div className="page-container flex items-center justify-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading staff...</span>
      </div>;
  }
  return <div className="page-container">
      <PageHeader title="Staff" description="Manage your team members." />
      
      <div className="mt-6">
        {filteredStaff.length === 0 ? <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">
              {searchTerm ? "No staff members found matching your search." : "No staff members found."}
            </p>
            {!searchTerm && <p className="text-muted-foreground text-sm mt-2">
                Get started by adding your first team member.
              </p>}
          </div> : <div className="px-2 space-y-4">
            {filteredStaff.map(staffMember => <Card key={staffMember.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleView(staffMember)}>
                <CardContent className="p-0">
                  <div className="p-2 border-b bg-blue-50/30">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-blue-700">
                            {staffMember.name}
                          </h3>
                          {staffMember.position && <p className="text-sm text-muted-foreground">{staffMember.position}</p>}
                        </div>
                      </div>
                      {getStatusBadge(staffMember.status || "Active")}
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    {staffMember.phone && <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{staffMember.phone}</span>
                      </div>}
                    {staffMember.email && <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                        <a href={`mailto:${staffMember.email}`} className="text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>
                          {staffMember.email}
                        </a>
                      </div>}
                    {staffMember.join_date && <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Joined: {new Date(staffMember.join_date).toLocaleDateString()}
                        </span>
                      </div>}
                  </div>
                </CardContent>
              </Card>)}
          </div>}
      </div>

      {selectedStaff && <Dialog open={showDetails} onOpenChange={open => {
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
              
              {selectedStaff.position && <div>
                  <p className="text-sm font-medium text-muted-foreground">Position</p>
                  <p className="text-sm mt-1">{selectedStaff.position}</p>
                </div>}
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(selectedStaff.status || "Active")}</div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact Information</p>
                {selectedStaff.phone && <div className="flex items-center mt-1">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{selectedStaff.phone}</span>
                  </div>}
                {selectedStaff.email && <div className="flex items-center mt-1">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <a href={`mailto:${selectedStaff.email}`} className="text-blue-600 hover:underline">
                      {selectedStaff.email}
                    </a>
                  </div>}
              </div>
              
              {selectedStaff.join_date && <div>
                  <p className="text-sm font-medium text-muted-foreground">Join Date</p>
                  <div className="flex items-center mt-1">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{new Date(selectedStaff.join_date).toLocaleDateString()}</span>
                  </div>
                </div>}
              
              {selectedStaff.address && <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <div className="flex items-start mt-1">
                    <MapPin className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                    <span>
                      {selectedStaff.address}
                      {selectedStaff.city && `, ${selectedStaff.city}`}
                      {selectedStaff.state && `, ${selectedStaff.state}`}
                      {selectedStaff.postal_code && ` ${selectedStaff.postal_code}`}
                    </span>
                  </div>
                </div>}
            </div>
            
            <DialogFooter className="sm:justify-end">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => {
              setShowDetails(false);
              if (selectedStaff) handleEdit(selectedStaff);
            }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  Close
                </Button>
                <Button variant="destructive" onClick={() => {
              setShowDetails(false);
              if (selectedStaff) handleDeleteClick(selectedStaff);
            }}>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the staff member "{staffToDelete?.name}" and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete Staff Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FloatingActionButton onClick={() => navigate("/staff/add")} />
    </div>;
}