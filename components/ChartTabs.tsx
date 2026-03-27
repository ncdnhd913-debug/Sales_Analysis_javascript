'use client';

import { useState } from 'react';
import { Tabs, SectionHeader } from './ui';
import { WaterfallChart } from './WaterfallChart';
import { ItemBarChart } from './ItemBarChart';

export function ChartTabs() {
  const [activeTab, setActiveTab] = useState<'waterfall' | 'bar'>('waterfall');

  const tabs = [
    { id: 'waterfall', label: '🌊 Waterfall (전체 합산)' },
    { id: 'bar', label: '📊 품목별 총차이' },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader icon="📊">차이 구성 요소 시각화</SectionHeader>
      
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as 'waterfall' | 'bar')}
      />

      <div className="mt-4">
        {activeTab === 'waterfall' ? <WaterfallChart /> : <ItemBarChart />}
      </div>
    </div>
  );
}
