
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { categoryService } from "@/services";
import { Plus, Trash, ArrowLeft } from "lucide-react";

interface SubcategoryForm {
  id?: string;
  tempId: number | string;
  price: string;
  description: string;
  name?: string;
}

export default function AddCategory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("id");
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [category, setCategory] = useState({
    name: "",
    description: ""
  });
  const [subcategories, setSubcategories] = useState<SubcategoryForm[]>([{
    tempId: Date.now(),
    price: "",
    description: ""
  }]);
  const [edit, setEdit] = useState(false);
  
  useEffect(() => {
    if (categoryId) {
      setEdit(true);
      fetchCategory(categoryId);
    }
  }, [categoryId]);
  
  const fetchCategory = async (id: string) => {
    try {
      setLoading(true);
      const data = await categoryService.getById(id);
      if (data) {
        setCategory({
          name: data.name || "",
          description: data.description || ""
        });
        
        if (data.subcategories && data.subcategories.length > 0) {
          const formSubcategories = data.subcategories.map(sub => ({
            id: sub.id,
            tempId: sub.id || Date.now(),
            price: sub.price ? sub.price.toString() : "",
            description: sub.description || "",
            name: sub.name || sub.description || ""
          }));
          setSubcategories(formSubcategories);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching category:", error);
      toast({
        title: "Error",
        description: "Failed to load category details",
        variant: "destructive"
      });
      setLoading(false);
      navigate("/categories");
    }
  };
  
  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCategory(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubcategoryChange = (index: number, field: keyof SubcategoryForm, value: string) => {
    const updatedSubcategories = [...subcategories];
    updatedSubcategories[index][field] = value;
    setSubcategories(updatedSubcategories);
  };
  
  const addSubcategory = () => {
    setSubcategories([...subcategories, {
      tempId: Date.now(),
      price: "",
      description: ""
    }]);
  };
  
  const removeSubcategory = (index: number) => {
    if (subcategories.length === 1) {
      setSubcategories([{
        tempId: Date.now(),
        price: "",
        description: ""
      }]);
    } else {
      const updated = subcategories.filter((_, i) => i !== index);
      setSubcategories(updated);
    }
  };
  
  const validate = () => {
    if (!category.name) {
      toast({
        title: "Validation Error",
        description: "Category name is required",
        variant: "destructive"
      });
      return false;
    }
    
    for (let i = 0; i < subcategories.length; i++) {
      const sub = subcategories[i];
      if (!sub.description) {
        toast({
          title: "Validation Error",
          description: `Subcategory ${i + 1} description is required`,
          variant: "destructive"
        });
        return false;
      }
      
      if (sub.price && isNaN(parseFloat(sub.price))) {
        toast({
          title: "Validation Error",
          description: `Invalid price for subcategory ${i + 1}`,
          variant: "destructive"
        });
        return false;
      }
    }
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    try {
      setIsSaving(true);
      
      // Only include category name and description for the API call
      const categoryData = {
        name: category.name,
        description: category.description
      };
      
      if (edit && categoryId) {
        await categoryService.update(categoryId, categoryData);
        
        // Handle subcategories separately
        for (const sub of subcategories) {
          if (sub.id) {
            // Update existing subcategory
            await supabase
              .from("subcategories")
              .update({
                name: sub.description,
                description: sub.description,
                price: sub.price ? parseFloat(sub.price) : 0
              })
              .eq("id", sub.id);
          } else {
            // Create new subcategory
            await supabase
              .from("subcategories")
              .insert({
                name: sub.description,
                description: sub.description,
                price: sub.price ? parseFloat(sub.price) : 0,
                category_id: categoryId
              });
          }
        }
        
        toast({
          title: "Success",
          description: "Category updated successfully"
        });
      } else {
        // Create new category
        const newCategory = await categoryService.create(categoryData);
        
        // Create subcategories
        for (const sub of subcategories) {
          await supabase
            .from("subcategories")
            .insert({
              name: sub.description,
              description: sub.description,
              price: sub.price ? parseFloat(sub.price) : 0,
              category_id: newCategory.id
            });
        }
        
        toast({
          title: "Success",
          description: "New category created successfully"
        });
      }
      
      navigate("/categories");
    } catch (error) {
      console.error("Error saving category:", error);
      toast({
        title: "Error",
        description: `Failed to ${edit ? "update" : "create"} category. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return <div className="page-container">
      <PageHeader 
        title={edit ? "Edit Category" : "Add Category"} 
        actions={
          <Button variant="outline" onClick={() => navigate("/categories")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        } 
      />
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Category Name*</Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="e.g. Bathroom Renovation" 
                  value={category.name} 
                  onChange={handleCategoryChange} 
                  required 
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Subcategories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {subcategories.map((subcategory, index) => (
                <div key={typeof subcategory.tempId === 'string' ? subcategory.tempId : subcategory.tempId.toString()} className="space-y-4 pb-4 border-b last:border-b-0">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Subcategory {index + 1}</h3>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeSubcategory(index)} 
                      disabled={subcategories.length === 1 && !edit}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`subcategory-description-${index}`}>Description*</Label>
                      <Textarea 
                        id={`subcategory-description-${index}`} 
                        placeholder="e.g. Complete bathroom renovation" 
                        value={subcategory.description} 
                        onChange={e => handleSubcategoryChange(index, 'description', e.target.value)} 
                        rows={3} 
                        required 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`subcategory-price-${index}`}>Price (RM)</Label>
                      <Input 
                        id={`subcategory-price-${index}`} 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        placeholder="Enter price" 
                        value={subcategory.price} 
                        onChange={e => handleSubcategoryChange(index, 'price', e.target.value)} 
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <Button type="button" variant="outline" onClick={addSubcategory} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Another Subcategory
              </Button>
            </CardContent>
            <CardFooter className="flex justify-end border-t p-6">
              <div className="space-x-2">
                <Button type="button" variant="outline" onClick={() => navigate("/categories")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || isSaving}>
                  {isSaving ? 'Saving...' : edit ? 'Update Category' : 'Add Category'}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>;
}
