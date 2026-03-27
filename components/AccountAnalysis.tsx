'use client';

import { useMemo, useState } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { ACCOUNT_COLORS, formatNumber } from '@/lib/constants';
import { Tabs } from './ui';
import { cn } from '@/lib/utils';
import type { AccountType, VarianceSummaryRow } from '@/lib/types';

export function AccountAnalysis() {
  const { summary, detail, period, showDetail } = useDataStore();
  const { selectedGroups, buildGroups, itemMapping } = useGroupStore();
  const [activeTab, setActiveTab] = useState<'전체' | AccountType>('전체');

  // 품목명 → 품목계정_분류 매핑 (rawData에서 추출)
  const { rawData } = useDataStore();
  const accountMap = useMemo(() => {
    const map: Record<string, AccountType> = {};
    for (const row of rawData) {
      if (!map[row.품목명]) {
        map[row.품목명] = row.품목계정_분류;
      }
    }
    return map;
  }, [rawData]);

  // 선택된 품목 필터링
  const selectedItems = useMemo(() => {
    const allItems = summary.map((r) => r.품목명);
    const groups = buildGroups(allItems);
    return Array.from(selectedGroups).flatMap((gn) => groups[gn] || []);
  }, [summary, selectedGroups, buildGroups]);

  // 품목계정별 통계
  const accountStats = useMemo(() => {
    const categories: AccountType[] = ['제품', '상품', '기타'];
    return categories.map((cat) => {
      const items = selectedItems.filter((item) => accountMap[item] === cat);
      const rows = summary.filter((r) => items.includes(r.품목명));
      return {
        accountType: cat,
        itemCount: items.length,
        baseRevenue: rows.reduce((s, r) => s + r.매출0, 0),
        currRevenue: rows.reduce((s, r) => s + r.매출1, 0),
        totalDiff: rows.reduce((s, r) => s + r.총차이, 0),
        qtyVariance: rows.reduce((s, r) => s + r.수량차이, 0),
        priceVariance: rows.reduce((s, r) => s + r.단가차이, 0),
        fxVariance: rows.reduce((s, r) => s + r.환율차이, 0),
      };
    });
  }, [selectedItems, accountMap, summary]);

  // 탭별 데이터
  const tabData = useMemo(() => {
    let items: string[];
    if (activeTab === '전체') {
      items = selectedItems;
    } else {
      items = selectedItems.filter((item) => accountMap[item] === activeTab);
    }

    const data = showDetail
      ? detail.filter((r) => items.includes(r.품목명))
      : summary.filter((r) => items.includes(r.품목명));

    return data.sort((a, b) => a.총차이 - b.총차이);
  }, [activeTab, selectedItems, accountMap, summary, detail, showDetail]);

  const totals = useMemo(() => ({
    매출0: tabData.reduce((s, r) => s + r.매출0, 0),
    매출1: tabData.reduce((s, r) => s + r.매출1, 0),
    총차이: tabData.reduce((s, r) => s + r.총차이, 0),
    수량차이: tabData.reduce((s, r) => s + r.수량차이, 0),
    단가차이: tabData.reduce((s, r) => s + r.단가차이, 0),
    환율차이: tabData.reduce((s, r) => s + r.환율차이, 0),
  }), [tabData]);

  const tabs = [
    { id: '전체', label: '전체' },
    ...accountStats.map((s) => ({
      id: s.accountType,
      label: `${s.accountType} (${s.itemCount})`,
    })),
  ];

  return (
    <div className="space-y-4">
      {/* KPI 카드들 */}
      <div className="grid grid-cols-3 gap-3">
        {accountStats.map((stat) => (
          <div
            key={stat.accountType}
            className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]"
            style={{ borderTopWidth: 2, borderTopColor: ACCOUNT_COLORS[stat.accountType] }}
          >
            <div
              className="text-sm font-bold mb-3"
              style={{ color: ACCOUNT_COLORS[stat.accountType] }}
            >
              {stat.accountType}
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-foreground-subtle uppercase tracking-wider">기준 매출</span>
                <div className="text-foreground font-medium">{formatNumber(stat.baseRevenue)}원</div>
              </div>
              <div>
                <span className="text-foreground-subtle uppercase tracking-wider">실적 매출</span>
                <div className="text-foreground font-medium">{formatNumber(stat.currRevenue)}원</div>
              </div>
              <div>
                <span className="text-foreground-subtle uppercase tracking-wider">총 차이</span>
                <div
                  className="text-lg font-bold"
                  style={{ color: stat.totalDiff >= 0 ? '#16a34a' : '#dc2626' }}
                >
                  {stat.totalDiff >= 0 ? '▲ +' : '▼ '}
                  {formatNumber(Math.abs(stat.totalDiff))}원
                </div>
              </div>
              <div className="text-foreground-subtle pt-1">
                ① {stat.qtyVariance >= 0 ? '+' : ''}{formatNumber(stat.qtyVariance)}{' '}
                ② {stat.priceVariance >= 0 ? '+' : ''}{formatNumber(stat.priceVariance)}{' '}
                ③ {stat.fxVariance >= 0 ? '+' : ''}{formatNumber(stat.fxVariance)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 탭 */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as typeof activeTab)}
      />

      {/* 테이블 */}
      {tabData.length === 0 ? (
        <div className="text-center py-8 text-foreground-muted">
          {activeTab} 분류의 데이터가 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-primary-500/20">
          <table className="w-full text-sm">
            <thead className="bg-primary-500/5">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-foreground-muted">품목명</th>
                {showDetail && (
                  <th className="px-3 py-2 text-left font-medium text-foreground-muted">환종</th>
                )}
                <th className="px-3 py-2 text-right font-medium text-foreground-muted">
                  기준매출 [{period.baseLabel}]
                </th>
                <th className="px-3 py-2 text-right font-medium text-foreground-muted">
                  실적매출 [{period.currLabel}]
                </th>
                <th className="px-3 py-2 text-right font-medium text-foreground-muted">총차이</th>
                <th className="px-3 py-2 text-right font-medium text-foreground-muted">①수량차이</th>
                <th className="px-3 py-2 text-right font-medium text-foreground-muted">②단가차이</th>
                <th className="px-3 py-2 text-right font-medium text-foreground-muted">③환율차이</th>
              </tr>
            </thead>
            <tbody>
              {tabData.map((row, i) => (
                <tr key={i} className="border-t border-primary-500/10 hover:bg-primary-500/5">
                  <td className="px-3 py-2 text-foreground">
                    {row.Q0 === 0 && <span className="text-info mr-1">🆕</span>}
                    {row.품목명}
                  </td>
                  {showDetail && (
                    <td className="px-3 py-2 text-foreground-muted">
                      {(row as { 환종?: string }).환종 || ''}
                    </td>
                  )}
                  <td className="px-3 py-2 text-right font-mono">{formatNumber(row.매출0)}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatNumber(row.매출1)}</td>
                  <td className={cn('px-3 py-2 text-right font-mono font-semibold', row.총차이 >= 0 ? 'text-success' : 'text-danger')}>
                    {formatNumber(row.총차이)}
                  </td>
                  <td className={cn('px-3 py-2 text-right font-mono', row.수량차이 >= 0 ? 'text-success' : 'text-danger')}>
                    {formatNumber(row.수량차이)}
                  </td>
                  <td className={cn('px-3 py-2 text-right font-mono', row.단가차이 >= 0 ? 'text-success' : 'text-danger')}>
                    {formatNumber(row.단가차이)}
                  </td>
                  <td className={cn('px-3 py-2 text-right font-mono', row.환율차이 >= 0 ? 'text-success' : 'text-danger')}>
                    {formatNumber(row.환율차이)}
                  </td>
                </tr>
              ))}
              {/* 합계 행 */}
              <tr className="border-t-2 border-primary-500/30 bg-primary-500/10 font-bold">
                <td className="px-3 py-2" colSpan={showDetail ? 2 : 1}>【 합 계 】</td>
                <td className="px-3 py-2 text-right font-mono">{formatNumber(totals.매출0)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatNumber(totals.매출1)}</td>
                <td className={cn('px-3 py-2 text-right font-mono', totals.총차이 >= 0 ? 'text-success' : 'text-danger')}>
                  {formatNumber(totals.총차이)}
                </td>
                <td className={cn('px-3 py-2 text-right font-mono', totals.수량차이 >= 0 ? 'text-success' : 'text-danger')}>
                  {formatNumber(totals.수량차이)}
                </td>
                <td className={cn('px-3 py-2 text-right font-mono', totals.단가차이 >= 0 ? 'text-success' : 'text-danger')}>
                  {formatNumber(totals.단가차이)}
                </td>
                <td className={cn('px-3 py-2 text-right font-mono', totals.환율차이 >= 0 ? 'text-success' : 'text-danger')}>
                  {formatNumber(totals.환율차이)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
