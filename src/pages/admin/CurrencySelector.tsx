import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrency } from '@/contexts/CurrencyContext';

const CURRENCIES = [
  { symbol: '₱', name: 'Philippine Peso (PHP)' },
  { symbol: '$', name: 'US Dollar (USD)' },
  { symbol: '€', name: 'Euro (EUR)' },
  { symbol: '£', name: 'British Pound (GBP)' },
  { symbol: '¥', name: 'Japanese Yen (JPY)' },
];

export default function CurrencySelector() {
  const { currencySymbol, setCurrencySymbol } = useCurrency();

  return (
    <div className="flex-1 flex flex-col gap-6 h-full p-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Currency Selector</h1>
          <p className="text-muted-foreground font-medium mt-1">Set the global currency symbol for the application.</p>
        </div>
      </div>

      <div className="flex-1 flex justify-start items-start mt-4">
        <Card className="w-full max-w-xl rounded-3xl shadow-sm border-none bg-card">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-xl">Global Settings</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Currency</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
            <div className="mt-8 p-4 bg-amber-500/10 text-amber-700 dark:text-amber-500 rounded-xl text-sm font-semibold border border-amber-500/20">
              Note: Changing this will instantly update the currency symbol across the POS, Dashboard, and printed receipts. It does not perform actual exchange rate conversion on past or current prices.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
