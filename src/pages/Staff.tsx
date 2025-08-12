import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { Plus, Search, Edit, Trash2, User, Mail, Phone, UserCheck } from "lucide-react";
import { staffService } from "@/services";
import { Staff } from "@/types/database";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { useIsMobile } from "@/hooks/use-mobile";

export default function StaffPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteStaffId, setDeleteStaffId] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = staff.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStaff(filtered);
    } else {
      setFilteredStaff(staff);
    }
  }, [searchTerm, staff]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await staffService.getAll();
      setStaff(data);
      setFilteredStaff(data);
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteStaffId) return;

    try {
      await staffService.delete(deleteStaffId);
      toast({
        title: "Staff Member Deleted",
        description: "The staff member has been deleted successfully."
      });
      fetchStaff();
    } catch (error) {
      console.error("Error deleting staff member:", error);
      toast({
        title: "Error",
        description: "Failed to delete staff member",
        variant: "destructive"
      });
    } finally {
      setDeleteStaffId(null);
    }
  };

  const columns = [
    {
      accessorKey: "name" as keyof Staff,
      header: "Staff Member",
      cell: ({ row }: { row: { original: Staff } }) => {
        const member = row.original;
        return (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <User className="h-8 w-8 text-blue-600 bg-blue-100 rounded-full p-1.5" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">{member.name}</div>
              {member.email && (
                <div className="text-sm text-gray-500 flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  {member.email}
                </div>
              )}
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: "role" as keyof Staff,
      header: "Role",
      cell: ({ row }: { row: { original: Staff } }) => {
        const member = row.original;
        return (
          <div className="flex items-center text-sm text-gray-900">
            <UserCheck className="h-4 w-4 mr-1 text-gray-400" />
            {member.role || "N/A"}
          </div>
        );
      }
    },
    {
      accessorKey: "phone" as keyof Staff,
      header: "Contact",
      cell: ({ row }: { row: { original: Staff } }) => {
        const member = row.original;
        return (
          <div className="flex items-center text-sm text-gray-900">
            <Phone className="h-4 w-4 mr-1 text-gray-400" />
            {member.phone || "N/A"}
          </div>
        );
      }
    }
  ];

  const actions = [
    {
      label: "Edit",
      icon: Edit,
      onClick: (member: Staff) => navigate(`/staff/edit/${member.id}`)
    },
    {
      label: "Delete",
      icon: Trash2,
      onClick: (member: Staff) => setDeleteStaffId(member.id),
      variant: "destructive" as const
    }
  ];

  if (isMobile) {
    return (
      <div className="page-container pb-20">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search staff..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8">Loading staff...</div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "No staff members found matching your search." : "No staff members found. Add your first staff member!"}
            </div>
          ) : (
            filteredStaff.map((member) => (
              <div key={member.id} className="bg-white p-4 rounded-lg border mobile-card">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <User className="h-8 w-8 text-blue-600 bg-blue-100 rounded-full p-1.5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{member.name}</h3>
                      {member.email && (
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <Mail className="h-3 w-3 mr-1" />
                          {member.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <UserCheck className="h-4 w-4 mr-2 text-gray-400" />
                    {member.role || "N/A"}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {member.phone || "N/A"}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/staff/edit/${member.id}`)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700"
                    onClick={() => setDeleteStaffId(member.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <FloatingActionButton
          onClick={() => navigate("/staff/add")}
          icon={Plus}
          label="Add Staff"
        />

        <AlertDialog open={!!deleteStaffId} onOpenChange={() => setDeleteStaffId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this staff member? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
            Add Staff
          </Button>
        }
      />

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search staff..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredStaff}
        isLoading={loading}
        emptyMessage={searchTerm ? "No staff members found matching your search." : "No staff members found. Add your first staff member!"}
      />

      <AlertDialog open={!!deleteStaffId} onOpenChange={() => setDeleteStaffId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this staff member? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
