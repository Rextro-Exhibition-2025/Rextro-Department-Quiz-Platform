import React, { Suspense } from 'react';
import AdminLoginClient from './AdminLoginClient';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AdminLoginClient />
    </Suspense>
  );
}
