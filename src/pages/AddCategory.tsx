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
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface SubcategoryForm {
  id?: string;
  tempId: number | string;
  price: string;
  description: string;
  unit: string;
  deleted?: boolean;
}

export default function AddCategory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("id");
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState({
    name: "",
    description: ""
  });
  const [subcategories, setSubcategories] = useState<SubcategoryForm[]>([{
    tempId: Date.now(),
    price: "",
    description: "",
    unit: ""
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
          const uniqueSubcategories = new Map();
          data.subcategories.forEach(sub => {
            if (!uniqueSubcategories.has(sub.id)) {
              uniqueSubcategories.set(sub.id, {
                id: sub.id,
                tempId: Date.now() + Math.random(),
                price: sub.price ? sub.price.toString() : "",
                description: sub.description || "",
                unit: sub.unit || ""
              });
            }
          });
          
          setSubcategories(Array.from(uniqueSubcategories.values()));
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
    const {
      name,
      value
    } = e.target;
    setCategory(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubcategoryChange = (index: number, field: keyof SubcategoryForm, value: string | boolean) => {
    const updatedSubcategories = [...subcategories];
    (updatedSubcategories[index] as any)[field] = value;
    setSubcategories(updatedSubcategories);
  };

  const addSubcategory = () => {
    setSubcategories([...subcategories, {
      tempId: Date.now(),
      price: "",
      description: "",
      unit: ""
    }]);
  };

  const removeSubcategory = (index: number) => {
    if (subcategories.length === 1) {
      setSubcategories([{
        tempId: Date.now(),
        price: "",
        description: "",
        unit: ""
      }]);
    } else {
      const updated = [...subcategories];
      if (updated[index].id) {
        // Mark for deletion if it has an ID (existing subcategory)
        updated[index].deleted = true;
      } else {
        // Remove if it's a new subcategory
        updated.splice(index, 1);
      }
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
      setLoading(true);
      const formattedData = {
        name: category.name,
        description: category.description,
        subcategories: subcategories.filter(sub => !sub.deleted).map(sub => ({
          ...(sub.id ? {
            id: sub.id
          } : {}),
          description: sub.description,
          price: sub.price ? parseFloat(sub.price) : 0,
          name: sub.description,
          unit: sub.unit || ""
        })),
        deletedSubcategories: subcategories.filter(sub => sub.deleted && sub.id).map(sub => sub.id)
      };
      if (edit && categoryId) {
        await categoryService.update(categoryId, formattedData);
        toast({
          title: "Success",
          description: "Category updated successfully"
        });
      } else {
        await categoryService.create(formattedData);
        toast({
          title: "Success",
          description: "New category created successfully"
        });
      }
      setLoading(false);
      navigate("/categories");
    } catch (error) {
      console.error("Error saving category:", error);
      toast({
        title: "Error",
        description: `Failed to ${edit ? "update" : "create"} category. Please try again.`,
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  return <div className={`${isMobile ? 'page-container' : 'mt-6'}`}>
      <PageHeader title={edit ? "Edit Category" : "Add Category"} />
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6 mt-6">
          <Card>
            {/* <CardHeader>
              <CardTitle className="text-lg text-cyan-600">Category Information</CardTitle>
              <CardDescription>
                Enter the basic information for this category.
              </CardDescription>
            </CardHeader> */}
            <CardContent className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Category Name*</Label>
                <Input id="name" name="name" placeholder="e.g. Bathroom Renovation" value={category.name} onChange={handleCategoryChange} required />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-cyan-600">Subcategories</CardTitle>
              <CardDescription>
                Add subcategories and pricing for this category.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {subcategories.filter(sub => !sub.deleted).map((subcategory, index) => <div key={typeof subcategory.tempId === 'string' ? subcategory.tempId : subcategory.tempId.toString()} className="space-y-4 pb-4 border-b last:border-b-0">
                  <div className="flex justify-between items-center bg-gray-100 p-6">
                    <h3 className="font-medium text-base">Subcategory {index + 1}</h3>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSubcategory(index)} disabled={subcategories.length === 1 && !edit}>
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`subcategory-description-${index}`}>Description*</Label>
                      <Textarea id={`subcategory-description-${index}`} placeholder="e.g. Complete bathroom renovation" value={subcategory.description} onChange={e => handleSubcategoryChange(index, 'description', e.target.value)} rows={3} required />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor={`subcategory-price-${index}`}>Price (RM)</Label>
                        <Input id={`subcategory-price-${index}`} type="number" min="0" step="0.01" placeholder="Enter price" value={subcategory.price} onChange={e => handleSubcategoryChange(index, 'price', e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor={`subcategory-unit-${index}`}>Unit</Label>
                        <Input id={`subcategory-unit-${index}`} placeholder="e.g. ft, sqft, unit" value={subcategory.unit} onChange={e => handleSubcategoryChange(index, 'unit', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>)}
              
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
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : edit ? 'Update Category' : 'Add Category'}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>;
}
