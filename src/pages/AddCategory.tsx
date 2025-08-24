
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { SubcategoryModel } from '@/components/categories/SubcategoryModel';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { categoryService } from '@/services';
import { Category, Subcategory } from '@/types/database';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';

export default function AddCategory() {
  const navigate = useNavigate();
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [createdCategoryId, setCreatedCategoryId] = useState<string | null>(null);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingCategory(true);
    try {
      const newCategory = await categoryService.create({
        name: categoryName.trim(),
        description: categoryDescription.trim() || null,
      });
      
      setCreatedCategoryId(newCategory.id);
      toast({
        title: "Success",
        description: "Category created successfully! You can now add subcategories.",
      });
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleSubcategorySaved = async () => {
    if (createdCategoryId) {
      try {
        const updatedSubcategories = await categoryService.getSubcategoriesByCategoryId(createdCategoryId);
        // Remove duplicates
        const uniqueSubcategories = new Map();
        updatedSubcategories.forEach(sub => {
          if (!uniqueSubcategories.has(sub.id)) {
            uniqueSubcategories.set(sub.id, {
              ...sub,
              unit: sub.unit || ''
            });
          }
        });
        setSubcategories(Array.from(uniqueSubcategories.values()));
      } catch (error) {
        console.error('Error fetching subcategories:', error);
      }
    }
    setEditingSubcategory(null);
  };

  const handleDeleteSubcategory = async (subcategoryId: string) => {
    try {
      await categoryService.deleteSubcategory(subcategoryId);
      // Remove from local state immediately
      setSubcategories(prev => prev.filter(sub => sub.id !== subcategoryId));
      toast({
        title: "Success",
        description: "Subcategory deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      toast({
        title: "Error",
        description: "Failed to delete subcategory",
        variant: "destructive",
      });
    }
  };

  const handleEditSubcategory = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    setShowSubcategoryModal(true);
  };

  const handleAddSubcategory = () => {
    setEditingSubcategory(null);
    setShowSubcategoryModal(true);
  };

  const handleFinish = () => {
    toast({
      title: "Success",
      description: "Category and subcategories created successfully!",
    });
    navigate('/categories');
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <PageHeader
        title="Add Category"
        actions={
          <Button variant="ghost" onClick={() => navigate('/categories')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Categories
          </Button>
        }
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Category Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <Label htmlFor="categoryName">Category Name *</Label>
                <Input
                  id="categoryName"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  disabled={!!createdCategoryId}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="categoryDescription">Description</Label>
                <Textarea
                  id="categoryDescription"
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  placeholder="Enter category description (optional)"
                  disabled={!!createdCategoryId}
                  rows={3}
                />
              </div>

              {!createdCategoryId && (
                <Button type="submit" disabled={isCreatingCategory}>
                  {isCreatingCategory ? 'Creating...' : 'Create Category'}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {createdCategoryId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Subcategories
                <Button onClick={handleAddSubcategory}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subcategory
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subcategories.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  No subcategories added yet. Click "Add Subcategory" to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {subcategories.map((subcategory) => (
                    <div key={subcategory.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{subcategory.name}</div>
                        <div className="text-sm text-gray-600">{subcategory.description}</div>
                        <div className="flex items-center space-x-2">
                          {subcategory.price && (
                            <Badge variant="secondary">
                              RM {subcategory.price.toFixed(2)}
                              {subcategory.unit && `/${subcategory.unit}`}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSubcategory(subcategory)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSubcategory(subcategory.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t">
                <Button onClick={handleFinish} className="w-full">
                  Finish & Go to Categories
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <SubcategoryModel
        open={showSubcategoryModal}
        onOpenChange={setShowSubcategoryModal}
        parentId={createdCategoryId || ''}
        categoryId={editingSubcategory?.id}
        initialData={editingSubcategory || undefined}
        onSave={handleSubcategorySaved}
      />
    </div>
  );
}
