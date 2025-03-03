
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
  Eye,
  FolderPlus,
  ChevronRight,
  List
} from "lucide-react";

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

interface Category {
  id: string;
  name: string;
  description: string;
  subcategories: Subcategory[];
}

export default function Categories() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | undefined>(undefined);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [showCategoryDetails, setShowCategoryDetails] = useState(false);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  
  // Mock data - would come from API in real app
  const [categories, setCategories] = useState<Category[]>([
    { 
      id: "CAT-001", 
      name: "Bathroom Renovation", 
      description: "Complete bathroom remodeling services", 
      subcategories: [
        {
          id: "SUB-001",
          name: "Toilet Installation",
          description: "Removal and installation of toilets",
          pricingOptions: [
            { id: "PO-001", name: "Standard Toilet", price: 250, unit: "Unit" },
            { id: "PO-002", name: "Premium Toilet", price: 450, unit: "Unit" }
          ]
        },
        {
          id: "SUB-002",
          name: "Sink Installation",
          description: "Removal and installation of sinks",
          pricingOptions: [
            { id: "PO-003", name: "Standard Sink", price: 200, unit: "Unit" },
            { id: "PO-004", name: "Premium Sink", price: 350, unit: "Unit" }
          ]
        }
      ]
    },
    { 
      id: "CAT-002", 
      name: "Kitchen Remodeling", 
      description: "Kitchen upgrade and renovation", 
      subcategories: [
        {
          id: "SUB-003",
          name: "Cabinets Installation",
          description: "Installation of kitchen cabinets",
          pricingOptions: [
            { id: "PO-005", name: "Standard Cabinets", price: 450, unit: "Unit" },
            { id: "PO-006", name: "Custom Cabinets", price: 800, unit: "Unit" }
          ]
        }
      ]
    },
    { id: "CAT-003", name: "Flooring", description: "All types of flooring installation and repair", subcategories: [] },
    { id: "CAT-004", name: "Painting", description: "Interior and exterior painting services", subcategories: [] },
    { id: "CAT-005", name: "Electrical Work", description: "All electrical installation and repairs", subcategories: [] },
    { id: "CAT-006", name: "Plumbing", description: "Plumbing services and fixtures", subcategories: [] },
    { id: "CAT-007", name: "Roofing", description: "Roof repair and installation", subcategories: [] },
  ]);

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

  const handleSaveSubcategory = (subcategory: Subcategory) => {
    if (!selectedCategory) return;

    setCategories(categories.map(category => {
      if (category.id !== selectedCategory.id) return category;

      const existingIndex = category.subcategories.findIndex(sc => sc.id === subcategory.id);
      
      if (existingIndex >= 0) {
        // Update existing subcategory
        const updatedSubcategories = [...category.subcategories];
        updatedSubcategories[existingIndex] = subcategory;
        
        toast({
          title: "Subcategory Updated",
          description: `${subcategory.name} has been updated successfully.`,
        });
        
        return { ...category, subcategories: updatedSubcategories };
      } else {
        // Add new subcategory
        toast({
          title: "Subcategory Added",
          description: `${subcategory.name} has been added to ${category.name}.`,
        });
        
        return { 
          ...category, 
          subcategories: [...category.subcategories, subcategory] 
        };
      }
    }));
  };

  const handleViewCategory = (category: Category) => {
    setViewingCategory(category);
    setShowCategoryDetails(true);
    toast({
      title: "Category Details",
      description: `Viewing details for ${category.name}`
    });
  };

  const handleEditCategory = (category: Category) => {
    navigate(`/categories/add?id=${category.id}`);
    toast({
      title: "Edit Category",
      description: `Editing ${category.name}`
    });
  };

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setShowConfirmDelete(true);
  };

  const confirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    
    setCategories(categories.filter(c => c.id !== categoryToDelete.id));
    setCategoryToDelete(null);
    setShowConfirmDelete(false);
    
    toast({
      title: "Category Deleted",
      description: `${categoryToDelete.name} has been deleted.`,
      variant: "destructive",
    });
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
          onClick={() => handleViewCategory(category)}
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
          <span className="mr-2">{category.subcategories.length}</span>
          {category.subcategories.length > 0 && (
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
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => handleViewCategory(category)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => handleEditCategory(category)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => handleAddSubcategory(category)}
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                Add Subcategory
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
