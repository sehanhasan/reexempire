
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, MoreHorizontal, Trash, ChevronRight, FolderOpen, Plus, Tag, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { categoryService } from "@/services/categoryService";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, closeDropdown } from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, closeAlertDialog } from "@/components/ui/alert-dialog";
import "../styles/mobile-card.css";
import { Category, Subcategory } from "@/types/database";
import { SubcategoriesDialog } from "@/components/categories/SubcategoriesDialog";

export default function Categories() {
  const navigate = useNavigate();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [showSubcategories, setShowSubcategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Fetch categories from the API - using queryKey with proper caching
  const {
    data: categories = [],
    refetch
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const categories = await categoryService.getAll();

      // Fetch subcategories for each category - using Map to avoid duplicates
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
          variant: "destructive"
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
  
  const columns = [{
    header: "Category",
    accessorKey: "name" as keyof Category,
    cell: ({
      row
    }: {
      row: {
        original: Category;
      };
    }) => <div className="flex items-center font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors group" onClick={() => handleEditCategory(row.original)}>
          <div className="p-2 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors mr-3">
            <FolderOpen className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 group-hover:text-blue-600">
              {row.original.name}
            </div>
            {row.original.description && (
              <div className="text-sm text-gray-500 mt-1">
                {row.original.description}
              </div>
            )}
          </div>
        </div>
  }, {
    header: "Subcategories", 
    accessorKey: "subcategories" as keyof Category,
    cell: ({
      row
    }: {
      row: {
        original: Category;
      };
    }) => <div className="flex items-center justify-between">
          <Badge variant="secondary" className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 hover:from-blue-100 hover:to-indigo-100 font-medium">
            <Tag className="h-3 w-3 mr-1" />
            {row.original.subcategories?.length || 0} items
          </Badge>
          {(row.original.subcategories?.length || 0) > 0 && <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 h-8" onClick={() => handleViewSubcategories(row.original)}>
              <ChevronRight className="h-4 w-4" />
            </Button>}
        </div>
  }, {
    header: "Actions",
    accessorKey: "id" as keyof Category,
    cell: ({
      row
    }: {
      row: {
        original: Category;
      };
    }) => {
      return <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem className="cursor-pointer" onClick={() => handleEditCategory(row.original)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600" onClick={() => handleDeleteCategory(row.original)}>
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>;
    }
  }];

  // Custom render function for mobile view to match the design
  const renderCustomMobileCard = (category: Category) => <Card key={category.id} className="overflow-hidden border-l-4 border-l-blue-500 shadow-sm hover:shadow-lg transition-all duration-200 group">
      <CardContent className="p-0">
        {/* Card Header with primary information */}
        <div className="flex justify-between items-center px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50 group-hover:from-blue-100 group-hover:to-indigo-100 transition-all">
          <div className="flex items-center text-blue-700 font-semibold cursor-pointer hover:text-blue-800 transition-colors" onClick={() => handleEditCategory(category)}>
            <div className="p-2 rounded-lg bg-blue-100 mr-3">
              <FolderOpen className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="font-semibold">{category.name}</div>
              {category.description && (
                <div className="text-sm text-blue-600 mt-1">{category.description}</div>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-200/50">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem className="cursor-pointer" onClick={() => handleEditCategory(category)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600" onClick={() => handleDeleteCategory(category)}>
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Card Content */}
        <div onClick={() => handleViewSubcategories(category)} className="flex justify-between items-center px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex items-center text-gray-700">
            <div className="p-2 rounded-lg bg-gray-100 mr-3">
              <Tag className="h-4 w-4 text-gray-600" />
            </div>
            <span className="font-medium">Subcategories</span>
          </div>
          <div className="flex items-center">
            <Badge variant="secondary" className="bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200 mr-2 font-medium">
              {category.subcategories?.length || 0}
            </Badge>
            <ChevronRight className="h-4 w-4 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>;

  // Calculate stats
  const totalSubcategories = categories.reduce((sum, cat) => sum + (cat.subcategories?.length || 0), 0);
  
  return <div className="page-container">
      <PageHeader 
        title="Service Categories" 
        description="Organize your services into categories and subcategories for better management." 
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 font-medium">
                <FolderOpen className="mr-1 h-3 w-3" />
                {categories.length} Categories
              </Badge>
              <Badge variant="secondary" className="bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200 font-medium">
                <Tag className="mr-1 h-3 w-3" />
                {totalSubcategories} Subcategories
              </Badge>
            </div>
            <div className="hidden sm:flex items-center text-xs text-gray-500">
              <TrendingUp className="h-3 w-3 mr-1" />
              Well organized
            </div>
          </div>
        } 
      />
      
      <div className="mt-6">
        <Card className="shadow-sm border-0 bg-white overflow-hidden">
          <CardContent className="p-0">
            <DataTable 
              columns={columns} 
              data={categories} 
              searchKey="name" 
              renderCustomMobileCard={renderCustomMobileCard} 
              emptyMessage="No categories found. Add your first service category to get started." 
            />
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showConfirmDelete} onOpenChange={open => {
      if (!open) {
        handleCancelDelete();
      }
    }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
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
            <AlertDialogAction onClick={confirmDeleteCategory} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedCategory && <SubcategoriesDialog open={showSubcategories} onOpenChange={setShowSubcategories} category={selectedCategory} />}

      <FloatingActionButton onClick={() => navigate("/categories/add")} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl">
        <Plus className="h-6 w-6" />
      </FloatingActionButton>
    </div>;
}
