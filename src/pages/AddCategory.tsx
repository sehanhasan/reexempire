import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { PageHeader } from '@/components/ui/page-header';
import { categoryService } from '@/services';
import { Category, Subcategory } from '@/types/database';

export default function AddCategory() {
  const router = useRouter();
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const addSubcategory = () => {
    const newSubcategory: Subcategory = {
      category_id: '',
      name: '',
      description: '',
      price: 0,
      unit: '', // Add unit field
      tempId: Date.now() + Math.random()
    };
    setSubcategories([...subcategories, newSubcategory]);
  };

  const removeSubcategory = (index: number) => {
    const newSubcategories = [...subcategories];
    newSubcategories.splice(index, 1);
    setSubcategories(newSubcategories);
  };

  const handleSubcategoryChange = (index: number, field: string, value: any) => {
    const newSubcategories = [...subcategories];
    newSubcategories[index] = {
      ...newSubcategories[index],
      [field]: value,
    };
    setSubcategories(newSubcategories);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const categoryData = {
        name: categoryName,
        description: categoryDescription,
        subcategories: subcategories.map(sub => ({
          name: sub.name,
          description: sub.description,
          price: sub.price,
          unit: sub.unit
        }))
      };

      await categoryService.create(categoryData);

      toast({
        title: 'Category Created',
        description: 'The category has been created successfully.',
      });

      router.push('/categories');
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: 'Error',
        description: 'There was a problem creating the category.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <PageHeader title="Add Category" subtitle="Create a new category" />
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="categoryName" className="text-base font-medium">Category Name</Label>
          <Input
            id="categoryName"
            type="text"
            placeholder="Category Name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="categoryDescription" className="text-base font-medium">Category Description</Label>
          <Textarea
            id="categoryDescription"
            placeholder="Category Description"
            value={categoryDescription}
            onChange={(e) => setCategoryDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div>
          <Label className="text-base font-medium">Subcategories</Label>
          <div className="space-y-4 mt-2">
            {subcategories.map((subcategory, index) => (
              <Card key={subcategory.tempId || subcategory.id} className="p-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`name-${index}`}>Name</Label>
                    <Input
                      id={`name-${index}`}
                      type="text"
                      placeholder="Name"
                      value={subcategory.name}
                      onChange={(e) => handleSubcategoryChange(index, 'name', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor={`description-${index}`}>Description</Label>
                    <Textarea
                      id={`description-${index}`}
                      placeholder="Description"
                      value={subcategory.description}
                      onChange={(e) => handleSubcategoryChange(index, 'description', e.target.value)}
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`price-${index}`}>Price (RM)</Label>
                      <Input
                        id={`price-${index}`}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={subcategory.price || ''}
                        onChange={(e) => handleSubcategoryChange(index, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`unit-${index}`}>Unit (Optional)</Label>
                      <Input
                        id={`unit-${index}`}
                        type="text"
                        placeholder="e.g., ft, sqm, piece"
                        value={subcategory.unit || ''}
                        onChange={(e) => handleSubcategoryChange(index, 'unit', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Button type="button" variant="destructive" size="sm" onClick={() => removeSubcategory(index)}>
                    Remove
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          
          <Button type="button" variant="secondary" onClick={addSubcategory}>
            Add Subcategory
          </Button>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Create Category'}
          </Button>
        </div>
      </form>
    </div>
  );
}
