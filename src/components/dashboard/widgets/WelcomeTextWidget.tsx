'use client';

import { WidgetConfig } from '@/types/dashboard-builder';

interface Props { config: WidgetConfig; }

export default function WelcomeTextWidget({ config }: Props) {
  const content = config.content || 'Benvenuto nel portale Minerva Partners.';

  return (
    <div className="bg-gradient-to-r from-[#001220] to-[#0a2540] rounded-2xl p-6 text-white">
      <h2 className="text-lg font-black">{config.title}</h2>
      <p className="text-sm text-slate-300 mt-1 leading-relaxed">{content}</p>
    </div>
  );
}
