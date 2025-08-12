
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SubcategoriesDialog } from "@/components/categories/SubcategoriesDialog";
import { SubcategoryModel } from "@/components/categories/SubcategoryModel";
import { toast } from "@/components/ui/use-toast";
import { Plus, Search, Edit, Trash2, Eye, Package, Layers } from "lucide-react";
import { categoryService } from "@/services";
import { Category, Subcategory } from "@/types/database";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Categories() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showSubcategoriesDialog, setShowSubcategoriesDialog] = useState(false);
  const [showSubcategoryModel, setShowSubcategoryModel] = useState(false);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [searchTerm, categories]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAll();
      setCategories(data);
      setFilteredCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCategoryId) return;

    try {
      await categoryService.delete(deleteCategoryId);
      toast({
        title: "Category Deleted",
        description: "The category has been deleted successfully."
      });
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive"
      });
    } finally {
      setDeleteCategoryId(null);
    }
  };

  const handleViewSubcategories = async (categoryId: string) => {
    try {
      const subcategoriesData = await categoryService.getSubcategoriesByCategoryId(categoryId);
      setSubcategories(subcategoriesData);
      setSelectedCategoryId(categoryId);
      setShowSubcategoriesDialog(true);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      toast({
        title: "Error",
        description: "Failed to load subcategories",
        variant: "destructive"
      });
    }
  };

  const handleAddSubcategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setShowSubcategoryModel(true);
  };

  const handleSubcategorySaved = () => {
    if (selectedCategoryId) {
      handleViewSubcategories(selectedCategoryId);
    }
  };

  const columns = [
    {
      key: "name" as keyof Category,
      header: "Category",
      render: (category: Category) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Package className="h-8 w-8 text-purple-600 bg-purple-100 rounded-full p-1.5" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{category.name}</div>
            {category.description && (
              <div className="text-sm text-gray-500">{category.description}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: "subcategories" as keyof Category,
      header: "Items",
      render: (category: Category) => (
        <div className="flex items-center text-sm text-gray-900">
          <Layers className="h-4 w-4 mr-1 text-gray-400" />
          {Array.isArray(category.subcategories) ? category.subcategories.length : 0} subcategories
        </div>
      )
    }
  ];

  const actions = [
    {
      label: "View Items",
      icon: Eye,
      onClick: (category: Category) => handleViewSubcategories(category.id)
    },
    {
      label: "Edit",
      icon: Edit,
      onClick: (category: Category) => navigate(`/categories/add?id=${category.id}`)
    },
    {
      label: "Delete",
      icon: Trash2,
      onClick: (category: Category) => setDeleteCategoryId(category.id),
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
              placeholder="Search categories..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8">Loading categories...</div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "No categories found matching your search." : "No categories found. Add your first category!"}
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div key={category.id} className="bg-white p-4 rounded-lg border mobile-card">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Package className="h-8 w-8 text-purple-600 bg-purple-100 rounded-full p-1.5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Layers className="h-4 w-4 mr-2 text-gray-400" />
                    {Array.isArray(category.subcategories) ? category.subcategories.length : 0} subcategories
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewSubcategories(category.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/categories/add?id=${category.id}`)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setDeleteCategoryId(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <FloatingActionButton
          onClick={() => navigate("/categories/add")}
          icon={Plus}
          label="Add Category"
        />

        <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this category? This action cannot be undone and will also delete all subcategories.
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

        <SubcategoriesDialog
          open={showSubcategoriesDialog}
          onOpenChange={setShowSubcategoriesDialog}
          categoryId={selectedCategoryId}
          subcategories={subcategories}
          onAddSubcategory={() => selectedCategoryId && handleAddSubcategory(selectedCategoryId)}
          onRefresh={() => selectedCategoryId && handleViewSubcategories(selectedCategoryId)}
        />

        <SubcategoryModel
          open={showSubcategoryModel}
          onOpenChange={setShowSubcategoryModel}
          parentId={selectedCategoryId || ""}
          onSave={handleSubcategorySaved}
        />
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

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search categories..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredCategories}
        actions={actions}
        loading={loading}
        emptyMessage={searchTerm ? "No categories found matching your search." : "No categories found. Add your first category!"}
      />

      <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot be undone and will also delete all subcategories.
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

      <SubcategoriesDialog
        open={showSubcategoriesDialog}
        onOpenChange={setShowSubcategoriesDialog}
        categoryId={selectedCategoryId}
        subcategories={subcategories}
        onAddSubcategory={() => selectedCategoryId && handleAddSubcategory(selectedCategoryId)}
        onRefresh={() => selectedCategoryId && handleViewSubcategories(selectedCategoryId)}
      />

      <SubcategoryModel
        open={showSubcategoryModel}
        onOpenChange={setShowSubcategoryModel}
        parentId={selectedCategoryId || ""}
        onSave={handleSubcategorySaved}
      />
    </div>
  );
}
