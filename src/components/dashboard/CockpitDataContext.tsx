'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CockpitContextValue {
  data: any | null;
  loading: boolean;
}

const CockpitDataContext = createContext<CockpitContextValue>({ data: null, loading: true });

export function CockpitDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/cockpit');
        if (res.ok) setData(await res.json());
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  return (
    <CockpitDataContext.Provider value={{ data, loading }}>
      {children}
    </CockpitDataContext.Provider>
  );
}

export function useCockpitData() {
  return useContext(CockpitDataContext);
}
