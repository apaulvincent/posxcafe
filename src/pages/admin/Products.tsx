import imageCompression from 'browser-image-compression';
import { Edit, Image as ImageIcon, Library, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { ImageCropperModal } from '../../components/ImageCropperModal';
import { MediaLibraryModal } from '../../components/MediaLibraryModal';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { useCategories } from '../../hooks/useCategories';
import { useProducts, type Product } from '../../hooks/useProducts';
import { getStoragePathFromUrl, supabase } from '../../lib/supabase';

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
  
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [currentFileExt, setCurrentFileExt] = useState<string>('jpg');

  const [libraryOpen, setLibraryOpen] = useState(false);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop() || 'jpg';
    setCurrentFileExt(ext);

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setCropImageSrc(reader.result?.toString() || null);
      setCropperOpen(true);
    });
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropComplete = async (croppedFile: File) => {
    setIsUploading(true);
    try {
      const newUrls = [...imageUrls];
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${currentFileExt}`;
      const filePath = `products/${fileName}`;

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 500,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(croppedFile, options);

      const { error } = await supabase.storage.from('images').upload(filePath, compressedFile);
      
      if (error) {
        console.error("Upload error:", error);
        newUrls.push(URL.createObjectURL(croppedFile));
      } else {
        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
        newUrls.push(publicUrl);
      }
      setImageUrls(newUrls);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLibrarySelect = (url: string) => {
    setImageUrls([...imageUrls, url]);
  };

  const removeImage = (index: number) => {
    const urlToRemove = imageUrls[index];
    if (urlToRemove) {
      const path = getStoragePathFromUrl(urlToRemove);
      if (path) {
        supabase.storage.from('images').remove([path]).catch(console.error);
      }
    }
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
        <DialogContent className="sm:max-w-[500px] pb-0 pt-4">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Product Name</label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                placeholder="e.g. Iced Latte"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</label>
              <Select value={categoryId} onValueChange={(val) => setCategoryId(val as string)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category">
                    {categoryId ? categories.find(c => c.id === categoryId)?.name : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id} label={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

                <button 
                  type="button"
                  onClick={() => setLibraryOpen(true)}
                  className="w-20 h-20 rounded-md border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Library size={20} />
                  <span className="text-[10px] mt-1 font-semibold">Library</span>
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
      {cropImageSrc && (
        <ImageCropperModal
          isOpen={cropperOpen}
          onClose={() => setCropperOpen(false)}
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
        />
      )}
      <MediaLibraryModal 
        isOpen={libraryOpen} 
        onClose={() => setLibraryOpen(false)} 
        onSelect={handleLibrarySelect} 
      />
    </div>
  );
}
