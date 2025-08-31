import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { inventoryCategoryService, InventoryCategory } from "@/services/inventoryCategoryService";

interface InventoryCategoryDialogProps {
  onCategoryChanged: () => void;
  category?: InventoryCategory;
  mode?: 'add' | 'edit';
}

export function InventoryCategoryDialog({ onCategoryChanged, category, mode = 'add' }: InventoryCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || ""
  });
  const { toast } = useToast();

  const isEdit = mode === 'edit' && !!category;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit && category) {
        await inventoryCategoryService.update(category.id, formData);
        toast({ title: "Updated", description: "Inventory category updated" });
      } else {
        await inventoryCategoryService.create(formData);
        toast({ title: "Created", description: "Inventory category created" });
      }
      onCategoryChanged();
      setOpen(false);
    } catch (error) {
      console.error('Error saving inventory category:', error);
      toast({ title: "Error", description: "Failed to save inventory category", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="outline" size="sm">Edit</Button>
        ) : (
          <Button>Add Category</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Inventory Category' : 'Add Inventory Category'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update' : 'Create')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
