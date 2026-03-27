'use client';

import { useMemo, useState } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { formatNumber } from '@/lib/constants';
import { Expander, Tabs } from './ui';
import type { SalesRow } from '@/lib/types';

export function RawDataViewer() {
  const { baseData, currData, period, summary } = useDataStore();
  const { selectedGroups, buildGroups } = useGroupStore();
  const [activeTab, setActiveTab] = useState<'base' | 'curr'>('base');

  // 선택된 품목으로 필터링
  const { filteredBase, filteredCurr } = useMemo(() => {
    const allItems = summary.map((r) => r.품목명);
    const groups = buildGroups(allItems);
    const selectedItems = Array.from(selectedGroups).flatMap((gn) => groups[gn] || []);

    if (selectedItems.length === 0) {
      return { filteredBase: baseData, filteredCurr: currData };
    }

    return {
      filteredBase: baseData.filter((r) => selectedItems.includes(r.품목명)),
      filteredCurr: currData.filter((r) => selectedItems.includes(r.품목명)),
    };
  }, [baseData, currData, summary, selectedGroups, buildGroups]);

  const data = activeTab === 'base' ? filteredBase : filteredCurr;
  const label = activeTab === 'base' ? period.baseLabel : period.currLabel;

  const tabs = [
    { id: 'base', label: `기준 (${period.baseLabel}) · ${filteredBase.length.toLocaleString()}건` },
    { id: 'curr', label: `실적 (${period.currLabel}) · ${filteredCurr.length.toLocaleString()}건` },
  ];

  const columns: Array<{ key: keyof SalesRow; label: string; align?: 'right' }> = [
    { key: '매출일', label: '매출일' },
    { key: '매출처명', label: '매출처명' },
    { key: '품목코드', label: '품목코드' },
    { key: '품목명', label: '품목명' },
    { key: '단위', label: '단위' },
    { key: '수량', label: '수량', align: 'right' },
    { key: '환종', label: '환종' },
    { key: '환율', label: '환율', align: 'right' },
    { key: '외화단가', label: '외화단가', align: 'right' },
    { key: '외화금액', label: '외화금액', align: 'right' },
    { key: '원화단가', label: '원화단가', align: 'right' },
    { key: '원화금액', label: '원화금액', align: 'right' },
    { key: '품목계정', label: '품목계정' },
  ];

  const formatValue = (row: SalesRow, key: keyof SalesRow) => {
    const value = row[key];
    if (key === '매출일' && value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    if (['수량', '환율', '외화단가', '외화금액', '원화단가', '원화금액'].includes(key)) {
      return formatNumber(value as number);
    }
    return String(value ?? '');
  };

  return (
    <Expander title="🗂️ 원본 데이터 확인 (선택 품목 기준)">
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as 'base' | 'curr')}
        className="mb-4"
      />

      {data.length === 0 ? (
        <div className="text-center py-8 text-foreground-muted">
          선택된 품목의 {activeTab === 'base' ? '기준' : '실적'} 기간 데이터가 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[300px] overflow-y-auto rounded-lg border border-primary-500/20">
          <table className="w-full text-xs">
            <thead className="bg-primary-500/5 sticky top-0">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-2 py-2 font-medium text-foreground-muted whitespace-nowrap ${
                      col.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 500).map((row, i) => (
                <tr key={i} className="border-t border-primary-500/10 hover:bg-primary-500/5">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-2 py-1.5 whitespace-nowrap ${
                        col.align === 'right' ? 'text-right font-mono' : ''
                      }`}
                    >
                      {formatValue(row, col.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 500 && (
            <div className="text-center py-2 text-foreground-subtle text-xs">
              ... 외 {(data.length - 500).toLocaleString()}건 (최대 500건만 표시)
            </div>
          )}
        </div>
      )}
    </Expander>
  );
}
