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
  Package,
  Plus,
  List
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { SubcategoriesDialog } from "@/components/categories/SubcategoriesDialog";
import { categoryService } from "@/services";
import { Category } from "@/types/database";

export default function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showSubcategoriesDialog, setShowSubcategoriesDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const fetchCategories = async () => {
    try {
      const data = await categoryService.getAll();
      // Sort by most recent first (created_at in descending order)
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setCategories(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Failed to load categories. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Set up mobile search
  useEffect(() => {
    const mobileSearchEvent = new CustomEvent('setup-mobile-search', {
      detail: {
        searchTerm,
        onSearchChange: setSearchTerm,
        placeholder: "Search categories..."
      }
    });
    window.dispatchEvent(mobileSearchEvent);

    return () => {
      window.dispatchEvent(new CustomEvent('clear-mobile-search'));
    };
  }, [searchTerm]);

  const handleEdit = (category: Category) => {
    navigate(`/categories/add?id=${category.id}`);
  };

  const handleDelete = async (category: Category) => {
    try {
      await categoryService.delete(category.id);
      setCategories(categories.filter(c => c.id !== category.id));
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
      
      toast({
        title: "Category Deleted",
        description: `${category.name} has been deleted successfully.`,
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewSubcategories = (category: Category) => {
    setSelectedCategory(category);
    setShowSubcategoriesDialog(true);
  };

  const columns = [
    {
      header: "Name",
      accessorKey: "name" as keyof Category,
      cell: ({ row }: { row: { original: Category } }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      header: "Description",
      accessorKey: "description" as keyof Category,
      cell: ({ row }: { row: { original: Category } }) => (
        <span className="text-muted-foreground">{row.original.description || 'No description'}</span>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id" as keyof Category,
      cell: ({ row }: { row: { original: Category } }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewSubcategories(row.original)}
          >
            <List className="mr-1 h-4 w-4" />
            Items
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row.original)}
          >
            <Edit className="mr-1 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCategoryToDelete(row.original);
              setShowDeleteConfirm(true);
            }}
            className="text-red-600 hover:text-red-700"
          >
            <Trash className="mr-1 h-4 w-4" />
            Delete
          </Button>
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
            <span className="ml-2 text-lg">Loading categories...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-2">
        <PageHeader 
          title="Categories" 
          description="Manage your item categories and subcategories."
        />
        
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <DataTable 
            columns={columns} 
            data={categories} 
            searchKey="name" 
            externalSearchTerm={searchTerm}
            onExternalSearchChange={setSearchTerm}
          />
        </div>

        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Category</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-medium">{categoryToDelete?.name}</span>
                ? This will also delete all items in this category. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => {
                if (categoryToDelete) handleDelete(categoryToDelete);
              }}>
                <Trash className="mr-2 h-4 w-4" />
                Delete Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <SubcategoriesDialog
          open={showSubcategoriesDialog}
          onOpenChange={setShowSubcategoriesDialog}
          category={selectedCategory}
        />

        <FloatingActionButton onClick={() => navigate("/categories/add")} />
      </div>
    </div>
  );
}
