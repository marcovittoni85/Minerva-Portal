'use client';

import { useRouter } from 'next/navigation';
import FeeOverview from '@/components/fees/FeeOverview';

export default function FeesPage() {
  const router = useRouter();

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <FeeOverview
        onNavigateToDeal={(dealId) => router.push(`/portal/deal-manage/${dealId}`)}
      />
    </div>
  );
}
