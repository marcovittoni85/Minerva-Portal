import CalendarView from '@/components/calendar/CalendarView';
import { Suspense } from 'react';
import { Loader } from '@/components/ui/Loader';

export default function CalendarPage() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 pb-20">
      <Suspense fallback={<div className="flex justify-center py-20"><Loader size="lg" /></div>}>
        <CalendarView />
      </Suspense>
    </div>
  );
}
