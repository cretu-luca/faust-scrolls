'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const OfflineStatus = dynamic(() => import('./OfflineStatus'), { 
  ssr: false,
  loading: () => null 
});

export default function OfflineStatusWrapper() {
  return (
    <Suspense fallback={null}>
      <OfflineStatus />
    </Suspense>
  );
} 