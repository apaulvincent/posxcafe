import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { supabase } from '../lib/supabase';
import { Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

interface StorageFile {
  name: string;
  url: string;
}

const PAGE_SIZE = 30;

export function MediaLibraryModal({ isOpen, onClose, onSelect }: MediaLibraryModalProps) {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setFiles([]);
      setOffset(0);
      setHasMore(true);
      fetchFiles(0);
    }
  }, [isOpen]);

  const fetchFiles = async (currentOffset: number) => {
    if (currentOffset === 0) setLoading(true);
    else setLoadingMore(true);
    
    setError(null);
    try {
      const { data, error: fetchError } = await supabase.storage.from('images').list('products', {
        limit: PAGE_SIZE,
        offset: currentOffset,
        sortBy: { column: 'created_at', order: 'desc' }
      });

      if (fetchError) throw fetchError;

      if (data) {
        if (data.length < PAGE_SIZE) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
        
        // filter out placeholder files like .emptyFolderPlaceholder
        const validFiles = data.filter(file => file.name !== '.emptyFolderPlaceholder' && file.name !== '.empty');
        
        const filesWithUrls = validFiles.map(file => {
          const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(`products/${file.name}`);
          return { name: file.name, url: publicUrl };
        });
        
        if (currentOffset === 0) {
          setFiles(filesWithUrls);
        } else {
          setFiles(prev => {
            // Avoid duplicates just in case
            const existingNames = new Set(prev.map(f => f.name));
            const newUnique = filesWithUrls.filter(f => !existingNames.has(f.name));
            return [...prev, ...newUnique];
          });
        }
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error('Error fetching media:', err);
      setError(err.message || 'Failed to load media library');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && !loading && !loadingMore) {
      const newOffset = offset + PAGE_SIZE;
      setOffset(newOffset);
      fetchFiles(newOffset);
    }
  };

  const handleDelete = async (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this image permanently?')) return;
    
    try {
      const { error } = await supabase.storage.from('images').remove([`products/${fileName}`]);
      if (error) throw error;
      setFiles(prev => prev.filter(f => f.name !== fileName));
    } catch (err) {
      console.error('Failed to delete image:', err);
      alert('Failed to delete image');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select from Library</DialogTitle>
        </DialogHeader>
        
        <div 
          className="flex-1 overflow-y-auto p-2 min-h-[300px]"
          onScroll={handleScroll}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
              <Loader2 className="animate-spin" size={32} />
              <p>Loading images...</p>
            </div>
          ) : error && files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-destructive gap-2">
              <p>{error}</p>
              <Button variant="outline" onClick={() => fetchFiles(0)}>Retry</Button>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
              <ImageIcon size={48} className="opacity-20" />
              <p>No images found in library.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 pb-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {files.map((file) => (
                  <div 
                    key={file.name} 
                    className="aspect-square relative rounded-xl overflow-hidden border-2 border-transparent hover:border-primary cursor-pointer group transition-colors"
                    onClick={() => {
                      onSelect(file.url);
                      onClose();
                    }}
                  >
                    <button
                      onClick={(e) => handleDelete(e, file.name)}
                      className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive transition-all z-10"
                    >
                      <Trash2 size={14} />
                    </button>
                    <img 
                      src={file.url} 
                      alt={file.name} 
                      className="w-full h-full object-cover bg-muted group-hover:scale-105 transition-transform duration-300" 
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-bold">Select</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {loadingMore && (
                <div className="flex justify-center py-4 text-muted-foreground">
                  <Loader2 className="animate-spin" size={24} />
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
