import React, { useState, useRef } from 'react';
import { Plus, Search, Edit, Trash2, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useProducts, type Product } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { supabase } from '../../lib/supabase';

export default function Products() {
  const { products, loading, addProduct, updateProduct, deleteProduct } = useProducts();
  const { categories } = useCategories();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryName = (id: string) => {
    return categories.find(c => c.id === id)?.name || 'Unknown';
  };

  const resetForm = () => {
    setName('');
    setCategoryId(categories[0]?.id || '');
    setPrice('');
    setImageUrls([]);
    setEditingProduct(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setCategoryId(product.category_id);
    setPrice(product.price.toString());
    setImageUrls(product.image_urls || (product.image_url ? [product.image_url] : []));
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(id);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newUrls = [...imageUrls];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        // Ensure you have a 'products' bucket in Supabase storage, or use a default one
        const { error } = await supabase.storage.from('images').upload(filePath, file);
        
        if (error) {
          console.error("Upload error:", error);
          // If offline or bucket doesn't exist, fallback to object URL for demo purposes
          const objectUrl = URL.createObjectURL(file);
          newUrls.push(objectUrl);
        } else {
          const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
          newUrls.push(publicUrl);
        }
      }
      setImageUrls(newUrls);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId || !price) return;

    const productData = {
      name,
      category_id: categoryId,
      price: parseFloat(price),
      image_url: imageUrls[0] || 'https://via.placeholder.com/150',
      image_urls: imageUrls
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, productData);
    } else {
      await addProduct(productData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  return (
    <div className="flex-1 overflow-y-auto pr-4 pb-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your menu items and stock</p>
        </div>
        <Button onClick={openAddDialog} className="rounded-full h-12 px-6 font-bold shadow-md shadow-primary/20 gap-2">
          <Plus size={20} /> Add Product
        </Button>
      </div>

      <Card className="rounded-3xl border-none shadow-sm flex flex-col p-6 min-h-[500px]">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-muted/50 border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="text-xs font-bold text-muted-foreground border-b border-border">
                <th className="pb-3 px-2 w-16">Image</th>
                <th className="pb-3 px-2">Name</th>
                <th className="pb-3 px-2">Category</th>
                <th className="pb-3 px-2">Price</th>
                <th className="pb-3 px-2">Status</th>
                <th className="pb-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">Loading products...</td>
                </tr>
              ) : filteredProducts.map(product => (
                <tr key={product.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
                  <td className="py-3 px-2">
                    <img src={product.image_urls?.[0] || product.image_url} alt={product.name} className="w-12 h-12 rounded-xl object-cover bg-muted" />
                  </td>
                  <td className="py-3 px-2 font-bold text-sm">{product.name}</td>
                  <td className="py-3 px-2 text-sm text-muted-foreground font-semibold">
                    {getCategoryName(product.category_id)}
                  </td>
                  <td className="py-3 px-2 font-extrabold text-sm">${Number(product.price).toFixed(2)}</td>
                  <td className="py-3 px-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">Active</Badge>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground font-semibold">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Product Name</label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                placeholder="e.g. Iced Latte"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={categoryId} 
                  onChange={e => setCategoryId(e.target.value)}
                  required
                >
                  <option value="" disabled>Select category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Price ($)</label>
                <Input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={price} 
                  onChange={e => setPrice(e.target.value)} 
                  required 
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Images</label>
              
              <div className="flex flex-wrap gap-2 mb-2">
                {imageUrls.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-md overflow-hidden border border-border group">
                    <img src={url} alt="upload" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-md border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {isUploading ? <Loader2 className="animate-spin" size={20} /> : <ImageIcon size={20} />}
                  <span className="text-[10px] mt-1 font-semibold">{isUploading ? 'Uploading...' : 'Add Photo'}</span>
                </button>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                multiple 
                className="hidden" 
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingProduct ? 'Save Changes' : 'Add Product'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
