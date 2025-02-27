
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

interface SubCategory {
  id: number;
  name: string;
  description: string;
}

export default function AddCategory() {
  const navigate = useNavigate();
  const [subcategories, setSubcategories] = useState<SubCategory[]>([
    { id: 1, name: "", description: "" }
  ]);
  
  const addSubcategory = () => {
    const newId = subcategories.length > 0 ? Math.max(...subcategories.map(item => item.id)) + 1 : 1;
    setSubcategories([...subcategories, { id: newId, name: "", description: "" }]);
  };
  
  const removeSubcategory = (id: number) => {
    if (subcategories.length > 1) {
      setSubcategories(subcategories.filter(item => item.id !== id));
    }
  };
  
  const handleSubcategoryChange = (id: number, field: keyof SubCategory, value: string) => {
    setSubcategories(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would save to the database
    toast({
      title: "Category Added",
      description: "The category has been added successfully."
    });
    
    navigate("/categories");
  };
  
  return (
    <div className="page-container">
      <PageHeader
        title="Add Category"
        description="Add a new service category with subcategories."
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
              <Input id="name" placeholder="e.g. Kitchen Renovation" required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Enter a description of this service category..."
                rows={3} 
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
                
                <div className="space-y-4">
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
                    <Textarea 
                      id={`subDescription-${subcategory.id}`} 
                      value={subcategory.description}
                      onChange={(e) => handleSubcategoryChange(subcategory.id, "description", e.target.value)}
                      placeholder="Enter a brief description..." 
                      rows={2} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Pricing Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceRange">Price Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">RM</span>
                    <Input id="minPrice" placeholder="Min" className="pl-10" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">RM</span>
                    <Input id="maxPrice" placeholder="Max" className="pl-10" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pricingModel">Pricing Model</Label>
                <Input id="pricingModel" placeholder="e.g. Per Square Meter, Fixed Price, etc." />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-4">
            <Button variant="outline" type="button" onClick={() => navigate("/categories")}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              Save Category
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
