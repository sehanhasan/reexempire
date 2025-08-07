import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { categoryService } from "@/services";
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { SubcategoriesDialog } from "@/components/categories/SubcategoriesDialog";

export default function Categories() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getAll();
        setCategories(data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast({
          title: "Error",
          description: "Failed to fetch categories. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleEdit = (categoryId: string) => {
    navigate(`/categories/edit/${categoryId}`);
  };

  const handleDelete = async (categoryId: string) => {
    try {
      await categoryService.delete(categoryId);
      setCategories(categories.filter(category => category.id !== categoryId));
      toast({
        title: "Category Deleted",
        description: "Category has been deleted successfully.",
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

  const handleSubcategories = (category: any) => {
    setSelectedCategory(category);
  };

  const columns = [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Description",
      accessorKey: "description",
      cell: ({ row }) => {
        const description = row.getValue("description");
        return description || "-";
      },
    },
    {
      header: "Items Count",
      accessorKey: "subcategories",
      cell: ({ row }) => {
        const subcategories = row.original.subcategories || [];
        return subcategories.length;
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="page-container">
        <PageHeader title="Categories" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Categories"
        actions={
          <Button onClick={() => navigate("/categories/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={categories}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSubcategories={handleSubcategories}
        emptyMessage="No categories found. Add your first category to get started."
      />

      {selectedCategory && (
        <SubcategoriesDialog 
          category={selectedCategory}
          open={!!selectedCategory}
          onOpenChange={(open) => !open && setSelectedCategory(null)}
        />
      )}
    </div>
  );
}
