import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Grid, Plus, Edit2, Trash2, Power, Users } from 'lucide-react';
import { useTables } from '@/hooks/useTables';
import { db, type LocalTable } from '@/lib/db';

export default function Tables() {
  const { tables, loading } = useTables();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('4');

  const openModal = (table?: LocalTable) => {
    if (table) {
      setEditingId(table.id);
      setName(table.name);
      setCapacity(table.capacity?.toString() || '4');
    } else {
      setEditingId(null);
      setName('');
      setCapacity('4');
    }
    setIsModalOpen(true);
  };

  const saveTable = async () => {
    if (!name.trim() || !capacity) return;
    
    const numCapacity = parseInt(capacity, 10);
    if (isNaN(numCapacity) || numCapacity <= 0) return;

    try {
      if (editingId) {
        await db.diningTables.update(editingId, {
          name,
          capacity: numCapacity,
          sync_status: 'pending'
        });
      } else {
        await db.diningTables.add({
          id: crypto.randomUUID(),
          name,
          capacity: numCapacity,
          is_active: true,
          sync_status: 'pending'
        });
      }
      setIsModalOpen(false);
    } catch (e) {
      console.error('Failed to save table', e);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await db.diningTables.update(id, { is_active: !currentStatus, sync_status: 'pending' });
    } catch (e) {
      console.error('Failed to toggle table', e);
    }
  };

  const deleteTable = async (id: string) => {
    if (confirm('Are you sure you want to delete this table?')) {
      try {
        await db.diningTables.delete(id);
      } catch (e) {
        console.error('Failed to delete table', e);
      }
    }
  };

  // Sort tables naturally (e.g. Table 1, Table 2 ... Table 10)
  const sortedTables = [...tables].sort((a, b) => {
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });

  return (
    <div className="flex-1 flex flex-col gap-6 h-full p-6 animate-in fade-in duration-300 overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Tables</h1>
          <p className="text-muted-foreground font-medium mt-1">Manage restaurant layout and seating capacity.</p>
        </div>
        <Button onClick={() => openModal()} className="rounded-full font-bold h-12 px-6 gap-2">
          <Plus size={20} /> Add Table
        </Button>
      </div>

      <Card className="rounded-3xl border-none shadow-sm flex flex-col p-6 min-h-[400px]">
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="text-xs font-bold text-muted-foreground border-b border-border">
                <th className="pb-3 px-4">Name</th>
                <th className="pb-3 px-4">Capacity</th>
                <th className="pb-3 px-4 text-center">Status</th>
                <th className="pb-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTables.map(table => (
                <tr key={table.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
                  <td className="py-4 px-4 font-bold">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${table.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        <Grid size={16} />
                      </div>
                      {table.name}
                    </div>
                  </td>
                  <td className="py-4 px-4 font-bold text-lg text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users size={16} /> {table.capacity || 4}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Button 
                      variant="ghost" 
                      onClick={() => toggleStatus(table.id, table.is_active)}
                      className={`h-8 px-3 rounded-full text-xs font-bold ${table.is_active ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                    >
                      <Power size={14} className="mr-1" />
                      {table.is_active ? 'Active' : 'Inactive'}
                    </Button>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" className="w-9 h-9 rounded-full" onClick={() => openModal(table)}>
                        <Edit2 size={14} />
                      </Button>
                      <Button variant="outline" size="icon" className="w-9 h-9 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20" onClick={() => deleteTable(table.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {tables.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-sm font-bold text-muted-foreground">
                    No tables created yet.
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
            <DialogTitle>{editingId ? 'Edit Table' : 'Create Table'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Table Name</label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. Patio 1, Bar A, Table 12" 
                className="h-12 rounded-xl bg-muted/50 border-transparent focus:bg-background"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Seating Capacity</label>
              <div className="flex items-center gap-3">
                <Users size={20} className="text-muted-foreground" />
                <Input 
                  type="number"
                  value={capacity} 
                  onChange={(e) => setCapacity(e.target.value)} 
                  placeholder="4" 
                  className="h-12 flex-1 rounded-xl bg-muted/50 border-transparent focus:bg-background font-bold"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-full px-6">Cancel</Button>
            <Button onClick={saveTable} className="rounded-full px-8 font-bold">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
