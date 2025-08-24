
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { categoryService } from '@/services';

interface Subcategory {
  id?: string;
  category_id: string;
  name: string;
  description: string; // Changed from optional to required to match the API expectations
  price?: number;
  unit?: string;
}

interface SubcategoryModelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: string;
  categoryId?: string;
  initialData?: Subcategory;
  onSave: () => void;
}

export function SubcategoryModel({
  open,
  onOpenChange,
  parentId,
  categoryId,
  initialData,
  onSave,
}: SubcategoryModelProps) {
  const [formData, setFormData] = useState<Subcategory>({
    category_id: parentId,
    name: '',
    description: '', // Initialize with empty string since it's required
    price: 0,
    unit: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        category_id: parentId,
      });
    } else {
      setFormData({
        category_id: parentId,
        name: '',
        description: '', // Initialize with empty string
        price: 0,
        unit: '',
      });
    }
  }, [initialData, parentId, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'price') {
      // Only allow numbers and decimals for price
      const numValue = parseFloat(value);
      setFormData({
        ...formData,
        [name]: isNaN(numValue) ? 0 : numValue,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (categoryId) {
        // Update existing subcategory
        await categoryService.updateSubcategory(categoryId, {
          ...formData,
          category_id: parentId,
        });
        toast({
          title: 'Subcategory Updated',
          description: 'The subcategory has been updated successfully.',
        });
      } else {
        // Create new subcategory
        await categoryService.createSubcategory({
          ...formData,
          category_id: parentId,
        });
        toast({
          title: 'Subcategory Created',
          description: 'The subcategory has been created successfully.',
        });
      }
      
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving subcategory:', error);
      toast({
        title: 'Error',
        description: 'There was a problem saving the subcategory.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{categoryId ? 'Edit Subcategory' : 'Add Subcategory'}</DialogTitle>
          <DialogDescription>
            {categoryId
              ? 'Make changes to the subcategory details.'
              : 'Create a new subcategory for this parent category.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={3}
                required // Added required attribute to match type requirement
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="price">Price (RM)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  name="unit"
                  value={formData.unit || ''}
                  onChange={handleChange}
                  placeholder="e.g. ft, sqft, unit"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : categoryId ? 'Save Changes' : 'Add Subcategory'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
