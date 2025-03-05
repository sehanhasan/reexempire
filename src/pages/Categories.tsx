
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Button } from "@/components/ui/button";
import { 
  Edit,
  MoreHorizontal,
  Trash,
  FolderPlus,
  ChevronRight,
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
} from "@/components/ui/dropdown-menu";
import { SubcategoryModal, Subcategory } from "@/components/categories/SubcategoryModel";
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
} from "@/components/ui/alert-dialog";

import { Category } from "@/types/database";

export default function Categories() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | undefined>(undefined);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  
  // Fetch categories from the API
  const { data: categories = [], refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const categories = await categoryService.getAll();
      
      // Fetch subcategories for each category
      const categoriesWithSubcategories = await Promise.all(
        categories.map(async (category) => {
          const subcategories = await categoryService.getSubcategoriesByCategoryId(category.id);
          return {
            ...category,
            subcategories: subcategories || []
          };
        })
      );
      
      return categoriesWithSubcategories;
    }
  });

  const handleAddSubcategory = (category: Category) => {
    setSelectedCategory(category);
    setEditingSubcategory(undefined);
    setShowSubcategoryModal(true);
  };

  const handleEditSubcategory = (category: Category, subcategory: Subcategory) => {
    setSelectedCategory(category);
    setEditingSubcategory(subcategory);
    setShowSubcategoryModal(true);
  };

  const handleSaveSubcategory = async (subcategory: Subcategory) => {
    if (!selectedCategory) return;

    try {
      if (subcategory.id.startsWith('subcat-')) {
        // This is a new subcategory (with temporary ID)
        await categoryService.createSubcategory({
          name: subcategory.name,
          description: subcategory.description,
          category_id: selectedCategory.id
        });
        
        // Save each pricing option
        for (const option of subcategory.pricingOptions) {
          if (option.name.trim()) {
            await categoryService.createPricingOption({
              name: option.name,
              price: option.price,
              unit: option.unit,
              subcategory_id: subcategory.id
            });
          }
        }
      } else {
        // Update existing subcategory
        await categoryService.updateSubcategory(subcategory.id, {
          name: subcategory.name,
          description: subcategory.description
        });
        
        // Handle pricing options updates (this is simplified)
        // In a full implementation, you'd need to track which options were added, updated, or deleted
      }
      
      toast({
        title: "Subcategory Saved",
        description: `${subcategory.name} has been saved successfully.`,
      });
      
      // Refresh the categories data
      refetch();
      
    } catch (error) {
      console.error("Error saving subcategory:", error);
      toast({
        title: "Error",
        description: "There was an error saving the subcategory.",
        variant: "destructive"
      });
    }
  };

  const handleEditCategory = (category: Category) => {
    navigate(`/categories/add?id=${category.id}`);
  };

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setShowConfirmDelete(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
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
      
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "There was an error deleting the category.",
        variant: "destructive"
      });
    }
  };

  const columns = [
    {
      header: "ID",
      accessorKey: "id" as keyof Category,
    },
    {
      header: "Name",
      accessorKey: "name" as keyof Category,
      cell: (category: Category) => (
        <div 
          className="flex items-center font-medium text-blue-600 cursor-pointer"
          onClick={() => handleEditCategory(category)}
        >
          {category.name}
          <ChevronRight className="ml-1 h-4 w-4" />
        </div>
      ),
    },
    {
      header: "Description",
      accessorKey: "description" as keyof Category,
    },
    {
      header: "Subcategories",
      accessorKey: "subcategories" as keyof Category,
      cell: (category: Category) => (
        <div className="flex items-center">
          <span className="mr-2">{category.subcategories?.length || 0}</span>
          {category.subcategories?.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-blue-600"
              onClick={() => {
                toast({
                  title: "Subcategories for " + category.name,
                  description: category.subcategories.map(sub => sub.name).join(", "),
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
      cell: (category: Category) => {
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
        );
      },
    },
  ];

  return (
    <div className="page-container">
      <PageHeader 
        title="Service Categories" 
        description="Manage your service categories and subcategories."
        actions={
          <Button className="flex items-center" onClick={() => navigate("/categories/add")}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        }
      />
      
      <div className="mt-8">
        <DataTable 
          columns={columns} 
          data={categories} 
          searchKey="name" 
        />
      </div>

      {selectedCategory && (
        <SubcategoryModal
          open={showSubcategoryModal}
          onOpenChange={setShowSubcategoryModal}
          category={selectedCategory}
          subcategory={editingSubcategory}
          onSave={handleSaveSubcategory}
        />
      )}

      <AlertDialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
