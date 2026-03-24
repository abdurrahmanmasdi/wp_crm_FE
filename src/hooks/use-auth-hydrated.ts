'use client';

import { useEffect, useState } from 'react';

import { useAuthStore } from '@/store/useAuthStore';

export function useAuthHydrated() {
  const [hasHydrated, setHasHydrated] = useState(
    useAuthStore.persist.hasHydrated()
  );

  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    return unsubscribe;
  }, []);

  return hasHydrated;
}
