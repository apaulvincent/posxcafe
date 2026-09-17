import React, { useState, useRef } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useSettings, type AppSettings } from '../../hooks/useSettings';
import { useCurrency } from '../../contexts/CurrencyContext';
import { supabase } from '../../lib/supabase';

const CURRENCIES = [
  { symbol: '₱', name: 'Philippine Peso (PHP)' },
  { symbol: '$', name: 'US Dollar (USD)' },
  { symbol: '€', name: 'Euro (EUR)' },
  { symbol: '£', name: 'British Pound (GBP)' },
  { symbol: '¥', name: 'Japanese Yen (JPY)' },
];
import { Loader2, Upload, X } from 'lucide-react';

export default function Settings() {
  const { settings, saveSettings } = useSettings();
  const { currencySymbol, setCurrencySymbol } = useCurrency();
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleColorChange = (key: keyof AppSettings['colors'], value: string) => {
    setFormData(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [key]: value
      }
    }));
  };

  const handleSave = () => {
    saveSettings(formData);
    alert('Settings saved successfully!');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `logo-${Date.now()}.${ext}`;
      const filePath = `settings/${fileName}`;

      const { error } = await supabase.storage.from('images').upload(filePath, file);
      
      if (error) {
        console.error("Upload error:", error);
        alert('Upload failed: ' + error.message);
      } else {
        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
        setFormData(prev => ({ ...prev, logoUrl: publicUrl }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, logoUrl: '' }));
  };

  return (
    <div className="flex-1 overflow-y-auto pr-4 pb-8 space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure global application appearance</p>
      </div>

      <Card className="rounded-3xl border-none shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">Brand Logo</h2>
        <div className="flex items-start gap-6">
          <div className="flex flex-col gap-2">
            {formData.logoUrl ? (
              <div className="relative w-48 h-32 border rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                <img src={formData.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                <button 
                  onClick={removeLogo}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="w-48 h-32 border-2 border-dashed rounded-xl flex items-center justify-center bg-muted/30 text-muted-foreground flex-col">
                <span className="text-sm font-semibold">No Logo</span>
              </div>
            )}
            
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload} 
            />
            
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isUploading}
              className="w-48"
            >
              {isUploading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Upload className="mr-2" size={16} />}
              Upload Logo
            </Button>
          </div>
          <div className="text-sm text-muted-foreground max-w-md">
            <p>Upload a logo to display in the header and login page.</p>
            <p className="mt-2">Recommended size: 200x80 pixels. PNG format with transparent background is best.</p>
          </div>
        </div>
      </Card>


      <Card className="rounded-3xl border-none shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">Theme Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <ColorPicker 
            label="Primary" 
            value={formData.colors.primary || '#000000'} 
            onChange={(val) => handleColorChange('primary', val)} 
          />
          <ColorPicker 
            label="Secondary" 
            value={formData.colors.secondary || '#000000'} 
            onChange={(val) => handleColorChange('secondary', val)} 
          />
          <ColorPicker 
            label="Tertiary" 
            value={formData.colors.tertiary || '#000000'} 
            onChange={(val) => handleColorChange('tertiary', val)} 
          />
          <ColorPicker 
            label="Error / Destructive" 
            value={formData.colors.error || '#000000'} 
            onChange={(val) => handleColorChange('error', val)} 
          />
          <ColorPicker 
            label="Warning" 
            value={formData.colors.warning || '#000000'} 
            onChange={(val) => handleColorChange('warning', val)} 
          />
          <ColorPicker 
            label="Info" 
            value={formData.colors.info || '#000000'} 
            onChange={(val) => handleColorChange('info', val)} 
          />

        </div>
      </Card>

      <Card className="rounded-3xl border-none shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">Currency</h2>
        <div className="space-y-4">
          <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Select Currency</label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CURRENCIES.map((c) => (
              <div 
                key={c.symbol}
                onClick={() => setCurrencySymbol(c.symbol)}
                className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer border-2 transition-all ${
                  currencySymbol === c.symbol 
                    ? 'border-primary bg-primary/10' 
                    : 'border-transparent bg-muted/50 hover:bg-muted'
                }`}
              >
                <div className={`w-12 h-12 flex items-center justify-center rounded-full text-xl font-bold ${
                  currencySymbol === c.symbol ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'
                }`}>
                  {c.symbol}
                </div>
                <span className="font-bold">{c.name}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-amber-500/10 text-amber-700 dark:text-amber-500 rounded-xl text-sm font-semibold border border-amber-500/20">
            Note: Changing this will instantly update the currency symbol across the POS, Dashboard, and printed receipts. It does not perform actual exchange rate conversion on past or current prices.
          </div>
        </div>
      </Card>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} className="rounded-full h-12 px-8 font-bold shadow-md">
          Save Settings
        </Button>
      </div>
    </div>
  );
}

function ColorPicker({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold">{label}</label>
      <div className="flex gap-3 items-center">
        <input 
          type="color" 
          value={value} 
          onChange={e => onChange(e.target.value)}
          className="w-12 h-12 rounded cursor-pointer border-0 p-0"
        />
        <Input 
          type="text" 
          value={value} 
          onChange={e => onChange(e.target.value)}
          className="w-28 font-mono uppercase"
        />
      </div>
    </div>
  );
}
