import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { categoryService } from "@/services/categoryService";
import { Plus, Trash2 } from "lucide-react";

interface CategoryDialogProps {
  onCategoryChanged: () => void;
  category?: { id: string; name: string; description: string };
  mode?: 'add' | 'edit';
}

export function CategoryDialog({ onCategoryChanged, category, mode = 'add' }: CategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'edit' && category) {
        await categoryService.update(category.id, formData);
        toast({
          title: "Success",
          description: "Category updated successfully"
        });
      } else {
        await categoryService.create(formData);
        toast({
          title: "Success",
          description: "Category created successfully"
        });
      }
      
      setFormData({ name: "", description: "" });
      setOpen(false);
      onCategoryChanged();
    } catch (error) {
      console.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} category:`, error);
      toast({
        title: "Error",
        description: `Failed to ${mode === 'edit' ? 'update' : 'create'} category`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!category) return;
    
    setDeleteLoading(true);
    try {
      await categoryService.delete(category.id);
      toast({
        title: "Success",
        description: "Category deleted successfully"
      });
      setOpen(false);
      onCategoryChanged();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive"
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'add' ? (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Category' : 'Add New Category'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Name *</Label>
            <Input
              id="category-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter category name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category-description">Description</Label>
            <Textarea
              id="category-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter category description"
              rows={3}
            />
          </div>
          
          <div className="flex justify-between">
            {mode === 'edit' && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteLoading ? "Deleting..." : "Delete"}
              </Button>
            )}
            <div className="flex space-x-2 ml-auto">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (mode === 'edit' ? "Updating..." : "Creating...") : (mode === 'edit' ? "Update Category" : "Create Category")}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}