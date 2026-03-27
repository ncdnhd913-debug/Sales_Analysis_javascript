'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useDataStore } from '@/stores/useDataStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { calculateKpis } from '@/lib/models';
import { RadioGroup, Expander } from './ui';
import { formatNumber } from '@/lib/constants';

export function WaterfallChart() {
  const { summary, period, model, waterfallUnit, setWaterfallUnit } = useDataStore();
  const { selectedGroups, buildGroups } = useGroupStore();

  const kpis = useMemo(() => {
    const allItems = summary.map((r) => r.품목명);
    const groups = buildGroups(allItems);
    const selectedItems = Array.from(selectedGroups).flatMap((gn) => groups[gn] || []);
    if (selectedItems.length === 0) return calculateKpis(summary);
    return calculateKpis(summary, selectedItems);
  }, [summary, selectedGroups, buildGroups]);

  const useM = waterfallUnit === '백만원';
  const DIV = useM ? 1_000_000 : 1;

  const chartData = useMemo(() => {
    const base = kpis.totalBase / DIV;
    const qty = kpis.qtyVariance / DIV;
    const price = kpis.priceVariance / DIV;
    const fx = kpis.fxVariance / DIV;
    const curr = kpis.totalCurr / DIV;

    return [
      { name: `기준 매출\n(${period.baseLabel})`, value: base, base: 0, isEndpoint: true },
      { name: '① 수량 차이', value: qty, base: base, isEndpoint: false },
      { name: '② 단가 차이', value: price, base: base + qty, isEndpoint: false },
      { name: '③ 환율 차이', value: fx, base: base + qty + price, isEndpoint: false },
      { name: `실적 매출\n(${period.currLabel})`, value: curr, base: 0, isEndpoint: true },
    ];
  }, [kpis, DIV, period]);

  const getBarColor = (value: number, isEndpoint: boolean) => {
    if (isEndpoint) return value === chartData[0].value ? '#6366f1' : '#38bdf8';
    return value >= 0 ? '#34d399' : '#f87171';
  };

  const formatValue = (value: number, isEndpoint: boolean) => {
    const formatted = useM ? value.toFixed(1) : formatNumber(value);
    if (isEndpoint) return formatted;
    return value >= 0 ? `▲ +${formatted}` : `▼ ${formatted}`;
  };

  const totalDiff = kpis.totalDiff;
  const diffPct = kpis.totalBase !== 0 ? (totalDiff / kpis.totalBase * 100) : 0;

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-foreground-muted">
          {period.baseLabel} → {period.currLabel} · 총차이{' '}
          <span className={totalDiff >= 0 ? 'text-success' : 'text-danger'}>
            {totalDiff >= 0 ? '▲ +' : '▼ '}
            {useM ? (totalDiff / 1_000_000).toFixed(1) : formatNumber(totalDiff)}
            {waterfallUnit} ({diffPct >= 0 ? '+' : ''}{diffPct.toFixed(1)}%)
          </span>
        </div>
        <RadioGroup
          name="waterfallUnit"
          value={waterfallUnit}
          onChange={(v) => setWaterfallUnit(v as '백만원' | '원')}
          options={[
            { value: '백만원', label: '백만원' },
            { value: '원', label: '원' },
          ]}
          horizontal
        />
      </div>

      {/* 차트 */}
      <div className="h-[400px] bg-[#0d0d1f] rounded-xl p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 40, right: 30, left: 20, bottom: 20 }}>
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fill: '#475569', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v.toLocaleString()}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a2e',
                border: '1px solid rgba(124,58,237,0.3)',
                borderRadius: '8px',
                color: '#e2e8f0',
              }}
              formatter={(value: number) => [
                `${value >= 0 ? '+' : ''}${useM ? value.toFixed(1) : formatNumber(value)} ${waterfallUnit}`,
                '',
              ]}
            />
            <ReferenceLine y={0} stroke="rgba(124,58,237,0.3)" />
            
            {/* 기준선 (투명) */}
            <Bar dataKey="base" stackId="a" fill="transparent" />
            
            {/* 값 바 */}
            <Bar
              dataKey="value"
              stackId="a"
              radius={[4, 4, 0, 0]}
              label={{
                position: 'top',
                fill: '#e2e8f0',
                fontSize: 11,
                formatter: (value: number, entry: { payload: { isEndpoint: boolean } }) =>
                  formatValue(value, entry?.payload?.isEndpoint ?? false),
              }}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={getBarColor(entry.value, entry.isEndpoint)} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 계산 근거 데이터 */}
      <WaterfallCalcDetail kpis={kpis} period={period} isModelA={model === 'A'} />
    </div>
  );
}

// 계산 근거 상세 테이블
function WaterfallCalcDetail({
  kpis,
  period,
  isModelA,
}: {
  kpis: ReturnType<typeof calculateKpis>;
  period: { baseLabel: string; currLabel: string };
  isModelA: boolean;
}) {
  const sign = (v: number) => (v >= 0 ? `+${formatNumber(v)}` : formatNumber(v));
  const pct = (v: number, base: number) => (base !== 0 ? `(${v / base * 100 >= 0 ? '+' : ''}${(v / base * 100).toFixed(1)}%)` : '');

  const totalDiff = kpis.totalDiff;
  const checkSum = kpis.qtyVariance + kpis.priceVariance + kpis.fxVariance;
  const isValid = Math.abs(checkSum - totalDiff) < 1;

  const rows = [
    { label: '기준 매출', value: formatNumber(kpis.totalBase), desc: `${period.baseLabel} 원화매출 합계`, note: '' },
    { label: '① 수량 차이', value: sign(kpis.qtyVariance), desc: '수량 변동에 의한 매출 증감', note: isModelA ? '기준단가×수량변화' : '실적/기준단가×수량변화' },
    { label: '② 단가 차이', value: sign(kpis.priceVariance), desc: '단가 변동에 의한 매출 증감', note: isModelA ? '(P실적−P기준)×Q실적×ER기준' : '총차이−①−③' },
    { label: '③ 환율 차이', value: sign(kpis.fxVariance), desc: '환율 변동에 의한 매출 증감', note: isModelA ? '(ER실적−ER기준)×Q실적×P실적_fx' : '4-Case 분기' },
    { label: '실적 매출', value: formatNumber(kpis.totalCurr), desc: `${period.currLabel} 원화매출 합계`, note: '' },
    { label: '▶ 총 차이', value: sign(totalDiff), desc: `실적−기준 ${pct(totalDiff, kpis.totalBase)}`, note: '①+②+③ = 총차이 검증' },
  ];

  return (
    <Expander title="🔢 Waterfall 계산 근거 데이터">
      <div
        className={`mb-3 p-3 rounded-lg text-sm font-bold ${isValid ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}
      >
        {isValid
          ? `✅ 항등식 검증 통과: ①+②+③ = 총차이 (${sign(checkSum)}원)`
          : '⚠️ 항등식 오차 발생'}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-primary-500/20">
              <th className="text-left py-2 px-3 text-foreground-muted font-medium">구분</th>
              <th className="text-right py-2 px-3 text-foreground-muted font-medium">금액 (원)</th>
              <th className="text-left py-2 px-3 text-foreground-muted font-medium">설명</th>
              <th className="text-left py-2 px-3 text-foreground-muted font-medium">비고</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-primary-500/10">
                <td className="py-2 px-3 text-foreground">{row.label}</td>
                <td className="py-2 px-3 text-right font-mono text-foreground">{row.value}</td>
                <td className="py-2 px-3 text-foreground-muted">{row.desc}</td>
                <td className="py-2 px-3 text-foreground-subtle text-xs">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Expander>
  );
}
