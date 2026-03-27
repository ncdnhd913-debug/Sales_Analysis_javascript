'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useDataStore } from '@/stores/useDataStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { formatNumber } from '@/lib/constants';

export function ItemBarChart() {
  const { summary } = useDataStore();
  const { selectedGroups, buildGroups } = useGroupStore();

  const chartData = useMemo(() => {
    const allItems = summary.map((r) => r.품목명);
    const groups = buildGroups(allItems);
    const selectedItems = Array.from(selectedGroups).flatMap((gn) => groups[gn] || []);

    const filtered = selectedItems.length > 0
      ? summary.filter((r) => selectedItems.includes(r.품목명))
      : summary;

    return filtered
      .map((r) => ({
        name: r.품목명,
        value: r.총차이,
      }))
      .sort((a, b) => a.value - b.value);
  }, [summary, selectedGroups, buildGroups]);

  const getColor = (value: number) => (value >= 0 ? '#27ae60' : '#e74c3c');
  const getBorderColor = (value: number) => (value >= 0 ? '#1e8449' : '#b03a2e');
  const formatLabel = (value: number) => {
    if (value >= 0) return `▲ +${formatNumber(value)}`;
    return `▼ ${formatNumber(value)}`;
  };

  const chartHeight = Math.max(380, chartData.length * 40);

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-4">품목별 총 매출 차이</h3>
      
      <div style={{ height: chartHeight }} className="bg-white rounded-xl p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 140, left: 10, bottom: 10 }}
          >
            <XAxis
              type="number"
              tick={{ fill: '#0d1f3c', fontSize: 12 }}
              axisLine={{ stroke: '#e8ecf3' }}
              tickLine={{ stroke: '#e8ecf3' }}
              tickFormatter={(v) => formatNumber(v)}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#0d1f3c', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={120}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e8ecf3',
                borderRadius: '8px',
                color: '#0d1f3c',
              }}
              formatter={(value: number) => [formatNumber(value) + '원', '총차이']}
            />
            <ReferenceLine x={0} stroke="#5a6a85" strokeWidth={2} />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              label={{
                position: 'right',
                fill: '#0d1f3c',
                fontSize: 12,
                formatter: formatLabel,
              }}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={getColor(entry.value)}
                  stroke={getBorderColor(entry.value)}
                  strokeWidth={1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
