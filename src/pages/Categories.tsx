
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
  ChevronRight,
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

import "../styles/mobile-card.css";
import { Card } from "@/components/ui/card";
import { Category, Subcategory } from "@/types/database";
import { SubcategoriesDialog } from "@/components/categories/SubcategoriesDialog";

export default function Categories() {
  const navigate = useNavigate();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [showSubcategories, setShowSubcategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
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

  const handleViewSubcategories = (category: Category) => {
    setSelectedCategory(category);
    setShowSubcategories(true);
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
          title: "Category Deleted",
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
              onClick={() => handleViewSubcategories(row.original)}
            >
              <ChevronRight className="h-4 w-4" />
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

  // Custom render function for mobile view to match the design
  const renderCustomMobileCard = (category: Category) => (
    <Card key={category.id} className="mobile-card border-l-blue-500 overflow-visible">
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
        <div className="text-blue-600 font-medium">{category.name}</div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => handleEditCategory(category)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer text-red-600"
              onClick={() => handleDeleteCategory(category)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div 
        className="flex justify-between items-center px-4 py-3 cursor-pointer" 
        onClick={() => handleViewSubcategories(category)}
      >
        <div className="text-gray-600">Subcategories</div>
        <div className="flex items-center">
          <span className="mr-2">{category.subcategories?.length || 0}</span>
          <ChevronRight className="h-4 w-4 text-blue-600" />
        </div>
      </div>
    </Card>
  );

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
          renderCustomMobileCard={renderCustomMobileCard}
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

      {selectedCategory && (
        <SubcategoriesDialog 
          open={showSubcategories}
          onOpenChange={setShowSubcategories}
          category={selectedCategory}
        />
      )}

      <FloatingActionButton onClick={() => navigate("/categories/add")} />
    </div>
  );
}
