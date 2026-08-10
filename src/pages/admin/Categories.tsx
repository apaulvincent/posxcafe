import { Edit, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { useCategories, type Category } from '../../hooks/useCategories';

export default function Categories() {
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories();

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [statusText, setStatusText] = useState('Available');
  const [alert, setAlert] = useState(false);

  const resetForm = () => {
    setName('');
    setSlug('');
    setStatusText('Available');
    setAlert(false);
    setEditingCategory(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setSlug(category.slug);
    setStatusText(category.status_text);
    setAlert(category.alert);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      await deleteCategory(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;

    const categoryData = {
      name,
      slug,
      status_text: statusText,
      alert
    };

    if (editingCategory) {
      await updateCategory(editingCategory.id, categoryData);
    } else {
      await addCategory(categoryData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  return (
    <div className="flex-1 overflow-y-auto pr-4 pb-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Categories</h1>
          <p className="text-muted-foreground mt-1">Manage product categories</p>
        </div>
        <Button onClick={openAddDialog} className="rounded-full h-12 px-6 font-bold shadow-md shadow-primary/20 gap-2">
          <Plus size={20} /> Add Category
        </Button>
      </div>

      <Card className="rounded-3xl border-none shadow-sm flex flex-col p-6 min-h-[500px]">
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="text-xs font-bold text-muted-foreground border-b border-border">
                <th className="pb-3 px-2">Name</th>
                <th className="pb-3 px-2">Slug</th>
                <th className="pb-3 px-2">Status</th>
                <th className="pb-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-muted-foreground">Loading categories...</td>
                </tr>
              ) : categories.map(cat => (
                <tr key={cat.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
                  <td className="py-4 px-2 font-bold text-sm">{cat.name}</td>
                  <td className="py-4 px-2 text-sm text-muted-foreground font-semibold">{cat.slug}</td>
                  <td className="py-4 px-2">
                    {cat.alert ? (
                      <Badge variant="destructive" className="hover:bg-destructive">Needs Attention</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">{cat.status_text}</Badge>
                    )}
                  </td>
                  <td className="py-4 px-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(cat as Category)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-muted-foreground font-semibold">No categories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px] pb-0 pt-4">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Name</label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                placeholder="e.g. Coffee"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Slug</label>
              <Input 
                value={slug} 
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} 
                required 
                placeholder="e.g. coffee"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status Text</label>
              <Input 
                value={statusText} 
                onChange={e => setStatusText(e.target.value)} 
                required 
                placeholder="e.g. Available"
              />
            </div>
            
            <div className="flex items-center gap-3 mt-4">
              <Checkbox 
                id="alert-toggle" 
                checked={alert} 
                onChange={e => setAlert((e.target as HTMLInputElement).checked)}
              />
              <label htmlFor="alert-toggle" className="text-sm font-semibold cursor-pointer">Needs Attention (Alert State)</label>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingCategory ? 'Save Changes' : 'Add Category'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
