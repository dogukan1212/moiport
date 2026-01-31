
import { Suspense } from 'react';
import CustomerDetailClient from './page.client';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Yükleniyor...</div>}>
      <CustomerDetailClient />
    </Suspense>
  );
}
