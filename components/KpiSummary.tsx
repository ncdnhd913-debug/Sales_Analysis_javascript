'use client';

import { useMemo } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { calculateKpis } from '@/lib/models';
import { formatNumber, formatBillion, formatPercent } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function KpiSummary() {
  const { summary, period, model } = useDataStore();
  const { selectedGroups, buildGroups } = useGroupStore();

  // 선택된 그룹의 품목만 필터링
  const kpis = useMemo(() => {
    const allItems = summary.map((r) => r.품목명);
    const groups = buildGroups(allItems);
    const selectedItems = Array.from(selectedGroups).flatMap((gn) => groups[gn] || []);
    
    if (selectedItems.length === 0) {
      return calculateKpis(summary);
    }
    return calculateKpis(summary, selectedItems);
  }, [summary, selectedGroups, buildGroups]);

  const isModelA = model === 'A';
  const diffColor = kpis.totalDiff >= 0 ? '#34d399' : '#f87171';
  const diffBg = kpis.totalDiff >= 0 ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)';
  const diffBorder = kpis.totalDiff >= 0 ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)';

  return (
    <div className="space-y-4">
      {/* 상단: 기준/실적/총차이 3열 */}
      <div className="grid grid-cols-3 gap-3">
        {/* 기준 매출 */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] border-t-2 border-t-primary-500">
          <div className="text-[10px] font-semibold text-foreground-subtle uppercase tracking-wider mb-1">
            기준 매출
          </div>
          <div className="text-xs text-foreground-subtle mb-2">{period.baseLabel}</div>
          <div className="text-2xl font-bold text-foreground">
            {formatBillion(kpis.totalBase)}
            <span className="text-sm font-normal text-foreground-muted ml-1">억원</span>
          </div>
          <div className="text-xs text-foreground-subtle mt-1">
            {formatNumber(kpis.totalBase)}원
          </div>
        </div>

        {/* 실적 매출 */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] border-t-2 border-t-info">
          <div className="text-[10px] font-semibold text-foreground-subtle uppercase tracking-wider mb-1">
            실적 매출
          </div>
          <div className="text-xs text-foreground-subtle mb-2">{period.currLabel}</div>
          <div className="text-2xl font-bold text-foreground">
            {formatBillion(kpis.totalCurr)}
            <span className="text-sm font-normal text-foreground-muted ml-1">억원</span>
          </div>
          <div className="text-xs text-foreground-subtle mt-1">
            {formatNumber(kpis.totalCurr)}원
          </div>
        </div>

        {/* 총 차이 */}
        <div
          className="p-4 rounded-xl border-t-2"
          style={{
            backgroundColor: diffBg,
            borderColor: diffBorder,
            borderTopColor: diffColor,
          }}
        >
          <div className="text-[10px] font-semibold text-foreground-subtle uppercase tracking-wider mb-1">
            총 차이 (①+②+③)
          </div>
          <div className="text-xs text-foreground-subtle mb-2">실적 - 기준</div>
          <div className="text-2xl font-bold" style={{ color: diffColor }}>
            {kpis.totalDiff >= 0 ? '+' : ''}{formatBillion(kpis.totalDiff)}
            <span className="text-sm font-normal ml-1">억원</span>
          </div>
          <div className="text-xs mt-1" style={{ color: diffColor, opacity: 0.8 }}>
            {kpis.totalDiff >= 0 ? '+' : ''}{formatNumber(kpis.totalDiff)}원 ({formatPercent(kpis.growthPct)})
          </div>
        </div>
      </div>

      {/* 요인 분해 바 */}
      <FactorBars kpis={kpis} isModelA={isModelA} />
    </div>
  );
}

// 요인 분해 바 컴포넌트
function FactorBars({ kpis, isModelA }: { kpis: ReturnType<typeof calculateKpis>; isModelA: boolean }) {
  const maxAbs = Math.max(Math.abs(kpis.qtyVariance), Math.abs(kpis.priceVariance), Math.abs(kpis.fxVariance), 1);

  const factors = [
    {
      num: '①',
      label: '수량 차이',
      formula: isModelA ? '(Q1-Q0)×P0_fx×ER0' : 'Q+:×P1_krw / Q-:×P0_krw',
      value: kpis.qtyVariance,
      pct: kpis.qtyPct,
    },
    {
      num: '②',
      label: '단가 차이',
      formula: isModelA ? '(P1-P0)×Q1×ER0' : '총차이-①-③',
      value: kpis.priceVariance,
      pct: kpis.pricePct,
    },
    {
      num: '③',
      label: '환율 차이',
      formula: kpis.allKrw ? 'KRW 해당없음' : (isModelA ? '(ER1-ER0)×Q1×P1_fx' : '4-Case'),
      value: kpis.allKrw ? 0 : kpis.fxVariance,
      pct: kpis.allKrw ? 0 : kpis.fxPct,
    },
  ];

  return (
    <div className="space-y-2">
      {factors.map((f) => {
        const isPositive = f.value >= 0;
        const color = isPositive ? '#34d399' : '#f87171';
        const bgColor = isPositive ? 'rgba(52,211,153,0.06)' : 'rgba(248,113,113,0.06)';
        const borderColor = isPositive ? 'rgba(52,211,153,0.18)' : 'rgba(248,113,113,0.18)';
        const barWidth = Math.min(100, (Math.abs(f.value) / maxAbs) * 100);

        return (
          <div
            key={f.num}
            className="p-3 rounded-lg"
            style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }}
          >
            <div className="flex justify-between items-center mb-2">
              <div>
                <span className="text-sm font-semibold text-foreground-muted">{f.num} {f.label}</span>
                <span className="text-[10px] text-foreground-subtle ml-2 font-mono">{f.formula}</span>
              </div>
              <div className="text-right">
                <span className="text-base font-bold" style={{ color }}>
                  {f.value >= 0 ? '+' : ''}{(f.value / 1_000_000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}M
                </span>
                <span className="text-xs ml-2" style={{ color, opacity: 0.8 }}>
                  {formatPercent(f.pct)}
                </span>
              </div>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${barWidth}%`, backgroundColor: color, opacity: 0.75 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
