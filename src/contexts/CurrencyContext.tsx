import React, { createContext, useContext, useEffect, useState } from 'react';

type CurrencyContextType = {
  currencySymbol: string;
  setCurrencySymbol: (symbol: string) => void;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currencySymbol, setCurrencySymbolState] = useState<string>('₱');

  useEffect(() => {
    const saved = localStorage.getItem('currencySymbol');
    if (saved) {
      setCurrencySymbolState(saved);
    }
  }, []);

  const setCurrencySymbol = (symbol: string) => {
    setCurrencySymbolState(symbol);
    localStorage.setItem('currencySymbol', symbol);
  };

  return (
    <CurrencyContext.Provider value={{ currencySymbol, setCurrencySymbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
