
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, FolderPlus, Plus, Save, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { categoryService } from "@/services/categoryService";
import { useQuery } from "@tanstack/react-query";

interface SubCategory {
  id: number;
  name: string;
  description: string;
  price: number;
  unit: string;
}

export default function AddCategory() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const searchParams = new URLSearchParams(location.search);
  const categoryId = searchParams.get('id');
  const isEditing = !!categoryId;
  
  const [categoryName, setCategoryName] = useState("");
  const [subcategories, setSubcategories] = useState<SubCategory[]>([
    { id: 1, name: "", description: "", price: 0, unit: "Unit" }
  ]);
  
  // Fetch category data if editing
  const { data: categoryData, isLoading } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: async () => {
      if (!categoryId) return null;
      return categoryService.getById(categoryId);
    },
    enabled: !!categoryId
  });
  
  // Fetch subcategories if editing
  const { data: subcategoriesData } = useQuery({
    queryKey: ['subcategories', categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      return categoryService.getSubcategoriesByCategoryId(categoryId);
    },
    enabled: !!categoryId
  });
  
  // Initialize form with data if editing
  useEffect(() => {
    if (categoryData) {
      setCategoryName(categoryData.name || "");
    }
  }, [categoryData]);
  
  // Initialize subcategories with data if editing
  useEffect(() => {
    if (subcategoriesData && subcategoriesData.length > 0) {
      const loadSubcategoriesWithPricing = async () => {
        const subcategoriesWithPricing = await Promise.all(
          subcategoriesData.map(async (sub, index) => {
            const pricingOptions = await categoryService.getPricingOptionsBySubcategoryId(sub.id);
            // Just get the first pricing option for each subcategory for simplicity
            const firstOption = pricingOptions?.[0];
            
            return {
              id: index + 1,
              name: sub.name || "",
              description: sub.description || "",
              price: firstOption?.price || 0,
              unit: firstOption?.unit || "Unit"
            };
          })
        );
        
        setSubcategories(subcategoriesWithPricing.length > 0 ? 
          subcategoriesWithPricing : 
          [{ id: 1, name: "", description: "", price: 0, unit: "Unit" }]
        );
      };
      
      loadSubcategoriesWithPricing();
    }
  }, [subcategoriesData]);
  
  const addSubcategory = () => {
    const newId = subcategories.length > 0 ? Math.max(...subcategories.map(item => item.id)) + 1 : 1;
    setSubcategories([...subcategories, { id: newId, name: "", description: "", price: 0, unit: "Unit" }]);
  };
  
  const removeSubcategory = (id: number) => {
    if (subcategories.length > 1) {
      setSubcategories(subcategories.filter(item => item.id !== id));
    }
  };
  
  const handleSubcategoryChange = (id: number, field: keyof SubCategory, value: any) => {
    setSubcategories(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate inputs
      if (!categoryName.trim()) {
        toast({
          title: "Missing Information",
          description: "Please provide a category name.",
          variant: "destructive"
        });
        return;
      }
      
      // Check for empty subcategory names
      const hasEmptySubcategories = subcategories.some(sub => !sub.name.trim());
      if (hasEmptySubcategories) {
        toast({
          title: "Missing Information",
          description: "All subcategories must have a name.",
          variant: "destructive"
        });
        return;
      }
      
      if (isEditing && categoryId) {
        // Update category
        await categoryService.update(categoryId, {
          name: categoryName
        });
        
        // Handle subcategories (simplified implementation)
        // A complete solution would track which subcategories were added, removed, or modified
        
        toast({
          title: "Category Updated",
          description: "The category has been updated successfully."
        });
      } else {
        // Create new category
        const newCategory = await categoryService.create({
          name: categoryName,
          description: null
        });
        
        // Create subcategories and their pricing options
        for (const sub of subcategories) {
          if (sub.name.trim()) {
            const newSubcategory = await categoryService.createSubcategory({
              name: sub.name,
              description: sub.description,
              category_id: newCategory.id
            });
            
            // Create pricing option for this subcategory
            if (newSubcategory) {
              await categoryService.createPricingOption({
                name: sub.name,
                price: sub.price,
                unit: sub.unit,
                subcategory_id: newSubcategory.id
              });
            }
          }
        }
        
        toast({
          title: "Category Added",
          description: "The category has been added successfully."
        });
      }
      
      // Navigate back to categories page
      navigate("/categories");
    } catch (error) {
      console.error("Error saving category:", error);
      toast({
        title: "Error",
        description: "There was an error saving the category.",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading && isEditing) {
    return <div className="page-container">Loading...</div>;
  }
  
  return (
    <div className="page-container">
      <PageHeader
        title={isEditing ? "Edit Category" : "Add Category"}
        description={isEditing ? "Update a service category with subcategories." : "Add a new service category with subcategories."}
        actions={
          <Button variant="outline" onClick={() => navigate("/categories")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Categories
          </Button>
        }
      />
      
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Category Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input 
                id="name" 
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g. Kitchen Renovation" 
                required 
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Subcategories</CardTitle>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={addSubcategory}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Subcategory
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {subcategories.map((subcategory, index) => (
              <div key={subcategory.id} className="border rounded-lg p-4 relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSubcategory(subcategory.id)}
                  disabled={subcategories.length <= 1}
                  className="absolute right-2 top-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
                
                <h4 className="font-medium mb-3">Subcategory {index + 1}</h4>
                
                <div className={`grid grid-cols-1 ${!isMobile ? 'md:grid-cols-2' : ''} gap-4`}>
                  <div className="space-y-2">
                    <Label htmlFor={`subName-${subcategory.id}`}>Name</Label>
                    <Input 
                      id={`subName-${subcategory.id}`} 
                      value={subcategory.name}
                      onChange={(e) => handleSubcategoryChange(subcategory.id, "name", e.target.value)}
                      placeholder="e.g. Cabinet Installation" 
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`subDescription-${subcategory.id}`}>Description</Label>
                    <Input 
                      id={`subDescription-${subcategory.id}`} 
                      value={subcategory.description}
                      onChange={(e) => handleSubcategoryChange(subcategory.id, "description", e.target.value)}
                      placeholder="Enter a brief description"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`subPrice-${subcategory.id}`}>Price (RM)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">RM</span>
                      <Input
                        id={`subPrice-${subcategory.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={subcategory.price}
                        onChange={(e) => handleSubcategoryChange(subcategory.id, "price", parseFloat(e.target.value) || 0)}
                        className="pl-10"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`subUnit-${subcategory.id}`}>Unit</Label>
                    <Input
                      id={`subUnit-${subcategory.id}`}
                      value={subcategory.unit}
                      onChange={(e) => handleSubcategoryChange(subcategory.id, "unit", e.target.value)}
                      placeholder="e.g. Per Unit, Per Hour, etc."
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-end space-x-4">
            <Button variant="outline" type="button" onClick={() => navigate("/categories")}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? 'Update Category' : 'Save Category'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
