import CalendarView from '@/components/calendar/CalendarView';
import { Suspense } from 'react';

export default function CalendarPage() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 pb-20">
      <Suspense fallback={<div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" /></div>}>
        <CalendarView />
      </Suspense>
    </div>
  );
}
