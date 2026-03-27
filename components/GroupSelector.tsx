'use client';

import { useMemo, useEffect } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { GROUP_COLORS, formatNumber } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Button } from './ui';

export function GroupSelector() {
  const { summary } = useDataStore();
  const {
    selectedGroups,
    buildGroups,
    toggleGroup,
    selectAllGroups,
    deselectAllGroups,
    syncSelectedGroups,
  } = useGroupStore();

  // 그룹 구성
  const { groups, groupStats } = useMemo(() => {
    const allItems = summary.map((r) => r.품목명);
    const grps = buildGroups(allItems);

    const stats = Object.entries(grps).map(([gn, items]) => {
      const rows = summary.filter((r) => items.includes(r.품목명));
      return {
        groupName: gn,
        items,
        currRevenue: rows.reduce((s, r) => s + r.매출1, 0),
        totalDiff: rows.reduce((s, r) => s + r.총차이, 0),
      };
    });

    // 매출 순 정렬 (미분류는 마지막)
    stats.sort((a, b) => {
      if (a.groupName === '미분류') return 1;
      if (b.groupName === '미분류') return -1;
      return b.currRevenue - a.currRevenue;
    });

    return { groups: grps, groupStats: stats };
  }, [summary, buildGroups]);

  // 새 그룹 자동 선택
  useEffect(() => {
    syncSelectedGroups(groups);
  }, [groups, syncSelectedGroups]);

  const groupNames = groupStats.map((s) => s.groupName);

  if (groupNames.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📦</span>
          <span className="text-sm font-semibold text-foreground">분석 대상 선택</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => selectAllGroups(groups)}>
            ✅ 전체 선택
          </Button>
          <Button variant="ghost" size="sm" onClick={deselectAllGroups}>
            ⬜ 전체 해제
          </Button>
        </div>
      </div>

      {/* 그룹 카드들 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {groupStats.map((stat, idx) => {
          const isActive = selectedGroups.has(stat.groupName);
          const color = GROUP_COLORS[idx % GROUP_COLORS.length];

          return (
            <button
              key={stat.groupName}
              onClick={() => toggleGroup(stat.groupName)}
              className={cn(
                'relative text-left rounded-xl p-4 transition-all border-2',
                'hover:scale-[1.02] active:scale-[0.98]',
                isActive
                  ? 'border-transparent shadow-lg'
                  : 'border-primary-500/20 bg-background-secondary hover:border-primary-500/40'
              )}
              style={{
                backgroundColor: isActive ? color.active : undefined,
              }}
            >
              {/* 체크 아이콘 */}
              <div
                className={cn(
                  'absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center',
                  isActive ? 'bg-white/20' : 'bg-primary-500/10'
                )}
              >
                {isActive ? (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className="w-3 h-3 rounded border-2 border-foreground-subtle" />
                )}
              </div>

              {/* 그룹 이름 */}
              <div className="flex items-center gap-2 mb-2">
                <span className={cn('text-base font-bold', isActive ? 'text-white' : 'text-foreground')}>
                  📦 {stat.groupName}
                </span>
                <span className={cn('text-xs', isActive ? 'text-white/70' : 'text-foreground-subtle')}>
                  ({stat.items.length}개 품목)
                </span>
              </div>

              {/* KPI */}
              <div className={cn('text-sm mb-3', isActive ? 'text-white/80' : 'text-foreground-muted')}>
                <div>실적 {formatNumber(stat.currRevenue)}원</div>
                <div
                  className={cn(
                    'font-semibold',
                    isActive
                      ? 'text-white'
                      : stat.totalDiff >= 0
                      ? 'text-success'
                      : 'text-danger'
                  )}
                >
                  {stat.totalDiff >= 0 ? '▲ +' : '▼ '}
                  {formatNumber(Math.abs(stat.totalDiff))}원
                </div>
              </div>

              {/* 품목 태그 */}
              <div className="flex flex-wrap gap-1">
                {stat.items.slice(0, 5).map((item) => (
                  <span
                    key={item}
                    className={cn(
                      'inline-block px-2 py-0.5 rounded text-xs',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-primary-500/10 text-foreground-muted'
                    )}
                  >
                    {item}
                  </span>
                ))}
                {stat.items.length > 5 && (
                  <span
                    className={cn(
                      'inline-block px-2 py-0.5 rounded text-xs',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-primary-500/10 text-foreground-muted'
                    )}
                  >
                    +{stat.items.length - 5}개
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
