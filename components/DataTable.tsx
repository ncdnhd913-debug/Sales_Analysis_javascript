'use client';

import { useMemo, useState } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { exportToExcel } from '@/lib/excel-parser';
import { formatNumber } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Button, Select } from './ui';
import type { VarianceSummaryRow, VarianceDetailRow } from '@/lib/types';

type SortableColumn = '매출0' | '매출1' | '총차이' | '수량차이' | '단가차이' | '환율차이';

interface SortConfig {
  column: SortableColumn | null;
  direction: 'asc' | 'desc';
}

// 타입 안전한 값 접근 함수
function getNumericValue(row: VarianceSummaryRow | VarianceDetailRow, col: SortableColumn): number {
  switch (col) {
    case '매출0': return row.매출0;
    case '매출1': return row.매출1;
    case '총차이': return row.총차이;
    case '수량차이': return row.수량차이;
    case '단가차이': return row.단가차이;
    case '환율차이': return row.환율차이;
    default: return 0;
  }
}

export function DataTable() {
  const { summary, detail, period, showDetail, model } = useDataStore();
  const { selectedGroups, buildGroups } = useGroupStore();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: '총차이', direction: 'asc' });
  const [drilldownGroup, setDrilldownGroup] = useState<string>('전체 합산');

  // 선택된 품목 필터링
  const { filteredData, groups, groupStats } = useMemo(() => {
    const allItems = summary.map((r) => r.품목명);
    const grps = buildGroups(allItems);
    const selectedItems = Array.from(selectedGroups).flatMap((gn) => grps[gn] || []);

    const data = showDetail
      ? detail.filter((r) => selectedItems.length === 0 || selectedItems.includes(r.품목명))
      : summary.filter((r) => selectedItems.length === 0 || selectedItems.includes(r.품목명));

    // 그룹별 통계
    const stats = Array.from(selectedGroups).map((gn) => {
      const items = grps[gn] || [];
      const rows = summary.filter((r) => items.includes(r.품목명));
      return {
        groupName: gn,
        itemCount: items.length,
        items,
        baseRevenue: rows.reduce((s, r) => s + r.매출0, 0),
        currRevenue: rows.reduce((s, r) => s + r.매출1, 0),
        totalDiff: rows.reduce((s, r) => s + r.총차이, 0),
        qtyVariance: rows.reduce((s, r) => s + r.수량차이, 0),
        priceVariance: rows.reduce((s, r) => s + r.단가차이, 0),
        fxVariance: rows.reduce((s, r) => s + r.환율차이, 0),
      };
    });

    return { filteredData: data, groups: grps, groupStats: stats };
  }, [summary, detail, selectedGroups, buildGroups, showDetail]);

  // 드릴다운 필터링
  const displayData = useMemo(() => {
    if (drilldownGroup === '전체 합산') return filteredData;
    const items = groups[drilldownGroup] || [];
    return filteredData.filter((r) => items.includes(r.품목명));
  }, [filteredData, drilldownGroup, groups]);

  // 정렬
  const sortedData = useMemo(() => {
    if (!sortConfig.column) return displayData;
    return [...displayData].sort((a, b) => {
      const aVal = getNumericValue(a, sortConfig.column!);
      const bVal = getNumericValue(b, sortConfig.column!);
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [displayData, sortConfig]);

  // 합계 행
  const totals = useMemo(() => ({
    매출0: sortedData.reduce((s, r) => s + r.매출0, 0),
    매출1: sortedData.reduce((s, r) => s + r.매출1, 0),
    총차이: sortedData.reduce((s, r) => s + r.총차이, 0),
    수량차이: sortedData.reduce((s, r) => s + r.수량차이, 0),
    단가차이: sortedData.reduce((s, r) => s + r.단가차이, 0),
    환율차이: sortedData.reduce((s, r) => s + r.환율차이, 0),
  }), [sortedData]);

  const handleSort = (column: SortableColumn) => {
    setSortConfig((prev) => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleExport = () => {
    const exportData = sortedData.map((r) => ({
      품목명: r.품목명,
      [`기준매출(원) [${period.baseLabel}]`]: r.매출0,
      [`실적매출(원) [${period.currLabel}]`]: r.매출1,
      '총차이(원)': r.총차이,
      '①수량차이(원)': r.수량차이,
      '②단가차이(원)': r.단가차이,
      '③환율차이(원)': r.환율차이,
    }));
    exportToExcel(
      exportData,
      `매출차이분석_모델${model}_${period.baseLabel}vs${period.currLabel}.xlsx`,
      '차이분석'
    );
  };

  const numCols: SortableColumn[] = ['매출0', '매출1', '총차이', '수량차이', '단가차이', '환율차이'];
  const columnLabels: Record<string, string> = {
    품목명: '품목명',
    환종: '환종',
    매출0: `기준매출 [${period.baseLabel}]`,
    매출1: `실적매출 [${period.currLabel}]`,
    총차이: '총차이',
    수량차이: '①수량차이',
    단가차이: '②단가차이',
    환율차이: '③환율차이',
  };

  const dropdownOptions = [
    { value: '전체 합산', label: '전체 합산' },
    ...Array.from(selectedGroups).map((gn) => ({
      value: gn,
      label: `📦 ${gn} (${groups[gn]?.length || 0}개)`,
    })),
  ];

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select
            value={drilldownGroup}
            onChange={(e) => setDrilldownGroup(e.target.value)}
            options={dropdownOptions}
            className="w-48"
          />
          <span className="text-sm text-foreground-muted">
            {sortedData.length}개 항목
          </span>
        </div>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          📥 엑셀 다운로드
        </Button>
      </div>

      {/* 그룹별 요약 (커스텀 그룹 있을 때만) */}
      {groupStats.length > 0 && drilldownGroup === '전체 합산' && (
        <GroupSummaryTable
          stats={groupStats}
          period={period}
        />
      )}

      {/* 메인 테이블 */}
      <div className="overflow-x-auto rounded-lg border border-primary-500/20">
        <table className="w-full text-sm">
          <thead className="bg-primary-500/5">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-foreground-muted">
                품목명
              </th>
              {showDetail && (
                <th className="px-3 py-2 text-left font-medium text-foreground-muted">
                  환종
                </th>
              )}
              {numCols.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="px-3 py-2 text-right font-medium text-foreground-muted cursor-pointer hover:text-primary-300"
                >
                  {columnLabels[col]}
                  {sortConfig.column === col && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, i) => {
              const isNew = row.Q0 === 0;
              return (
                <tr key={i} className="border-t border-primary-500/10 hover:bg-primary-500/5">
                  <td className="px-3 py-2">
                    {isNew && <span className="text-info mr-1">🆕</span>}
                    {row.품목명}
                  </td>
                  {showDetail && (
                    <td className="px-3 py-2 text-foreground-muted">
                      {'환종' in row ? row.환종 : ''}
                    </td>
                  )}
                  {numCols.map((col) => {
                    const numVal = getNumericValue(row, col);
                    return (
                      <td
                        key={col}
                        className={cn(
                          'px-3 py-2 text-right font-mono',
                          numVal > 0 && 'text-success',
                          numVal < 0 && 'text-danger'
                        )}
                      >
                        {formatNumber(numVal)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {/* 합계 행 */}
            <tr className="border-t-2 border-primary-500/30 bg-primary-500/10 font-bold">
              <td className="px-3 py-2" colSpan={showDetail ? 2 : 1}>【 합 계 】</td>
              {numCols.map((col) => (
                <td
                  key={col}
                  className={cn(
                    'px-3 py-2 text-right font-mono',
                    totals[col] > 0 && 'text-success',
                    totals[col] < 0 && 'text-danger'
                  )}
                >
                  {formatNumber(totals[col])}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 그룹별 요약 테이블
function GroupSummaryTable({
  stats,
  period,
}: {
  stats: Array<{
    groupName: string;
    itemCount: number;
    baseRevenue: number;
    currRevenue: number;
    totalDiff: number;
    qtyVariance: number;
    priceVariance: number;
    fxVariance: number;
  }>;
  period: { baseLabel: string; currLabel: string };
}) {
  const totals = {
    baseRevenue: stats.reduce((s, r) => s + r.baseRevenue, 0),
    currRevenue: stats.reduce((s, r) => s + r.currRevenue, 0),
    totalDiff: stats.reduce((s, r) => s + r.totalDiff, 0),
    qtyVariance: stats.reduce((s, r) => s + r.qtyVariance, 0),
    priceVariance: stats.reduce((s, r) => s + r.priceVariance, 0),
    fxVariance: stats.reduce((s, r) => s + r.fxVariance, 0),
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-primary-500/20 mb-4">
      <table className="w-full text-sm">
        <thead className="bg-primary-500/5">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-foreground-muted">그룹</th>
            <th className="px-3 py-2 text-right font-medium text-foreground-muted">기준매출 [{period.baseLabel}]</th>
            <th className="px-3 py-2 text-right font-medium text-foreground-muted">실적매출 [{period.currLabel}]</th>
            <th className="px-3 py-2 text-right font-medium text-foreground-muted">총차이</th>
            <th className="px-3 py-2 text-right font-medium text-foreground-muted">①수량차이</th>
            <th className="px-3 py-2 text-right font-medium text-foreground-muted">②단가차이</th>
            <th className="px-3 py-2 text-right font-medium text-foreground-muted">③환율차이</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((row) => (
            <tr key={row.groupName} className="border-t border-primary-500/10 hover:bg-primary-500/5">
              <td className="px-3 py-2">📦 {row.groupName} ({row.itemCount}개 품목)</td>
              <td className="px-3 py-2 text-right font-mono">{formatNumber(row.baseRevenue)}</td>
              <td className="px-3 py-2 text-right font-mono">{formatNumber(row.currRevenue)}</td>
              <td className={cn('px-3 py-2 text-right font-mono font-semibold', row.totalDiff >= 0 ? 'text-success' : 'text-danger')}>
                {formatNumber(row.totalDiff)}
              </td>
              <td className={cn('px-3 py-2 text-right font-mono', row.qtyVariance >= 0 ? 'text-success' : 'text-danger')}>
                {formatNumber(row.qtyVariance)}
              </td>
              <td className={cn('px-3 py-2 text-right font-mono', row.priceVariance >= 0 ? 'text-success' : 'text-danger')}>
                {formatNumber(row.priceVariance)}
              </td>
              <td className={cn('px-3 py-2 text-right font-mono', row.fxVariance >= 0 ? 'text-success' : 'text-danger')}>
                {formatNumber(row.fxVariance)}
              </td>
            </tr>
          ))}
          {/* 합계 행 */}
          <tr className="border-t-2 border-primary-500/30 bg-primary-500/10 font-bold">
            <td className="px-3 py-2">【 합 계 】</td>
            <td className="px-3 py-2 text-right font-mono">{formatNumber(totals.baseRevenue)}</td>
            <td className="px-3 py-2 text-right font-mono">{formatNumber(totals.currRevenue)}</td>
            <td className={cn('px-3 py-2 text-right font-mono', totals.totalDiff >= 0 ? 'text-success' : 'text-danger')}>
              {formatNumber(totals.totalDiff)}
            </td>
            <td className={cn('px-3 py-2 text-right font-mono', totals.qtyVariance >= 0 ? 'text-success' : 'text-danger')}>
              {formatNumber(totals.qtyVariance)}
            </td>
            <td className={cn('px-3 py-2 text-right font-mono', totals.priceVariance >= 0 ? 'text-success' : 'text-danger')}>
              {formatNumber(totals.priceVariance)}
            </td>
            <td className={cn('px-3 py-2 text-right font-mono', totals.fxVariance >= 0 ? 'text-success' : 'text-danger')}>
              {formatNumber(totals.fxVariance)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
