'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const _router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    _router.push('/dashboard');
  }, [_router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">DevReporter</h1>
        <p className="text-gray-600 mt-2">Przekierowywanie do panelu...</p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}
