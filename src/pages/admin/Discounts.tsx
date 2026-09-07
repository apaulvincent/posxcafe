import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tag, Plus, Edit2, Trash2, Power, Percent, DollarSign } from 'lucide-react';
import { useDiscounts } from '@/hooks/useDiscounts';
import { db, type LocalDiscount } from '@/lib/db';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function Discounts() {
  const { discounts, loading } = useDiscounts();
  const { currencySymbol } = useCurrency();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [type, setType] = useState<'percent' | 'amount'>('percent');
  const [value, setValue] = useState('');

  const openModal = (discount?: LocalDiscount) => {
    if (discount) {
      setEditingId(discount.id);
      setName(discount.name);
      setType(discount.type);
      setValue(discount.value.toString());
    } else {
      setEditingId(null);
      setName('');
      setType('percent');
      setValue('');
    }
    setIsModalOpen(true);
  };

  const saveDiscount = async () => {
    if (!name.trim() || !value) return;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return;

    try {
      if (editingId) {
        await db.discounts.update(editingId, {
          name,
          type,
          value: numValue,
          sync_status: 'pending'
        });
      } else {
        await db.discounts.add({
          id: crypto.randomUUID(),
          name,
          type,
          value: numValue,
          is_active: true,
          sync_status: 'pending'
        });
      }
      setIsModalOpen(false);
    } catch (e) {
      console.error('Failed to save discount', e);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await db.discounts.update(id, { is_active: !currentStatus, sync_status: 'pending' });
    } catch (e) {
      console.error('Failed to toggle discount', e);
    }
  };

  const deleteDiscount = async (id: string) => {
    if (confirm('Are you sure you want to delete this discount?')) {
      try {
        await db.discounts.delete(id);
      } catch (e) {
        console.error('Failed to delete discount', e);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 h-full p-6 animate-in fade-in duration-300 overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Discounts</h1>
          <p className="text-muted-foreground font-medium mt-1">Manage global discounts and promotions.</p>
        </div>
        <Button onClick={() => openModal()} className="rounded-full font-bold h-12 px-6 gap-2">
          <Plus size={20} /> Add Discount
        </Button>
      </div>

      <Card className="rounded-3xl border-none shadow-sm flex flex-col p-6 min-h-[400px]">
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="text-xs font-bold text-muted-foreground border-b border-border">
                <th className="pb-3 px-4">Name</th>
                <th className="pb-3 px-4">Value</th>
                <th className="pb-3 px-4 text-center">Status</th>
                <th className="pb-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map(discount => (
                <tr key={discount.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
                  <td className="py-4 px-4 font-bold">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${discount.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        <Tag size={16} />
                      </div>
                      {discount.name}
                    </div>
                  </td>
                  <td className="py-4 px-4 font-bold text-lg">
                    {discount.type === 'percent' ? `${discount.value}%` : `${currencySymbol}${discount.value.toFixed(2)}`}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Button 
                      variant="ghost" 
                      onClick={() => toggleStatus(discount.id, discount.is_active)}
                      className={`h-8 px-3 rounded-full text-xs font-bold ${discount.is_active ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                    >
                      <Power size={14} className="mr-1" />
                      {discount.is_active ? 'Active' : 'Inactive'}
                    </Button>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" className="w-9 h-9 rounded-full" onClick={() => openModal(discount)}>
                        <Edit2 size={14} />
                      </Button>
                      <Button variant="outline" size="icon" className="w-9 h-9 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20" onClick={() => deleteDiscount(discount.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {discounts.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-sm font-bold text-muted-foreground">
                    No discounts created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Discount' : 'Create Discount'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Discount Name</label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. Summer Promo" 
                className="h-12 rounded-xl bg-muted/50 border-transparent focus:bg-background"
              />
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Type</label>
                <div className="flex gap-2">
                  <Button 
                    variant={type === 'percent' ? 'default' : 'outline'} 
                    onClick={() => setType('percent')}
                    className="flex-1 rounded-xl"
                  >
                    <Percent size={16} className="mr-2" /> %
                  </Button>
                  <Button 
                    variant={type === 'amount' ? 'default' : 'outline'} 
                    onClick={() => setType('amount')}
                    className="flex-1 rounded-xl"
                  >
                    <DollarSign size={16} className="mr-2" /> {currencySymbol}
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Value</label>
                <Input 
                  type="number"
                  value={value} 
                  onChange={(e) => setValue(e.target.value)} 
                  placeholder={type === 'percent' ? "10" : "5.00"} 
                  className="h-10 mt-1 rounded-xl bg-muted/50 border-transparent focus:bg-background font-bold text-lg"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-full px-6">Cancel</Button>
            <Button onClick={saveDiscount} className="rounded-full px-8 font-bold">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
