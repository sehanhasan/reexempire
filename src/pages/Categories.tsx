
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Button } from "@/components/ui/button";
import { 
  Edit,
  MoreHorizontal,
  Trash,
  List
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { categoryService } from "@/services/categoryService";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  closeDropdown
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  closeAlertDialog
} from "@/components/ui/alert-dialog";

import { Category } from "@/types/database";

export default function Categories() {
  const navigate = useNavigate();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  
  // Fetch categories from the API - using queryKey with proper caching
  const { data: categories = [], refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const categories = await categoryService.getAll();
      
      // Fetch subcategories for each category - using Set to avoid duplicates
      const processedCategories = new Map();
      
      for (const category of categories) {
        if (!processedCategories.has(category.id)) {
          const subcategories = await categoryService.getSubcategoriesByCategoryId(category.id);
          processedCategories.set(category.id, {
            ...category,
            subcategories: subcategories || []
          });
        }
      }
      
      return Array.from(processedCategories.values());
    }
  });

  const handleEditCategory = (category: Category) => {
    navigate(`/categories/add?id=${category.id}`);
  };

  const handleDeleteCategory = (category: Category) => {
    // Close dropdown first to prevent UI freeze
    closeDropdown();
    
    // Set a small timeout before showing alert dialog
    setTimeout(() => {
      setCategoryToDelete(category);
      setShowConfirmDelete(true);
    }, 50);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      // Close dialog first
      closeAlertDialog();
      
      // Set a small timeout before performing the delete
      setTimeout(async () => {
        await categoryService.delete(categoryToDelete.id);
        
        toast({
          title: "Error",
          description: `${categoryToDelete.name} has been deleted.`,
          variant: "destructive",
        });
        
        setCategoryToDelete(null);
        setShowConfirmDelete(false);
        
        // Refresh the categories data
        refetch();
      }, 100);
      
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "There was an error deleting the category.",
        variant: "destructive"
      });
    }
  };

  const handleCancelDelete = () => {
    // Close dialog
    closeAlertDialog();
    
    // Set a small timeout before updating state
    setTimeout(() => {
      setShowConfirmDelete(false);
      setCategoryToDelete(null);
    }, 100);
  };

  const columns = [
    {
      header: "Name",
      accessorKey: "name" as keyof Category,
      cell: ({ row }: { row: { original: Category } }) => (
        <div 
          className="flex items-center font-medium text-blue-600 cursor-pointer"
          onClick={() => handleEditCategory(row.original)}
        >
          {row.original.name}
        </div>
      ),
    },
    {
      header: "Subcategories",
      accessorKey: "subcategories" as keyof Category,
      cell: ({ row }: { row: { original: Category } }) => (
        <div className="flex items-center">
          <span className="mr-2">{row.original.subcategories?.length || 0}</span>
          {(row.original.subcategories?.length || 0) > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-blue-600"
              onClick={() => {
                toast({
                  title: "Error",
                  description: `Could not display subcategories for ${row.original.name}`,
                  variant: "destructive",
                });
              }}
            >
              <List className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id" as keyof Category,
      cell: ({ row }: { row: { original: Category } }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => handleEditCategory(row.original)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600"
                onClick={() => handleDeleteCategory(row.original)}
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
        title="Service Categories" 
      />
      
      <div className="mt-6">
        <DataTable 
          columns={columns} 
          data={categories} 
          searchKey="name" 
        />
      </div>

      <AlertDialog 
        open={showConfirmDelete} 
        onOpenChange={(open) => {
          if (!open) {
            handleCancelDelete();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category
              {categoryToDelete ? ` "${categoryToDelete.name}"` : ''} and all its subcategories.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteCategory}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FloatingActionButton onClick={() => navigate("/categories/add")} />
    </div>
  );
}
